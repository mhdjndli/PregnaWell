import "server-only";
import { getPublicPosts } from "@/lib/blog";
import { locales } from "@/lib/i18n";
import { runRealtimeReport, runReports, type ReportRequest, type ReportRow } from "@/lib/analytics";

// Assembly of the /admin/analytics dashboard: one batched pass over the GA4
// Data API, shaped into totals, a daily series and per-dimension tables.

export type Totals = {
  users: number;
  newUsers: number;
  sessions: number;
  engagedSessions: number;
  engagementRate: number;
  views: number;
  viewsPerSession: number;
  // GA's "average engagement time per active user", in seconds.
  avgEngagement: number;
  avgSessionDuration: number;
  events: number;
  keyEvents: number;
};

// Metrics shown for every dimension table (pages, channels, countries, …).
export type Seg = {
  users: number;
  sessions: number;
  engagementRate: number;
  views: number;
  avgEngagement: number;
  keyEvents: number;
};
export type SegRow = Seg & { key: string; label: string; previous: Seg | null };
export type PageRow = SegRow & { path: string; title: string };
export type CountryRow = SegRow & { alpha2: string | null };
export type CityRow = SegRow & { alpha2: string | null };
export type EventRow = {
  name: string;
  count: number;
  users: number;
  keyEvents: number;
  previous: { count: number; users: number } | null;
};
export type OutboundRow = { domain: string; url: string; clicks: number; users: number };
export type DayPoint = { date: string; users: number; sessions: number; views: number; keyEvents: number };
export type ArticleRow = {
  path: string;
  title: string;
  language: string;
  publishAt: string | null;
  current: Seg;
  previous: Seg | null;
};
export type LocaleShare = { locale: string; views: number; users: number };
// sessions[dayOfWeek 0=Sun][hour 0-23] in the property's time zone.
export type Heatmap = number[][];

export type AnalyticsSummary = {
  days: number;
  generatedAt: string;
  totals: { current: Totals; previous: Totals };
  series: DayPoint[];
  pages: PageRow[];
  landingPages: SegRow[];
  articles: ArticleRow[];
  channels: SegRow[];
  sourceMedium: SegRow[];
  campaigns: SegRow[];
  events: EventRow[];
  outbound: OutboundRow[];
  countries: CountryRow[];
  cities: CityRow[];
  devices: SegRow[];
  operatingSystems: SegRow[];
  browsers: SegRow[];
  languages: SegRow[];
  newVsReturning: SegRow[];
  siteLocales: LocaleShare[];
  heatmap: Heatmap;
};

const CORE_METRICS = [
  "activeUsers",
  "newUsers",
  "sessions",
  "engagedSessions",
  "screenPageViews",
  "userEngagementDuration",
  "averageSessionDuration",
  "eventCount",
  "keyEvents",
];
const SEG_METRICS = [
  "activeUsers",
  "sessions",
  "engagedSessions",
  "screenPageViews",
  "userEngagementDuration",
  "keyEvents",
];

// Ranges include today so a brand-new property shows data immediately; the
// previous range is the same length, immediately before.
function ranges(days: number) {
  return [
    { name: "current", startDate: `${days - 1}daysAgo`, endDate: "today" },
    { name: "previous", startDate: `${2 * days - 1}daysAgo`, endDate: `${days}daysAgo` },
  ];
}

function toTotals(m: Record<string, number> | undefined): Totals {
  const v = (k: string) => m?.[k] ?? 0;
  const sessions = v("sessions");
  const users = v("activeUsers");
  return {
    users,
    newUsers: v("newUsers"),
    sessions,
    engagedSessions: v("engagedSessions"),
    engagementRate: sessions ? v("engagedSessions") / sessions : 0,
    views: v("screenPageViews"),
    viewsPerSession: sessions ? v("screenPageViews") / sessions : 0,
    avgEngagement: users ? v("userEngagementDuration") / users : 0,
    avgSessionDuration: v("averageSessionDuration"),
    events: v("eventCount"),
    keyEvents: v("keyEvents"),
  };
}

function toSeg(m: Record<string, number>): Seg {
  const users = m.activeUsers ?? 0;
  const sessions = m.sessions ?? 0;
  return {
    users,
    sessions,
    engagementRate: sessions ? (m.engagedSessions ?? 0) / sessions : 0,
    views: m.screenPageViews ?? 0,
    avgEngagement: users ? (m.userEngagementDuration ?? 0) / users : 0,
    keyEvents: m.keyEvents ?? 0,
  };
}

