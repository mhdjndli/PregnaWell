import "server-only";
import { createSign } from "node:crypto";

// Shared Google service-account auth for the Search Console and Analytics
// clients. No SDK dependency: we mint the OAuth2 access token ourselves by
// signing a JWT with the service account's private key (RS256) and
// exchanging it at Google's token endpoint.
//
// One service account serves both integrations. It's configured through the
// GSC_* variables (they predate the Analytics page), see .env.example.

const TOKEN_URL = "https://oauth2.googleapis.com/token";

type ServiceAccount = { clientEmail: string; privateKey: string };

export function getServiceAccount(): ServiceAccount | null {
  const json = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        return { clientEmail: parsed.client_email, privateKey: parsed.private_key };
      }
    } catch {
      // fall through to the split variables
    }
  }
  const email = process.env.GSC_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (email && key) {
    // Railway/env UIs often store the PEM with literal "\n" sequences.
    return { clientEmail: email, privateKey: key.replace(/\\n/g, "\n") };
  }
  return null;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

// Tokens are scope-specific, so each API keeps its own cached token.
const cachedTokens = new Map<string, { token: string; expiresAt: number }>();

export async function getAccessToken(scope: string): Promise<string> {
  const cached = cachedTokens.get(scope);
  if (cached && Date.now() < cached.expiresAt - 60_000) {
    return cached.token;
  }
  const account = getServiceAccount();
  if (!account) {
    throw new Error(
      "Google service account is not configured. Set GSC_SERVICE_ACCOUNT_JSON (or GSC_SERVICE_ACCOUNT_EMAIL + GSC_SERVICE_ACCOUNT_PRIVATE_KEY)."
    );
  }
  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: account.clientEmail,
      scope,
      aud: TOKEN_URL,
      iat,
      exp: iat + 3600,
    })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(account.privateKey).toString("base64url");
  const assertion = `${header}.${claims}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Google token exchange failed: ${data.error ?? res.status} ${data.error_description ?? ""}`.trim()
    );
  }
  cachedTokens.set(scope, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  });
  return data.access_token;
}
