import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { ensureInitialized, getPool } from "@/lib/db";
import {
  getSiteUrl,
  isGscConfigured,
  listSitemaps,
  querySearchAnalytics,
  type SearchAnalyticsRow,
  type SitemapInfo,
} from "@/lib/searchConsole";
import { getAllSiteUrls } from "@/lib/siteUrls";
import AdminShell from "@/components/admin/AdminShell";
import TrendChart from "@/components/admin/gsc/TrendChart";
import IndexingPanel from "@/components/admin/gsc/IndexingPanel";
import type { InspectionRecord } from "./actions";

export const dynamic = "force-dynamic";

// Palette validated for CVD + contrast on white (dataviz checks):
// clicks = brand purple soft, impressions = chart rose.
const CLICKS_COLOR = "#6b4ea3";
const IMPRESSIONS_COLOR = "#b05577";

const RANGES = [7, 28, 90, 180] as const;
type RangeDays = (typeof RANGES)[number];

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeDates(days: RangeDays): {
  start: string;
  end: string;
  prevStart: string;
  prevEnd: string;
} {
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

function totalsOf(rows: SearchAnalyticsRow[]) {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const position =
    impressions > 0
      ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / impressions
      : 0;
  return { clicks, impressions, ctr, position };
}

export default async function SearchConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin");

  const params = await searchParams;
  const parsed = Number(params.days);
  const days: RangeDays = (RANGES as readonly number[]).includes(parsed)
    ? (parsed as RangeDays)
    : 28;

  if (!isGscConfigured()) {
    return (
      <AdminShell>
        <Header days={days} />
        <SetupCard />
      </AdminShell>
    );
  }

  const { start, end, prevStart, prevEnd } = rangeDates(days);

  let apiError: string | null = null;
  let daily: SearchAnalyticsRow[] = [];
  let current = totalsOf([]);
  let previous = totalsOf([]);
  let topQueries: SearchAnalyticsRow[] = [];
  let topPages: SearchAnalyticsRow[] = [];
  let sitemaps: SitemapInfo[] = [];
  try {
    const [dailyRows, currentRows, previousRows, queryRows, pageRows, sitemapList] =
      await Promise.all([
        querySearchAnalytics({ startDate: start, endDate: end, dimensions: ["date"] }),
        querySearchAnalytics({ startDate: start, endDate: end }),
        querySearchAnalytics({ startDate: prevStart, endDate: prevEnd }),
        querySearchAnalytics({ startDate: start, endDate: end, dimensions: ["query"], rowLimit: 10 }),
        querySearchAnalytics({ startDate: start, endDate: end, dimensions: ["page"], rowLimit: 10 }),
        listSitemaps(),
      ]);
    daily = dailyRows.sort((a, b) => (a.keys?.[0] ?? "").localeCompare(b.keys?.[0] ?? ""));
    current = totalsOf(currentRows);
    previous = totalsOf(previousRows);
    topQueries = queryRows;
    topPages = pageRows;
    sitemaps = sitemapList;
  } catch (err) {
    apiError = (err as Error).message;
  }

  // Fill missing days with zeroes so the x-axis is continuous.
  const byDate = new Map(daily.map((r) => [r.keys?.[0] ?? "", r]));
  const series: { date: string; clicks: number; impressions: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    const key = isoDay(d);
    const row = byDate.get(key);
    series.push({ date: key, clicks: row?.clicks ?? 0, impressions: row?.impressions ?? 0 });
  }

  const urls = await getAllSiteUrls();
  let cachedInspections: InspectionRecord[] = [];
  try {
    await ensureInitialized();
    const res = await getPool().query(
      `SELECT url, verdict, coverage_state, robots_txt_state, indexing_state,
              last_crawl_time, google_canonical, inspected_at
         FROM gsc_inspections`
    );
    cachedInspections = res.rows.map((r) => ({
      url: r.url,
      verdict: r.verdict,
      coverageState: r.coverage_state,
      robotsTxtState: r.robots_txt_state,
      indexingState: r.indexing_state,
      lastCrawlTime: r.last_crawl_time ? new Date(r.last_crawl_time).toISOString() : null,
      googleCanonical: r.google_canonical,
      inspectedAt: new Date(r.inspected_at).toISOString(),
    }));
  } catch {
    // DB unreachable: the panel still works, just without cached results.
  }

  return (
    <AdminShell>
      <Header days={days} />

      {apiError && (
        <div className="mt-8 rounded-2xl bg-red-50 p-5 text-sm text-red-800 ring-1 ring-red-100">
          <p className="font-semibold">Search Console API error</p>
          <p className="mt-1">{apiError}</p>
        </div>
      )}

      {!apiError && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Clicks"
              value={current.clicks.toLocaleString("en-US")}
              delta={delta(current.clicks, previous.clicks)}
              tone="purple"
            />
            <Stat
              label="Impressions"
              value={current.impressions.toLocaleString("en-US")}
              delta={delta(current.impressions, previous.impressions)}
            />
            <Stat
              label="Avg. CTR"
              value={`${(current.ctr * 100).toFixed(1)}%`}
              delta={delta(current.ctr, previous.ctr)}
            />
            <Stat
              label="Avg. position"
              value={current.position ? current.position.toFixed(1) : "—"}
              delta={delta(previous.position, current.position)} // lower is better
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <TrendChart
              label="Clicks per day"
              color={CLICKS_COLOR}
              points={series.map((s) => ({ date: s.date, value: s.clicks }))}
            />
            <TrendChart
              label="Impressions per day"
              color={IMPRESSIONS_COLOR}
              points={series.map((s) => ({ date: s.date, value: s.impressions }))}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <RowsTable
              title="Top queries"
              nameHeader="Query"
              rows={topQueries.map((r) => ({
                name: r.keys?.[0] ?? "",
                href: null,
                clicks: r.clicks,
                impressions: r.impressions,
                position: r.position,
              }))}
            />
            <RowsTable
              title="Top pages"
              nameHeader="Page"
              rows={topPages.map((r) => {
                const full = r.keys?.[0] ?? "";
                return {
                  name: full.replace("https://pregnawell.com", "") || "/",
                  href: full,
                  clicks: r.clicks,
                  impressions: r.impressions,
                  position: r.position,
                };
              })}
            />
          </div>

          {sitemaps.length > 0 && (
            <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-[var(--brand-purple)]/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">
                Sitemaps
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {sitemaps.map((s) => (
                  <li key={s.path} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-mono text-xs text-[var(--brand-purple-deep)]">{s.path}</span>
                    <span className="text-xs text-[var(--brand-muted)]">
                      {s.submittedUrls} URLs submitted
                      {s.lastDownloaded &&
                        ` · last read ${new Date(s.lastDownloaded).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </span>
                    {s.errors > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                        {s.errors} errors
                      </span>
                    )}
                    {s.warnings > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {s.warnings} warnings
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="mt-10">
        <IndexingPanel urls={urls} initial={cachedInspections} />
        <p className="mt-3 text-xs text-[var(--brand-muted)]">
          Checks run through Google&rsquo;s URL Inspection API (quota: 2,000 inspections/day).
          Results are cached, so the last known status is shown until you re-check.
        </p>
      </div>
    </AdminShell>
  );
}

function Header({ days }: { days: number }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--brand-purple-deep)]">Search Console</h1>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">
          Google Search performance and indexing status for{" "}
          <span className="font-mono text-xs">{getSiteUrl()}</span>
        </p>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-[var(--brand-purple)]/10">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin/search-console?days=${r}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              r === days
                ? "bg-[var(--brand-purple)] text-white"
                : "text-[var(--brand-muted)] hover:text-[var(--brand-purple)]"
            }`}
          >
            {r}d
          </Link>
        ))}
      </div>
    </div>
  );
}

function delta(now: number, before: number): number | null {
  if (!Number.isFinite(now) || !Number.isFinite(before) || before === 0) return null;
  return (now - before) / before;
}

function Stat({
  label,
  value,
  delta,
  tone = "default",
}: {
  label: string;
  value: string;
  delta: number | null;
  tone?: "default" | "purple";
}) {
  const positive = delta !== null && delta >= 0;
  return (
    <div
      className={`rounded-2xl p-5 ring-1 ring-[var(--brand-purple)]/10 ${
        tone === "purple" ? "bg-[var(--brand-purple-deep)] text-white" : "bg-white text-[var(--brand-purple-deep)]"
      }`}
    >
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      {delta !== null && (
        <p
          className={`mt-1 text-xs font-semibold ${
            tone === "purple"
              ? "text-white/80"
              : positive
              ? "text-emerald-700"
              : "text-red-700"
          }`}
        >
          {positive ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(0)}% vs previous period
        </p>
      )}
    </div>
  );
}

function RowsTable({
  title,
  nameHeader,
  rows,
}: {
  title: string;
  nameHeader: string;
  rows: { name: string; href: string | null; clicks: number; impressions: number; position: number }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--brand-purple)]/10">
      <p className="px-5 pt-5 text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">
        {title}
      </p>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--brand-purple)]/10 text-left text-xs uppercase tracking-wider text-[var(--brand-muted)]">
            <th className="px-5 py-2 font-semibold">{nameHeader}</th>
            <th className="px-3 py-2 text-right font-semibold">Clicks</th>
            <th className="px-3 py-2 text-right font-semibold">Impr.</th>
            <th className="px-5 py-2 text-right font-semibold">Pos.</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-5 py-8 text-center text-sm text-[var(--brand-muted)]">
                No data for this period yet.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-[var(--brand-purple)]/5 last:border-0">
              <td className="max-w-0 truncate px-5 py-2.5 text-[var(--brand-ink)]" dir="auto">
                {r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-[var(--brand-purple-deep)] hover:text-[var(--brand-rose)]"
                  >
                    {r.name}
                  </a>
                ) : (
                  r.name
                )}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">{r.clicks.toLocaleString("en-US")}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{r.impressions.toLocaleString("en-US")}</td>
              <td className="px-5 py-2.5 text-right tabular-nums text-[var(--brand-muted)]">
                {r.position.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SetupCard() {
  return (
    <div className="mt-8 rounded-3xl bg-white p-8 ring-1 ring-[var(--brand-purple)]/10 shadow-[0_15px_40px_-30px_rgba(61,42,110,0.35)]">
      <h2 className="font-display text-xl text-[var(--brand-purple-deep)]">
        Connect Google Search Console
      </h2>
      <p className="mt-2 text-sm text-[var(--brand-muted)]">
        One-time setup — takes about 5 minutes. This page will light up automatically once
        the credentials are in place.
      </p>
      <ol className="mt-6 list-decimal space-y-4 pl-5 text-sm text-[var(--brand-ink)]">
        <li>
          Open the{" "}
          <a
            href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--brand-purple)] underline"
          >
            Google Cloud Console
          </a>{" "}
          (create a free project if you don&rsquo;t have one) and enable the{" "}
          <strong>Google Search Console API</strong>.
        </li>
        <li>
          Go to <strong>IAM &amp; Admin → Service Accounts → Create service account</strong>{" "}
          (any name, e.g. <code className="rounded bg-[var(--brand-blush)] px-1">pregnawell-gsc</code>).
          No roles needed. Then open it, go to <strong>Keys → Add key → JSON</strong> and download
          the key file.
        </li>
        <li>
          In{" "}
          <a
            href="https://search.google.com/search-console/users"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--brand-purple)] underline"
          >
            Search Console → Settings → Users and permissions
          </a>
          , add the service account&rsquo;s email (it looks like{" "}
          <code className="rounded bg-[var(--brand-blush)] px-1">…@….iam.gserviceaccount.com</code>)
          as a user with <strong>Full</strong> permission.
        </li>
        <li>
          On Railway, add an environment variable{" "}
          <code className="rounded bg-[var(--brand-blush)] px-1">GSC_SERVICE_ACCOUNT_JSON</code>{" "}
          and paste the <em>entire contents</em> of the downloaded JSON key file as its value.
          If the property in Search Console is not the domain property{" "}
          <code className="rounded bg-[var(--brand-blush)] px-1">sc-domain:pregnawell.com</code>,
          also set <code className="rounded bg-[var(--brand-blush)] px-1">GSC_SITE_URL</code>{" "}
          to match (e.g.{" "}
          <code className="rounded bg-[var(--brand-blush)] px-1">https://pregnawell.com/</code>).
        </li>
        <li>Redeploy, then reload this page.</li>
      </ol>
    </div>
  );
}