// Splits a two-range report into one entry per dimension key with its
// current and previous metrics side by side.
function compare(
  rows: ReportRow[],
  keyOf: (d: Record<string, string>) => string
): Map<string, { dims: Record<string, string>; current: Record<string, number>; previous: Record<string, number> | null }> {
  const out = new Map<
    string,
    { dims: Record<string, string>; current: Record<string, number>; previous: Record<string, number> | null }
  >();
  for (const r of rows) {
    const key = keyOf(r.dimensions);
    const entry = out.get(key) ?? { dims: r.dimensions, current: {}, previous: null };
    if (r.dimensions.dateRange === "previous") entry.previous = r.metrics;
    else {
      entry.current = r.metrics;
      entry.dims = r.dimensions;
    }
    out.set(key, entry);
  }
  return out;
}

function segRows(rows: ReportRow[], dim: string, label: (v: string) => string = (v) => v): SegRow[] {
  const isCompare = rows.some((r) => r.dimensions.dateRange);
  if (!isCompare) {
    return rows.map((r) => ({ ...toSeg(r.metrics), key: r.dimensions[dim], label: label(r.dimensions[dim]), previous: null }));
  }
  return [...compare(rows, (d) => d[dim]).values()]
    .filter((e) => Object.keys(e.current).length > 0)
    .map((e) => ({
      ...toSeg(e.current),
      key: e.dims[dim],
      label: label(e.dims[dim]),
      previous: e.previous ? toSeg(e.previous) : null,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// GA may report Arabic paths percent-encoded; normalize so they match our
// slugs and read naturally in the tables.
function normPath(p: string): string {
  const decoded = safeDecode(p || "/");
  return decoded.length > 1 ? decoded.replace(/\/+$/, "") : decoded;
}

const CHANNEL_LABELS: Record<string, string> = { "(not set)": "Unassigned" };

// In-process cache: GA data refreshes on the order of minutes to hours, and
// each load costs ~17 reports of the property's hourly API quota.
const CACHE_MS = 5 * 60_000;
const cache = new Map<number, { at: number; data: AnalyticsSummary }>();

export async function getAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
  const hit = cache.get(days);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  const both = ranges(days);
  const current = [both[0]];
  const seg = (dimensions: string[], limit = 250, dateRanges = current): ReportRequest => ({
    dateRanges,
    dimensions,
    metrics: SEG_METRICS,
    orderBy: { metric: "sessions" },
    limit,
  });

  const [reports, posts] = await Promise.all([
    runReports([
      { dateRanges: both, metrics: CORE_METRICS },
      {
        dateRanges: current,
        dimensions: ["date"],
        metrics: ["activeUsers", "sessions", "screenPageViews", "keyEvents"],
        orderBy: { dimension: "date" },
        limit: 400,
      },
      { ...seg(["pagePath", "pageTitle"], 5000, both), orderBy: { metric: "screenPageViews" } },
      seg(["landingPage"], 2000, both),
      seg(["sessionDefaultChannelGroup"], 50, both),
      seg(["sessionSourceMedium"], 500, both),
      seg(["sessionCampaignName"], 200),
      {
        dateRanges: both,
        dimensions: ["eventName"],
        metrics: ["eventCount", "totalUsers", "keyEvents"],
        orderBy: { metric: "eventCount" },
        limit: 500,
      },
      {
        dateRanges: current,
        dimensions: ["linkDomain", "linkUrl"],
        metrics: ["eventCount", "totalUsers"],
        dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "click" } } },
        orderBy: { metric: "eventCount" },
        limit: 1000,
      },
      seg(["countryId", "country"]),
      seg(["city", "countryId"], 500),
      seg(["deviceCategory"]),
      seg(["operatingSystem"]),
      seg(["browser"]),
      seg(["language"]),
      seg(["newVsReturning"]),
      {
        dateRanges: current,
        dimensions: ["dayOfWeek", "hour"],
        metrics: ["sessions"],
        limit: 200,
      },
    ]),
    Promise.all(locales.map((l) => getPublicPosts(l)))
      .then((lists) => lists.flat())
      .catch(() => []),
  ]);

  const [
    totalsRows,
    dailyRows,
    pageRows,
    landingRows,
    channelRows,
    sourceRows,
    campaignRows,
    eventRows,
    outboundRows,
    countryRows,
    cityRows,
    deviceRows,
    osRows,
    browserRows,
    languageRows,
    nvrRows,
    heatRows,
  ] = reports;

  // --- totals -------------------------------------------------------------
  const totalsCurrent = totalsRows.find((r) => r.dimensions.dateRange !== "previous")?.metrics;
  const totalsPrevious = totalsRows.find((r) => r.dimensions.dateRange === "previous")?.metrics;

  // --- daily series (gaps filled so the chart's x-axis is continuous) ------
  const byDate = new Map<string, Record<string, number>>(
    dailyRows.map((r) => {
      const d = r.dimensions.date;
      return [`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, r.metrics];
    })
  );
  const series: DayPoint[] = [];
  const dates = [...byDate.keys()].sort();
  if (dates.length > 0) {
    const end = new Date(`${dates[dates.length - 1]}T00:00:00Z`);
    for (let t = new Date(`${dates[0]}T00:00:00Z`); t <= end; t.setUTCDate(t.getUTCDate() + 1)) {
      const iso = t.toISOString().slice(0, 10);
      const m = byDate.get(iso);
      series.push({
        date: iso,
        users: m?.activeUsers ?? 0,
        sessions: m?.sessions ?? 0,
        views: m?.screenPageViews ?? 0,
        keyEvents: m?.keyEvents ?? 0,
      });
    }
  }

  // --- pages: merge title variants of the same path -----------------------
  const pageMap = new Map<string, { title: string; titleViews: number; current: Record<string, number>; previous: Record<string, number> | null }>();
  const addMetrics = (into: Record<string, number>, from: Record<string, number>) => {
    for (const [k, v] of Object.entries(from)) into[k] = (into[k] ?? 0) + v;
  };
  for (const r of pageRows) {
    const path = normPath(r.dimensions.pagePath);
    const entry = pageMap.get(path) ?? { title: "", titleViews: -1, current: {}, previous: null };
    if (r.dimensions.dateRange === "previous") {
      entry.previous ??= {};
      addMetrics(entry.previous, r.metrics);
    } else {
      addMetrics(entry.current, r.metrics);
      if ((r.metrics.screenPageViews ?? 0) > entry.titleViews) {
        entry.title = r.dimensions.pageTitle;
        entry.titleViews = r.metrics.screenPageViews ?? 0;
      }
    }
    pageMap.set(path, entry);
  }
  const pages: PageRow[] = [...pageMap.entries()]
    .filter(([, e]) => Object.keys(e.current).length > 0)
    .map(([path, e]) => ({
      ...toSeg(e.current),
      key: path,
      label: path,
      path,
      title: e.title,
      previous: e.previous ? toSeg(e.previous) : null,
    }))
    .sort((a, b) => b.views - a.views);

  // --- blog articles joined with page stats --------------------------------
  const articles: ArticleRow[] = posts.map((post) => {
    const path = normPath(`/${post.language}/blog/${post.slug}`);
    const e = pageMap.get(path);
    return {
      path,
      title: post.title,
      language: post.language,
      publishAt: post.publishAt,
      current: toSeg(e?.current ?? {}),
      previous: e?.previous ? toSeg(e.previous) : null,
    };
  });
  articles.sort((a, b) => b.current.views - a.current.views);

  // --- site language split from page paths ---------------------------------
  const localeMap = new Map<string, LocaleShare>();
  for (const p of pages) {
    const seg0 = p.path.split("/")[1] ?? "";
    const locale = (locales as readonly string[]).includes(seg0) ? seg0 : "other";
    const entry = localeMap.get(locale) ?? { locale, views: 0, users: 0 };
    entry.views += p.views;
    entry.users += p.users; // users can overlap across pages; used for share only
    localeMap.set(locale, entry);
  }

  // --- events --------------------------------------------------------------
  const events: EventRow[] = [...compare(eventRows, (d) => d.eventName).values()]
    .filter((e) => Object.keys(e.current).length > 0)
    .map((e) => ({
      name: e.dims.eventName,
      count: e.current.eventCount ?? 0,
      users: e.current.totalUsers ?? 0,
      keyEvents: e.current.keyEvents ?? 0,
      previous: e.previous ? { count: e.previous.eventCount ?? 0, users: e.previous.totalUsers ?? 0 } : null,
    }))
    .sort((a, b) => b.count - a.count);

  // --- outbound clicks (enhanced measurement "click" events) ---------------
  const outbound: OutboundRow[] = outboundRows
    .filter((r) => r.dimensions.linkUrl && r.dimensions.linkUrl !== "(not set)")
    .map((r) => ({
      domain: r.dimensions.linkDomain,
      url: safeDecode(r.dimensions.linkUrl),
      clicks: r.metrics.eventCount ?? 0,
      users: r.metrics.totalUsers ?? 0,
    }));

  // --- heatmap -------------------------------------------------------------
  const heatmap: Heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const r of heatRows) {
    const d = Number(r.dimensions.dayOfWeek);
    const h = Number(r.dimensions.hour);
    if (d >= 0 && d < 7 && h >= 0 && h < 24) heatmap[d][h] = r.metrics.sessions ?? 0;
  }

  const summary: AnalyticsSummary = {
    days,
    generatedAt: new Date().toISOString(),
    totals: { current: toTotals(totalsCurrent), previous: toTotals(totalsPrevious) },
    series,
    pages,
    landingPages: segRows(landingRows, "landingPage", normPath),
    articles,
    channels: segRows(channelRows, "sessionDefaultChannelGroup", (v) => CHANNEL_LABELS[v] ?? v),
    sourceMedium: segRows(sourceRows, "sessionSourceMedium"),
    campaigns: segRows(campaignRows, "sessionCampaignName").filter(
      (r) => !["(not set)", "(direct)", "(organic)", "(referral)"].includes(r.key)
    ),
    events,
    outbound,
    countries: countryRows.map((r) => ({
      ...toSeg(r.metrics),
      key: r.dimensions.countryId,
      label: r.dimensions.country,
      alpha2: /^[A-Z]{2}$/.test(r.dimensions.countryId) ? r.dimensions.countryId : null,
      previous: null,
    })),
    cities: cityRows.map((r) => ({
      ...toSeg(r.metrics),
      key: `${r.dimensions.city}|${r.dimensions.countryId}`,
      label: r.dimensions.city,
      alpha2: /^[A-Z]{2}$/.test(r.dimensions.countryId) ? r.dimensions.countryId : null,
      previous: null,
    })),
    devices: segRows(deviceRows, "deviceCategory"),
    operatingSystems: segRows(osRows, "operatingSystem"),
    browsers: segRows(browserRows, "browser"),
    languages: segRows(languageRows, "language"),
    newVsReturning: segRows(nvrRows, "newVsReturning").filter((r) => r.key && r.key !== "(not set)"),
    siteLocales: [...localeMap.values()].sort((a, b) => b.views - a.views),
    heatmap,
  };
  cache.set(days, { at: Date.now(), data: summary });
  return summary;
}

// ---------------------------------------------------------------------------
// Realtime (last 30 minutes)
// ---------------------------------------------------------------------------

export type Realtime = {
  activeUsers: number;
  // users per minute, index 0 = 29 minutes ago … 29 = now
  perMinute: number[];
  pages: { title: string; users: number; views: number }[];
  countries: { name: string; users: number }[];
  devices: { name: string; users: number }[];
  events: { name: string; count: number }[];
  fetchedAt: string;
};

export async function getRealtime(): Promise<Realtime> {
  const [total, minutes, pages, countries, devices, events] = await Promise.all([
    runRealtimeReport({ metrics: ["activeUsers"] }),
    runRealtimeReport({ dimensions: ["minutesAgo"], metrics: ["activeUsers"], limit: 30 }),
    runRealtimeReport({
      dimensions: ["unifiedScreenName"],
      metrics: ["activeUsers", "screenPageViews"],
      orderBy: { metric: "activeUsers" },
      limit: 10,
    }),
    runRealtimeReport({ dimensions: ["country"], metrics: ["activeUsers"], orderBy: { metric: "activeUsers" }, limit: 10 }),
    runRealtimeReport({ dimensions: ["deviceCategory"], metrics: ["activeUsers"], orderBy: { metric: "activeUsers" } }),
    runRealtimeReport({ dimensions: ["eventName"], metrics: ["eventCount"], orderBy: { metric: "eventCount" }, limit: 10 }),
  ]);
  const perMinute = Array(30).fill(0);
  for (const r of minutes) {
    const ago = Number(r.dimensions.minutesAgo);
    if (ago >= 0 && ago < 30) perMinute[29 - ago] = r.metrics.activeUsers ?? 0;
  }
  return {
    activeUsers: total[0]?.metrics.activeUsers ?? 0,
    perMinute,
    pages: pages.map((r) => ({
      title: r.dimensions.unifiedScreenName,
      users: r.metrics.activeUsers ?? 0,
      views: r.metrics.screenPageViews ?? 0,
    })),
    countries: countries.map((r) => ({ name: r.dimensions.country, users: r.metrics.activeUsers ?? 0 })),
    devices: devices.map((r) => ({ name: r.dimensions.deviceCategory, users: r.metrics.activeUsers ?? 0 })),
    events: events.map((r) => ({ name: r.dimensions.eventName, count: r.metrics.eventCount ?? 0 })),
    fetchedAt: new Date().toISOString(),
  };
}
