import "server-only";
import { ensureInitialized, getPool } from "@/lib/db";
import { getPublicPosts } from "@/lib/blog";
import { countryAlpha2, countryName } from "@/lib/countryCodes";
import { locales } from "@/lib/i18n";
import {
  getSiteUrl,
  listSitemaps,
  querySearchAnalytics,
  type SearchAnalyticsRow,
  type SearchType,
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

export type Metrics = { clicks: number; impressions: number; ctr: number; position: number };
export type Totals = Metrics;

const ZERO: Metrics = { clicks: 0, impressions: 0, ctr: 0, position: 0 };

export type QueryStat = Metrics & { query: string; previous: Metrics | null };
export type PageStat = Metrics & { url: string; path: string; previous: Metrics | null };
export type QueryPageStat = Metrics & { query: string; url: string; path: string };
export type CountryStat = Metrics & { code: string; alpha2: string | null; name: string };
export type DeviceStat = Metrics & { device: string };
export type AppearanceStat = Metrics & { appearance: string; label: string };
export type SearchTypeStat = Metrics & { type: SearchType; error: string | null };

// A query in "striking distance": ranking 4–20 with real impressions, where
// moving into the top 3 would add the most clicks.
export type Opportunity = QueryStat & { estimatedExtraClicks: number };
// A page-one page whose CTR is under half the typical CTR for its position:
// usually a title / meta description problem, not a ranking problem.
export type LowCtrPage = PageStat & { expectedCtr: number };
// Several of our pages splitting the impressions for the same query.
export type Cannibalization = { query: string; clicks: number; impressions: number; pages: QueryPageStat[] };
export type QueryMove = {
  query: string;
  current: Metrics | null;
  previous: Metrics | null;
  clicksChange: number;
  impressionsChange: number;
};
// One published article joined with its search performance (zeroes when
// Google hasn't shown it at all in the window).
export type ContentStat = {
  url: string;
  path: string;
  title: string;
  language: string;
  category: string | null;
  publishAt: string | null;
  updatedAt: string;
  current: Metrics;
  previous: Metrics;
  topQueries: { query: string; clicks: number; impressions: number; position: number }[];
};

export type GscPerformanceSummary = {
  site: string;
  days: RangeDays;
  range: { start: string; end: string; prevStart: string; prevEnd: string };
  totals: { current: Totals; previous: Totals };
  series: { date: string; clicks: number; impressions: number; ctr: number; position: number }[];
  // First 10 rows of queries / pages, kept for older partner integrations.
  topQueries: SearchAnalyticsRow[];
  topPages: SearchAnalyticsRow[];
  queries: QueryStat[];
  pages: PageStat[];
  queryPages: QueryPageStat[];
  countries: CountryStat[];
  devices: DeviceStat[];
  searchAppearance: AppearanceStat[];
  searchTypes: SearchTypeStat[];
  // Google withholds rare queries for privacy; this is the gap between the
  // site totals and the sum of the query rows. `exact` is false when the
  // query list hit the row limit, so part of the gap is just truncation.
  hiddenQueries: { clicks: number; impressions: number; clickShare: number; impressionShare: number; exact: boolean };
  insights: {
    opportunities: Opportunity[];
    lowCtrPages: LowCtrPage[];
    cannibalization: Cannibalization[];
    risingQueries: QueryMove[];
    decliningQueries: QueryMove[];
    newQueries: QueryMove[];
    lostQueries: QueryMove[];
  };
  content: ContentStat[];
  limits: { queries: number; pages: number; queryPages: number; minImpressions: number };
  sitemaps: SitemapInfo[];
};

const QUERY_LIMIT = 5000;
const PAGE_LIMIT = 5000;
const QUERY_PAGE_LIMIT = 10000;
const INSIGHT_LIMIT = 100;
const MOVER_LIMIT = 50;

// Typical organic CTR by position 1–10 (industry averages, and AI Overviews
// push real numbers lower). Only used to rank opportunities, never shown as
// a fact.
const CTR_CURVE = [0.28, 0.15, 0.11, 0.08, 0.07, 0.05, 0.04, 0.03, 0.03, 0.025];

export function expectedCtr(position: number): number {
  const rank = Math.max(1, Math.round(position));
  return rank <= CTR_CURVE.length ? CTR_CURVE[rank - 1] : 0.01;
}

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

function metricsOf(r: SearchAnalyticsRow): Metrics {
  return { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// "/ar/blog/<arabic slug>" for apex URLs; other hosts (the old www) keep
// their host so they don't read as the same page.
export function displayPath(url: string): string {
  try {
    const u = new URL(url);
    const path = safeDecode(u.pathname) + safeDecode(u.search);
    return u.hostname === "pregnawell.com" ? path : `${u.hostname}${path}`;
  } catch {
    return url;
  }
}

function contentKey(url: string): string {
  try {
    return safeDecode(new URL(url).pathname).replace(/\/+$/, "") || "/";
  } catch {
    return url;
  }
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const SEARCH_TYPES: SearchType[] = ["web", "image", "video", "news", "discover", "googleNews"];

// The dashboard and the partner feed can be hit repeatedly; Google refreshes
// this data a few times a day, so a short in-process cache saves quota.
const CACHE_TTL_MS = 5 * 60_000;
const summaryCache = new Map<RangeDays, { at: number; promise: Promise<GscPerformanceSummary> }>();

export function getPerformanceSummary(days: RangeDays): Promise<GscPerformanceSummary> {
  const hit = summaryCache.get(days);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.promise;
  const promise = buildPerformanceSummary(days);
  summaryCache.set(days, { at: Date.now(), promise });
  promise.catch(() => summaryCache.delete(days));
  return promise;
}

async function buildPerformanceSummary(days: RangeDays): Promise<GscPerformanceSummary> {
  const range = rangeDates(days);
  const { start, end, prevStart, prevEnd } = range;
  const cur = { startDate: start, endDate: end };
  const prev = { startDate: prevStart, endDate: prevEnd };
  const [
    dailyRows,
    currentRows,
    previousRows,
    queryRows,
    prevQueryRows,
    pageRows,
    prevPageRows,
    queryPageRows,
    countryRows,
    deviceRows,
    appearanceRows,
    searchTypes,
    sitemaps,
    posts,
  ] = await Promise.all([
    querySearchAnalytics({ ...cur, dimensions: ["date"] }),
    querySearchAnalytics(cur),
    querySearchAnalytics(prev),
    querySearchAnalytics({ ...cur, dimensions: ["query"], rowLimit: QUERY_LIMIT }),
    querySearchAnalytics({ ...prev, dimensions: ["query"], rowLimit: QUERY_LIMIT }),
    querySearchAnalytics({ ...cur, dimensions: ["page"], rowLimit: PAGE_LIMIT }),
    querySearchAnalytics({ ...prev, dimensions: ["page"], rowLimit: PAGE_LIMIT }),
    querySearchAnalytics({ ...cur, dimensions: ["query", "page"], rowLimit: QUERY_PAGE_LIMIT }),
    querySearchAnalytics({ ...cur, dimensions: ["country"], rowLimit: 300 }),
    querySearchAnalytics({ ...cur, dimensions: ["device"] }),
    querySearchAnalytics({ ...cur, dimensions: ["searchAppearance"] }).catch(() => []),
    Promise.all(
      SEARCH_TYPES.map(async (type): Promise<SearchTypeStat> => {
        try {
          const rows = await querySearchAnalytics({ ...cur, searchType: type });
          return { type, ...(rows[0] ? metricsOf(rows[0]) : ZERO), error: null };
        } catch (err) {
          return { type, ...ZERO, error: (err as Error).message };
        }
      })
    ),
    listSitemaps(),
    Promise.all(locales.map((l) => getPublicPosts(l))).then((lists) => lists.flat()),
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
    series.push({
      date: key,
      clicks: row?.clicks ?? 0,
      impressions: row?.impressions ?? 0,
      ctr: row?.ctr ?? 0,
      position: row?.position ?? 0,
    });
  }

  const current = totalsOf(currentRows);
  const minImpressions = Math.max(5, Math.round(days / 6));

  // --- Queries and pages, each with its previous-period numbers ----------
  const prevQueries = new Map(prevQueryRows.map((r) => [r.keys?.[0] ?? "", metricsOf(r)]));
  const queries: QueryStat[] = queryRows.map((r) => {
    const query = r.keys?.[0] ?? "";
    return { query, ...metricsOf(r), previous: prevQueries.get(query) ?? null };
  });
  const prevPages = new Map(prevPageRows.map((r) => [r.keys?.[0] ?? "", metricsOf(r)]));
  const pages: PageStat[] = pageRows.map((r) => {
    const url = r.keys?.[0] ?? "";
    return { url, path: displayPath(url), ...metricsOf(r), previous: prevPages.get(url) ?? null };
  });
  const queryPages: QueryPageStat[] = queryPageRows.map((r) => {
    const url = r.keys?.[1] ?? "";
    return { query: r.keys?.[0] ?? "", url, path: displayPath(url), ...metricsOf(r) };
  });

  // --- Breakdowns ----------------------------------------------------------
  const countries: CountryStat[] = countryRows.map((r) => {
    const code = r.keys?.[0] ?? "zzz";
    return { code, alpha2: countryAlpha2(code), name: countryName(code), ...metricsOf(r) };
  });
  const devices: DeviceStat[] = deviceRows.map((r) => ({ device: r.keys?.[0] ?? "", ...metricsOf(r) }));
  const searchAppearance: AppearanceStat[] = appearanceRows.map((r) => {
    const appearance = r.keys?.[0] ?? "";
    return { appearance, label: humanize(appearance), ...metricsOf(r) };
  });

  // --- Hidden (anonymized) queries ----------------------------------------
  const queryTotals = totalsOf(queryRows);
  const hiddenClicks = Math.max(0, current.clicks - queryTotals.clicks);
  const hiddenImpressions = Math.max(0, current.impressions - queryTotals.impressions);
  const hiddenQueries = {
    clicks: hiddenClicks,
    impressions: hiddenImpressions,
    clickShare: current.clicks > 0 ? hiddenClicks / current.clicks : 0,
    impressionShare: current.impressions > 0 ? hiddenImpressions / current.impressions : 0,
    exact: queryRows.length < QUERY_LIMIT,
  };

  // --- Insights ------------------------------------------------------------
  const top3Ctr = expectedCtr(3);
  const opportunities: Opportunity[] = queries
    .filter((q) => q.position >= 4 && q.position <= 20 && q.impressions >= minImpressions)
    .map((q) => ({
      ...q,
      estimatedExtraClicks: Math.max(0, Math.round(q.impressions * top3Ctr - q.clicks)),
    }))
    .sort((a, b) => b.estimatedExtraClicks - a.estimatedExtraClicks || b.impressions - a.impressions)
    .slice(0, INSIGHT_LIMIT);

  const lowCtrPages: LowCtrPage[] = pages
    .filter((p) => p.position <= 10 && p.impressions >= minImpressions)
    .map((p) => ({ ...p, expectedCtr: expectedCtr(p.position) }))
    .filter((p) => p.ctr < p.expectedCtr * 0.5)
    .sort((a, b) => b.impressions * (b.expectedCtr - b.ctr) - a.impressions * (a.expectedCtr - a.ctr))
    .slice(0, INSIGHT_LIMIT);

  const pagesByQuery = new Map<string, QueryPageStat[]>();
  for (const qp of queryPages) {
    const list = pagesByQuery.get(qp.query);
    if (list) list.push(qp);
    else pagesByQuery.set(qp.query, [qp]);
  }
  const cannibalization: Cannibalization[] = [];
  for (const [query, list] of pagesByQuery) {
    if (list.length < 2) continue;
    const impressions = list.reduce((s, r) => s + r.impressions, 0);
    if (impressions < minImpressions) continue;
    // Ignore pages that only picked up a stray impression or two.
    const competing = list
      .filter((r) => r.impressions >= 2 && r.impressions / impressions >= 0.1)
      .sort((a, b) => b.impressions - a.impressions);
    if (competing.length < 2) continue;
    cannibalization.push({
      query,
      clicks: list.reduce((s, r) => s + r.clicks, 0),
      impressions,
      pages: competing,
    });
  }
  cannibalization.sort((a, b) => b.impressions - a.impressions);

  const curQueries = new Map(queries.map((q) => [q.query, metricsOf(q)]));
  const moves: QueryMove[] = [];
  for (const query of new Set([...curQueries.keys(), ...prevQueries.keys()])) {
    const c = curQueries.get(query) ?? null;
    const p = prevQueries.get(query) ?? null;
    moves.push({
      query,
      current: c,
      previous: p,
      clicksChange: (c?.clicks ?? 0) - (p?.clicks ?? 0),
      impressionsChange: (c?.impressions ?? 0) - (p?.impressions ?? 0),
    });
  }
  const byGain = (a: QueryMove, b: QueryMove) =>
    b.clicksChange - a.clicksChange || b.impressionsChange - a.impressionsChange;
  const isMove = (m: QueryMove) => m.clicksChange !== 0 || Math.abs(m.impressionsChange) >= minImpressions;
  const risingQueries = moves
    .filter((m) => m.current && m.previous && isMove(m) && (m.clicksChange > 0 || (m.clicksChange === 0 && m.impressionsChange > 0)))
    .sort(byGain)
    .slice(0, MOVER_LIMIT);
  const decliningQueries = moves
    .filter((m) => m.current && m.previous && isMove(m) && (m.clicksChange < 0 || (m.clicksChange === 0 && m.impressionsChange < 0)))
    .sort((a, b) => byGain(b, a))
    .slice(0, MOVER_LIMIT);
  const newQueries = moves
    .filter((m) => m.current && !m.previous && m.current.impressions >= minImpressions)
    .sort(byGain)
    .slice(0, MOVER_LIMIT);
  const lostQueries = moves
    .filter((m) => !m.current && m.previous && m.previous.impressions >= minImpressions)
    .sort((a, b) => byGain(b, a))
    .slice(0, MOVER_LIMIT);

  // --- Published articles joined with their performance -------------------
  const pageRowsByKey = new Map<string, SearchAnalyticsRow[]>();
  const prevPageRowsByKey = new Map<string, SearchAnalyticsRow[]>();
  for (const [rows, map] of [
    [pageRows, pageRowsByKey],
    [prevPageRows, prevPageRowsByKey],
  ] as const) {
    for (const r of rows) {
      const key = contentKey(r.keys?.[0] ?? "");
      const list = map.get(key);
      if (list) list.push(r);
      else map.set(key, [r]);
    }
  }
  const queriesByKey = new Map<string, QueryPageStat[]>();
  for (const qp of queryPages) {
    const key = contentKey(qp.url);
    const list = queriesByKey.get(key);
    if (list) list.push(qp);
    else queriesByKey.set(key, [qp]);
  }
  const content: ContentStat[] = posts.map((post) => {
    const url = `https://pregnawell.com/${post.language}/blog/${encodeURIComponent(post.slug)}`;
    const key = contentKey(url);
    // Sum across hosts so www-era impressions still count for the article.
    const curRows = pageRowsByKey.get(key) ?? [];
    const prevRows = prevPageRowsByKey.get(key) ?? [];
    const topQueries = new Map<string, { query: string; clicks: number; impressions: number; weighted: number }>();
    for (const qp of queriesByKey.get(key) ?? []) {
      const t = topQueries.get(qp.query) ?? { query: qp.query, clicks: 0, impressions: 0, weighted: 0 };
      t.clicks += qp.clicks;
      t.impressions += qp.impressions;
      t.weighted += qp.position * qp.impressions;
      topQueries.set(qp.query, t);
    }
    return {
      url,
      path: displayPath(url),
      title: post.title,
      language: post.language,
      category: post.category,
      publishAt: post.publishAt,
      updatedAt: post.updatedAt,
      current: curRows.length ? totalsOf(curRows) : ZERO,
      previous: prevRows.length ? totalsOf(prevRows) : ZERO,
      topQueries: [...topQueries.values()]
        .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
        .slice(0, 5)
        .map((t) => ({
          query: t.query,
          clicks: t.clicks,
          impressions: t.impressions,
          position: t.impressions > 0 ? t.weighted / t.impressions : 0,
        })),
    };
  });
  content.sort((a, b) => b.current.clicks - a.current.clicks || b.current.impressions - a.current.impressions);

  return {
    site: getSiteUrl(),
    days,
    range,
    totals: { current, previous: totalsOf(previousRows) },
    series,
    topQueries: queryRows.slice(0, 10),
    topPages: pageRows.slice(0, 10),
    queries,
    pages,
    queryPages,
    countries,
    devices,
    searchAppearance,
    searchTypes,
    hiddenQueries,
    insights: {
      opportunities,
      lowCtrPages,
      cannibalization: cannibalization.slice(0, INSIGHT_LIMIT),
      risingQueries,
      decliningQueries,
      newQueries,
      lostQueries,
    },
    content,
    limits: { queries: QUERY_LIMIT, pages: PAGE_LIMIT, queryPages: QUERY_PAGE_LIMIT, minImpressions },
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
