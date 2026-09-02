import "server-only";
import { createSign } from "node:crypto";

// Google Search Console API client authenticated with a service account.
// No SDK dependency: we mint the OAuth2 access token ourselves by signing a
// JWT with the service account's private key (RS256) and exchanging it at
// Google's token endpoint.
//
// Setup (one-time, see .env.example):
//   1. Google Cloud Console -> create a service account, enable the
//      "Google Search Console API".
//   2. Create a JSON key and paste it into GSC_SERVICE_ACCOUNT_JSON.
//   3. In Search Console -> Settings -> Users and permissions, add the
//      service account email as a user (Full permission recommended so the
//      URL Inspection API works).

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

type ServiceAccount = { clientEmail: string; privateKey: string };

export function getSiteUrl(): string {
  return process.env.GSC_SITE_URL || "sc-domain:pregnawell.com";
}

function getServiceAccount(): ServiceAccount | null {
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

export function isGscConfigured(): boolean {
  return getServiceAccount() !== null;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }
  const account = getServiceAccount();
  if (!account) {
    throw new Error(
      "Search Console is not configured. Set GSC_SERVICE_ACCOUNT_JSON (or GSC_SERVICE_ACCOUNT_EMAIL + GSC_SERVICE_ACCOUNT_PRIVATE_KEY)."
    );
  }
  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: account.clientEmail,
      scope: SCOPE,
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
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.token;
}

async function gscFetch<T>(url: string, body?: unknown): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    error?: { code?: number; message?: string; status?: string };
  };
  if (!res.ok) {
    const message = data.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 403) {
      throw new Error(
        `Search Console denied access (${message}). Make sure the service account email was added as a user on the ${getSiteUrl()} property in Search Console -> Settings -> Users and permissions.`
      );
    }
    throw new Error(`Search Console API error: ${message}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Search analytics (performance: clicks / impressions / CTR / position)
// ---------------------------------------------------------------------------

export type SearchAnalyticsRow = {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export async function querySearchAnalytics(options: {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions?: ("date" | "query" | "page" | "country" | "device")[];
  rowLimit?: number;
}): Promise<SearchAnalyticsRow[]> {
  const site = encodeURIComponent(getSiteUrl());
  const data = await gscFetch<{ rows?: SearchAnalyticsRow[] }>(
    `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
    {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions ?? [],
      rowLimit: options.rowLimit ?? 1000,
      dataState: "all",
    }
  );
  return data.rows ?? [];
}

// ---------------------------------------------------------------------------
// URL inspection (indexing status per page)
// ---------------------------------------------------------------------------

export type UrlInspectionResult = {
  verdict: string; // PASS | NEUTRAL | FAIL | VERDICT_UNSPECIFIED
  coverageState: string; // e.g. "Submitted and indexed"
  robotsTxtState: string;
  indexingState: string;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
  inspectionResultLink: string | null;
};

export async function inspectUrl(inspectionUrl: string): Promise<UrlInspectionResult> {
  const data = await gscFetch<{
    inspectionResult?: {
      inspectionResultLink?: string;
      indexStatusResult?: {
        verdict?: string;
        coverageState?: string;
        robotsTxtState?: string;
        indexingState?: string;
        lastCrawlTime?: string;
        googleCanonical?: string;
      };
    };
  }>("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    inspectionUrl,
    siteUrl: getSiteUrl(),
  });
  const status = data.inspectionResult?.indexStatusResult ?? {};
  return {
    verdict: status.verdict ?? "VERDICT_UNSPECIFIED",
    coverageState: status.coverageState ?? "Unknown",
    robotsTxtState: status.robotsTxtState ?? "",
    indexingState: status.indexingState ?? "",
    lastCrawlTime: status.lastCrawlTime ?? null,
    googleCanonical: status.googleCanonical ?? null,
    inspectionResultLink: data.inspectionResult?.inspectionResultLink ?? null,
  };
}

// ---------------------------------------------------------------------------
// Sitemaps
// ---------------------------------------------------------------------------

export type SitemapInfo = {
  path: string;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  isPending: boolean;
  errors: number;
  warnings: number;
  submittedUrls: number;
};

export async function listSitemaps(): Promise<SitemapInfo[]> {
  const site = encodeURIComponent(getSiteUrl());
  const data = await gscFetch<{
    sitemap?: {
      path?: string;
      lastSubmitted?: string;
      lastDownloaded?: string;
      isPending?: boolean;
      errors?: string | number;
      warnings?: string | number;
      contents?: { type?: string; submitted?: string | number }[];
    }[];
  }>(`https://www.googleapis.com/webmasters/v3/sites/${site}/sitemaps`);
  return (data.sitemap ?? []).map((s) => ({
    path: s.path ?? "",
    lastSubmitted: s.lastSubmitted ?? null,
    lastDownloaded: s.lastDownloaded ?? null,
    isPending: s.isPending ?? false,
    errors: Number(s.errors ?? 0),
    warnings: Number(s.warnings ?? 0),
    submittedUrls: (s.contents ?? []).reduce((sum, c) => sum + Number(c.submitted ?? 0), 0),
  }));
}
