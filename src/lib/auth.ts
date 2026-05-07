import "server-only";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pw_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getKey(): Buffer {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD is not set. Set it on Railway (or in .env.local) to enable the admin panel."
    );
  }
  // Derive HMAC key from the admin password — sessions invalidate when password rotates.
  return createHmac("sha256", "pregnawell-session-v1").update(password).digest();
}

function sign(payload: string): string {
  return createHmac("sha256", getKey()).update(payload).digest("hex");
}

export function makeSessionToken(): string {
  const issued = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(12).toString("hex");
  const payload = `${issued}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [issuedStr, nonce, sig] = parts;
  const issued = Number(issuedStr);
  if (!Number.isFinite(issued)) return false;
  if (Date.now() / 1000 - issued > MAX_AGE_SECONDS) return false;
  const expected = sign(`${issuedStr}.${nonce}`);
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    // length-mismatch — make the timing similar by comparing against equal-length buffer
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function setSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, makeSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}
