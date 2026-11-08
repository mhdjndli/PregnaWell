import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { getPropertyId, isGaConfigured } from "@/lib/analytics";
import { getServiceAccount } from "@/lib/googleAuth";
import { getAnalyticsSummary, getRealtime, type AnalyticsSummary, type Realtime } from "@/lib/gaSummary";
import { RANGES, parseRangeDays } from "@/lib/gscSummary";
import { formatDuration } from "@/lib/format";
import AdminShell from "@/components/admin/AdminShell";
import Stat, { delta } from "@/components/admin/StatCard";
import TrendChart from "@/components/admin/gsc/TrendChart";
import RealtimePanel from "@/components/admin/ga/RealtimePanel";
import AnalyticsExplorer from "@/components/admin/ga/AnalyticsExplorer";

export const dynamic = "force-dynamic";

// Same validated pair as the Search Console charts.
const USERS_COLOR = "#6b4ea3";
const VIEWS_COLOR = "#b05577";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  if (!(await isAuthed())) redirect("/admin");

  const days = parseRangeDays((await searchParams).days);

  if (!isGaConfigured()) {
    return (
      <AdminShell>
        <Header days={days} />
        <SetupCard
          email={getServiceAccount()?.clientEmail ?? null}
          hasPropertyId={getPropertyId() !== null}
        />
      </AdminShell>
    );
  }

  const [summaryResult, realtimeResult] = await Promise.allSettled([getAnalyticsSummary(days), getRealtime()]);
  const summary: AnalyticsSummary | null = summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const apiError = summaryResult.status === "rejected" ? (summaryResult.reason as Error).message : null;
  const realtime: Realtime | null = realtimeResult.status === "fulfilled" ? realtimeResult.value : null;
  const realtimeError =
    realtimeResult.status === "rejected" && !apiError ? (realtimeResult.reason as Error).message : null;

  const cur = summary?.totals.current;
  const prev = summary?.totals.previous;

  return (
    <AdminShell>
      <Header days={days} generatedAt={summary?.generatedAt} />

      {apiError && (
        <div className="mt-8 rounded-2xl bg-red-50 p-5 text-sm text-red-800 ring-1 ring-red-100">
          <p className="font-semibold">Google Analytics API error</p>
          <p className="mt-1">{apiError}</p>
        </div>
      )}

      {!apiError && (
        <div className="mt-8">
          <RealtimePanel initial={realtime} initialError={realtimeError} />
        </div>
      )}

      {summary && cur && prev && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Users" value={fmt(cur.users)} delta={delta(cur.users, prev.users)} tone="purple" />
            <Stat
              label="New users"
              value={fmt(cur.newUsers)}
              delta={delta(cur.newUsers, prev.newUsers)}
              hint="First-time visitors"
            />
            <Stat label="Sessions" value={fmt(cur.sessions)} delta={delta(cur.sessions, prev.sessions)} />
            <Stat label="Page views" value={fmt(cur.views)} delta={delta(cur.views, prev.views)} />
            <Stat
              label="Engagement rate"
              value={`${(cur.engagementRate * 100).toFixed(1)}%`}
              delta={delta(cur.engagementRate, prev.engagementRate)}
              hint="Sessions that lasted 10s+, viewed 2+ pages, or had a key event"
            />
            <Stat
              label="Avg. engagement time"
              value={formatDuration(cur.avgEngagement)}
              delta={delta(cur.avgEngagement, prev.avgEngagement)}
              hint="Time the site was in focus, per active user"
            />
            <Stat
              label="Views / session"
              value={cur.viewsPerSession.toFixed(2)}
              delta={delta(cur.viewsPerSession, prev.viewsPerSession)}
            />
            <Stat
              label="Key events"
              value={fmt(cur.keyEvents)}
              delta={delta(cur.keyEvents, prev.keyEvents)}
              hint="Events marked as key events (conversions) in GA"
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <TrendChart
              label="Users per day"
              color={USERS_COLOR}
              points={summary.series.map((s) => ({ date: s.date, value: s.users }))}
            />
            <TrendChart
              label="Page views per day"
              color={VIEWS_COLOR}
              points={summary.series.map((s) => ({ date: s.date, value: s.views }))}
            />
          </div>

          <AnalyticsExplorer summary={summary} />

          <p className="mt-6 text-xs text-[var(--brand-muted)]">
            Ranges include today so far. Google usually finishes processing a day within 24&ndash;48 hours, so
            the latest numbers can still move. Figures are cached for 5 minutes.
          </p>
        </>
      )}
    </AdminShell>
  );
}

function fmt(v: number): string {
  return Math.round(v).toLocaleString("en-US");
}

function Header({ days, generatedAt }: { days: number; generatedAt?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--brand-purple-deep)]">Analytics</h1>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">
          Google Analytics 4: visitors, traffic sources, engagement and events
          {generatedAt && (
            <>
              {" · updated "}
              {new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-[var(--brand-purple)]/10">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin/analytics?days=${r}`}
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

const code = "rounded bg-[var(--brand-blush)] px-1";
const link = "font-semibold text-[var(--brand-purple)] underline";

function SetupCard({ email, hasPropertyId }: { email: string | null; hasPropertyId: boolean }) {
  return (
    <div className="mt-8 rounded-3xl bg-white p-8 ring-1 ring-[var(--brand-purple)]/10 shadow-[0_15px_40px_-30px_rgba(61,42,110,0.35)]">
      <h2 className="font-display text-xl text-[var(--brand-purple-deep)]">Connect Google Analytics</h2>
      <p className="mt-2 text-sm text-[var(--brand-muted)]">
        One-time setup, about 5 minutes. It reuses the Search Console service account, so no new keys are
        needed. This page lights up automatically once it&rsquo;s done.
      </p>
      <ol className="mt-6 list-decimal space-y-4 pl-5 text-sm text-[var(--brand-ink)]">
        <li>
          In the{" "}
          <a
            href="https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com"
            target="_blank"
            rel="noreferrer"
            className={link}
          >
            Google Cloud Console
          </a>{" "}
          (same project as the Search Console service account), enable the{" "}
          <strong>Google Analytics Data API</strong>.
        </li>
        <li>
          In Google Analytics, go to <strong>Admin → Property access management → + → Add users</strong> and add{" "}
          {email ? (
            <code className={`${code} break-all`}>{email}</code>
          ) : (
            <>
              the service account email (
              <span className="text-red-700">
                not configured yet: set <code className={code}>GSC_SERVICE_ACCOUNT_JSON</code> first, see the
                Search Console page
              </span>
              )
            </>
          )}{" "}
          with the <strong>Viewer</strong> role. Untick &ldquo;Notify new users by email&rdquo;.
        </li>
        <li>
          Copy the <strong>Property ID</strong> from <strong>Admin → Property details</strong> (top right, a
          number like <code className={code}>412345678</code>; not the <code className={code}>G-…</code>{" "}
          measurement ID).
        </li>
        <li>
          On Railway, add <code className={code}>GA_PROPERTY_ID</code> with that number
          {hasPropertyId && <span className="text-emerald-700"> (already set ✓)</span>}, then reload this page.
        </li>
      </ol>
    </div>
  );
}
