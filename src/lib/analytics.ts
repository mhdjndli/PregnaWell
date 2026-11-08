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

async function gaFetch<T>(path: string, body: unknown): Promise<T> {
  const propertyId = getPropertyId();
  if (!propertyId) {
    throw new Error("Google Analytics is not configured. Set GA_PROPERTY_ID to the numeric GA4 property ID.");
  }
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
  if (!res.ok) {
    const message = data.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 403) {
      throw new Error(
        `Google Analytics denied access (${message}). Make sure the "Google Analytics Data API" is enabled in the service account's Cloud project, and the service account email was added as a Viewer in GA -> Admin -> Property access management for property ${propertyId}.`
      );
    }
    throw new Error(`Google Analytics API error: ${message}`);
  }
  return data;
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

// The API accepts at most 5 reports per batch. Batches run in parallel; a few
// concurrent requests stay well under GA's per-property concurrency cap.
export async function runReports(requests: ReportRequest[]): Promise<ReportRow[][]> {
  const chunks: ReportRequest[][] = [];
  for (let i = 0; i < requests.length; i += 5) chunks.push(requests.slice(i, i + 5));
  const batches = await Promise.all(
    chunks.map((chunk) =>
      gaFetch<{ reports?: RawReport[] }>("batchRunReports", { requests: chunk.map(toApiRequest) })
    )
  );
  return batches.flatMap((data, i) => chunks[i].map((_, j) => parseReport(data.reports?.[j] ?? {})));
}

// Realtime covers the last 30 minutes and has its own (smaller) dimension and
// metric set: e.g. unifiedScreenName, country, deviceCategory, minutesAgo.
export async function runRealtimeReport(r: Omit<ReportRequest, "dateRanges">): Promise<ReportRow[]> {
  const data = await gaFetch<RawReport>("runRealtimeReport", toApiRequest(r));
  return parseReport(data);
}
