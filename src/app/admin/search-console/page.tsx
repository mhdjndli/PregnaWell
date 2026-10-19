import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { getSiteUrl, isGscConfigured } from "@/lib/searchConsole";
import {
  RANGES,
  getCachedInspections,
  getPerformanceSummary,
  parseRangeDays,
  totalsOf,
  type GscPerformanceSummary,
} from "@/lib/gscSummary";
import { getAllSiteUrls } from "@/lib/siteUrls";
import AdminShell from "@/components/admin/AdminShell";
import TrendChart from "@/components/admin/gsc/TrendChart";
import IndexingPanel from "@/components/admin/gsc/IndexingPanel";
import GscExplorer from "@/components/admin/gsc/GscExplorer";

export const dynamic = "force-dynamic";

// Palette validated for CVD + contrast on white (dataviz checks):
// clicks = brand purple soft, impressions = chart rose.
const CLICKS_COLOR = "#6b4ea3";
const IMPRESSIONS_COLOR = "#b05577";

export default async function SearchConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin");

  const params = await searchParams;
  const days = parseRangeDays(params.days);

  if (!isGscConfigured()) {
    return (
      <AdminShell>
        <Header days={days} />
        <SetupCard />
      </AdminShell>
    );
  }

  // Data assembly is shared with GET /api/gsc/summary (see lib/gscSummary) so
  // partner dashboards render exactly what this page renders.
  let apiError: string | null = null;
  let summary: GscPerformanceSummary | null = null;
  try {
    summary = await getPerformanceSummary(days);
  } catch (err) {
    apiError = (err as Error).message;
  }
  const current = summary?.totals.current ?? totalsOf([]);
  const previous = summary?.totals.previous ?? totalsOf([]);
  const series = summary?.series ?? [];
  const hidden = summary?.hiddenQueries;
  const sitemaps = summary?.sitemaps ?? [];

  const urls = await getAllSiteUrls();
  const cachedInspections = await getCachedInspections();

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
          {hidden && hidden.impressions > 0 && (
            <p className="mt-3 text-xs text-[var(--brand-muted)]">
              {`${pct(hidden.impressionShare)} of impressions and ${pct(hidden.clickShare)} of clicks come from queries Google keeps private (too rare to report), so query tables add up to less than these totals.`}
              {!hidden.exact && " Part of this gap is rows beyond the API limit."}
            </p>
          )}

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

          {summary && <GscExplorer summary={summary} />}

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

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
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
