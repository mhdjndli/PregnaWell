import "server-only";
import { getAccessToken, getServiceAccount } from "@/lib/googleAuth";

// Google Analytics 4 Data API client, authenticated with the same service
// account as Search Console (see lib/googleAuth).
//
// Setup (one-time, see .env.example):
//   1. Google Cloud Console (same project as the Search Console service
//      account) -> enable the "Google Analytics Data API".
//   2. GA -> Admin -> Property access management -> add the service account
//      email with the Viewer role.
//   3. Set GA_PROPERTY_ID to the numeric property ID (GA -> Admin -> Property
//      details). This is not the G-XXXX measurement ID.

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const API = "https://analyticsdata.googleapis.com/v1beta";

export function getPropertyId(): string | null {
  const id = process.env.GA_PROPERTY_ID?.trim().replace(/^properties\//, "");
  return id && /^\d+$/.test(id) ? id : null;
}

export function isGaConfigured(): boolean {
  return getPropertyId() !== null && getServiceAccount() !== null;
}

export type DateRange = { startDate: string; endDate: string; name?: string };

export type FilterExpression =
  | { filter: { fieldName: string; stringFilter: { value: string; matchType?: "EXACT" | "BEGINS_WITH" | "CONTAINS" } } }
  | { filter: { fieldName: string; inListFilter: { values: string[] } } }
  | { andGroup: { expressions: FilterExpression[] } }
  | { notExpression: FilterExpression };

export type ReportRequest = {
  dateRanges?: DateRange[];
  dimensions?: string[];
  metrics: string[];
  orderBy?: { metric?: string; dimension?: string; desc?: boolean };
  dimensionFilter?: FilterExpression;
  limit?: number;
};

// A parsed report row: dimension and metric values keyed by API name. With
// several date ranges, `dimensions.dateRange` holds the range's name.
export type ReportRow = {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
};

type RawReport = {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
};

// GA caps concurrent requests per property (10 on standard properties, and
// each report inside a batch counts). Every call goes through this
// process-wide gate so a page load, the realtime refresh and a second admin
// tab together never exceed it.
const MAX_CONCURRENT = 4;
let active = 0;
const waiting: (() => void)[] = [];

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiting.push(resolve));
}

function release() {
  // Hand the slot straight to the next waiter so nobody can jump the queue.
  const next = waiting.shift();
  if (next) next();
  else active--;
}

async function gaFetch<T>(path: string, body: unknown): Promise<T> {
  const propertyId = getPropertyId();
  if (!propertyId) {
    throw new Error("Google Analytics is not configured. Set GA_PROPERTY_ID to the numeric GA4 property ID.");
  }
  await acquire();
  try {
    for (let attempt = 1; ; attempt++) {
      const token = await getAccessToken(SCOPE);
      const res = await fetch(`${API}/properties/${propertyId}:${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as T & {
        error?: { code?: number; message?: string; status?: string };
      };
      if (res.ok) return data;

      const message = data.error?.message ?? `HTTP ${res.status}`;
      // Concurrency limits clear as soon as in-flight requests finish (ours or
      // another tab's), so back off briefly and retry. Hourly/daily token
      // quotas won't clear that fast, so those fail straight away.
      if (res.status === 429 && /concurrent/i.test(message) && attempt < 4) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      if (res.status === 403) {
        throw new Error(
          `Google Analytics denied access (${message}). Make sure the "Google Analytics Data API" is enabled in the service account's Cloud project, and the service account email was added as a Viewer in GA -> Admin -> Property access management for property ${propertyId}.`
        );
      }
      throw new Error(`Google Analytics API error: ${message}`);
    }
  } finally {
    release();
  }
}

function toApiRequest(r: ReportRequest) {
  return {
    dateRanges: r.dateRanges,
    dimensions: (r.dimensions ?? []).map((name) => ({ name })),
    metrics: r.metrics.map((name) => ({ name })),
    dimensionFilter: r.dimensionFilter,
    limit: String(r.limit ?? 1000),
    orderBys: r.orderBy
      ? [
          r.orderBy.metric
            ? { metric: { metricName: r.orderBy.metric }, desc: r.orderBy.desc ?? true }
            : { dimension: { dimensionName: r.orderBy.dimension! }, desc: r.orderBy.desc ?? false },
        ]
      : undefined,
  };
}

function parseReport(report: RawReport): ReportRow[] {
  const dims = (report.dimensionHeaders ?? []).map((h) => h.name);
  const mets = (report.metricHeaders ?? []).map((h) => h.name);
  return (report.rows ?? []).map((row) => ({
    dimensions: Object.fromEntries(dims.map((d, i) => [d, row.dimensionValues?.[i]?.value ?? ""])),
    metrics: Object.fromEntries(mets.map((m, i) => [m, Number(row.metricValues?.[i]?.value ?? 0) || 0])),
  }));
}

// One request per report: batching doesn't help with GA's concurrency cap
// (each report in a batch counts), and single reports queue fairly behind
// the gate in gaFetch.
export async function runReports(requests: ReportRequest[]): Promise<ReportRow[][]> {
  return Promise.all(requests.map((r) => gaFetch<RawReport>("runReport", toApiRequest(r)).then(parseReport)));
}

// Realtime covers the last 30 minutes and has its own (smaller) dimension and
// metric set: e.g. unifiedScreenName, country, deviceCategory, minutesAgo.
export async function runRealtimeReport(r: Omit<ReportRequest, "dateRanges">): Promise<ReportRow[]> {
  const data = await gaFetch<RawReport>("runRealtimeReport", toApiRequest(r));
  return parseReport(data);
}
