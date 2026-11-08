import "server-only";
import { getAccessToken, getServiceAccount } from "@/lib/googleAuth";

// Google Search Console API client authenticated with a service account
// (token minting lives in lib/googleAuth, shared with the Analytics client).
//
// Setup (one-time, see .env.example):
//   1. Google Cloud Console -> create a service account, enable the
//      "Google Search Console API".
//   2. Create a JSON key and paste it into GSC_SERVICE_ACCOUNT_JSON.
//   3. In Search Console -> Settings -> Users and permissions, add the
//      service account email as a user (Full permission recommended so the
//      URL Inspection API works).

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export function getSiteUrl(): string {
  return process.env.GSC_SITE_URL || "sc-domain:pregnawell.com";
}

export function isGscConfigured(): boolean {
  return getServiceAccount() !== null;
}

async function gscFetch<T>(url: string, body?: unknown): Promise<T> {
  const token = await getAccessToken(SCOPE);
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

export type SearchDimension = "date" | "query" | "page" | "country" | "device" | "searchAppearance";

// "web" is the default Search results tab; the others are reported separately
// by Google. discover / googleNews don't support the query dimension.
export type SearchType = "web" | "image" | "video" | "news" | "discover" | "googleNews";

export async function querySearchAnalytics(options: {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions?: SearchDimension[];
  rowLimit?: number; // API max is 25,000 per request
  searchType?: SearchType;
}): Promise<SearchAnalyticsRow[]> {
  const site = encodeURIComponent(getSiteUrl());
  const data = await gscFetch<{ rows?: SearchAnalyticsRow[] }>(
    `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
    {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions ?? [],
      rowLimit: Math.min(options.rowLimit ?? 1000, 25000),
      type: options.searchType ?? "web",
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
