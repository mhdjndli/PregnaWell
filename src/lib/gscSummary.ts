import "server-only";
import { ensureInitialized, getPool } from "@/lib/db";
import {
  getSiteUrl,
  listSitemaps,
  querySearchAnalytics,
  type SearchAnalyticsRow,
  type SitemapInfo,
} from "@/lib/searchConsole";

// Shared assembly of the Search Console dashboard data. Both the admin page
// (/admin/search-console) and the partner API (/api/gsc/summary) build their
// payload here, so the two always show identical numbers.

export const RANGES = [7, 28, 90, 180] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRangeDays(value: unknown): RangeDays {
  const parsed = Number(value);
  return (RANGES as readonly number[]).includes(parsed) ? (parsed as RangeDays) : 28;
}

export type InspectionRecord = {
  url: string;
  verdict: string;
  coverageState: string;
  robotsTxtState: string;
  indexingState: string;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
  // Google indexed the site under www before the host redirect shipped.
  // When the apex URL is not indexed we also inspect the www twin so the
  // panel can show "indexed under www (migrating)" during the handover.
  wwwVerdict: string | null;
  wwwCoverageState: string | null;
  inspectedAt: string;
};

export type Totals = { clicks: number; impressions: number; ctr: number; position: number };

export type GscPerformanceSummary = {
  site: string;
  days: RangeDays;
  range: { start: string; end: string; prevStart: string; prevEnd: string };
  totals: { current: Totals; previous: Totals };
  series: { date: string; clicks: number; impressions: number }[];
  topQueries: SearchAnalyticsRow[];
  topPages: SearchAnalyticsRow[];
  sitemaps: SitemapInfo[];
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function rangeDates(days: RangeDays): GscPerformanceSummary["range"] {
  // Search data lags ~2 days behind; end the window there so the last
  // datapoints aren't misleading zeroes.
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 2);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const prevEnd = new Date(start);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - (days - 1));
  return {
    start: isoDay(start),
    end: isoDay(end),
    prevStart: isoDay(prevStart),
    prevEnd: isoDay(prevEnd),
  };
}

export function totalsOf(rows: SearchAnalyticsRow[]): Totals {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const position =
    impressions > 0
      ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / impressions
      : 0;
  return { clicks, impressions, ctr, position };
}

export async function getPerformanceSummary(days: RangeDays): Promise<GscPerformanceSummary> {
  const range = rangeDates(days);
  const { start, end, prevStart, prevEnd } = range;
  const [dailyRows, currentRows, previousRows, topQueries, topPages, sitemaps] =
    await Promise.all([
      querySearchAnalytics({ startDate: start, endDate: end, dimensions: ["date"] }),
      querySearchAnalytics({ startDate: start, endDate: end }),
      querySearchAnalytics({ startDate: prevStart, endDate: prevEnd }),
      querySearchAnalytics({ startDate: start, endDate: end, dimensions: ["query"], rowLimit: 10 }),
      querySearchAnalytics({ startDate: start, endDate: end, dimensions: ["page"], rowLimit: 10 }),
      listSitemaps(),
    ]);

  const daily = dailyRows.sort((a, b) => (a.keys?.[0] ?? "").localeCompare(b.keys?.[0] ?? ""));

  // Fill missing days with zeroes so the x-axis is continuous.
  const byDate = new Map(daily.map((r) => [r.keys?.[0] ?? "", r]));
  const series: GscPerformanceSummary["series"] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    const key = isoDay(d);
    const row = byDate.get(key);
    series.push({ date: key, clicks: row?.clicks ?? 0, impressions: row?.impressions ?? 0 });
  }

  return {
    site: getSiteUrl(),
    days,
    range,
    totals: { current: totalsOf(currentRows), previous: totalsOf(previousRows) },
    series,
    topQueries,
    topPages,
    sitemaps,
  };
}

// Last known URL Inspection results (the indexing panel's cache). Returns []
// when the DB is unreachable so callers can degrade gracefully.
export async function getCachedInspections(): Promise<InspectionRecord[]> {
  try {
    await ensureInitialized();
    const res = await getPool().query(
      `SELECT url, verdict, coverage_state, robots_txt_state, indexing_state,
              last_crawl_time, google_canonical, www_verdict, www_coverage_state, inspected_at
         FROM gsc_inspections`
    );
    return res.rows.map((r) => ({
      url: r.url,
      verdict: r.verdict,
      coverageState: r.coverage_state,
      robotsTxtState: r.robots_txt_state,
      indexingState: r.indexing_state,
      lastCrawlTime: r.last_crawl_time ? new Date(r.last_crawl_time).toISOString() : null,
      googleCanonical: r.google_canonical,
      wwwVerdict: r.www_verdict ?? null,
      wwwCoverageState: r.www_coverage_state ?? null,
      inspectedAt: new Date(r.inspected_at).toISOString(),
    }));
  } catch {
    return [];
  }
}
