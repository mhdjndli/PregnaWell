"use client";

import { useMemo, useState, type ReactNode } from "react";
import type {
  AnalyticsSummary,
  ArticleRow,
  CityRow,
  CountryRow,
  EventRow,
  Heatmap,
  OutboundRow,
  PageRow,
  Seg,
  SegRow,
} from "@/lib/gaSummary";
import DataTable, { type Column } from "@/components/admin/gsc/DataTable";
import { formatDuration as duration } from "@/lib/format";

const TABS = [
  ["pages", "Pages"],
  ["landing", "Landing pages"],
  ["articles", "Articles"],
  ["acquisition", "Acquisition"],
  ["events", "Events"],
  ["outbound", "Outbound clicks"],
  ["audience", "Audience"],
  ["when", "When"],
] as const;
type Tab = (typeof TABS)[number][0];

const int = (v: number) => Math.round(v).toLocaleString("en-US");
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

// Everything below the stat cards and charts. Data arrives pre-assembled from
// lib/gaSummary; tables reuse the Search Console DataTable (sort, search, CSV).
export default function AnalyticsExplorer({ summary }: { summary: AnalyticsSummary }) {
  const [tab, setTab] = useState<Tab>("pages");
  const d = summary.days;

  const outboundByDomain = useMemo(() => {
    const map = new Map<string, { domain: string; clicks: number; users: number; urls: OutboundRow[] }>();
    for (const r of summary.outbound) {
      const e = map.get(r.domain) ?? { domain: r.domain, clicks: 0, users: 0, urls: [] };
      e.clicks += r.clicks;
      e.users += r.users;
      e.urls.push(r);
      map.set(r.domain, e);
    }
    return [...map.values()].sort((a, b) => b.clicks - a.clicks);
  }, [summary.outbound]);

  const counts: Partial<Record<Tab, number>> = {
    pages: summary.pages.length,
    landing: summary.landingPages.length,
    articles: summary.articles.length,
    events: summary.events.length,
    outbound: summary.outbound.reduce((s, r) => s + r.clicks, 0),
  };

  return (
    <div className="mt-6">
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
              tab === key
                ? "bg-[var(--brand-purple)] text-white"
                : "bg-white text-[var(--brand-muted)] ring-1 ring-[var(--brand-purple)]/10 hover:text-[var(--brand-purple)]"
            }`}
          >
            {label}
            {counts[key] !== undefined && (
              <span className={`ml-1.5 ${tab === key ? "text-white/70" : "opacity-60"}`}>{int(counts[key]!)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === "pages" && (
          <DataTable<PageRow>
            title="Pages"
            subtitle="Every page path with views, users and engagement. Arrows compare with the previous period."
            rows={summary.pages}
            rowKey={(r) => r.path}
            columns={[pathColumn<PageRow>("Page", (r) => r.title), ...segColumns<PageRow>("views")]}
            initialSort={{ key: "views", dir: "desc" }}
            searchText={(r) => `${r.path} ${r.title}`}
            csvName={`ga-pages-${d}d`}
          />
        )}

        {tab === "landing" && (
          <DataTable<SegRow>
            title="Landing pages"
            subtitle="The first page of each session: where visitors enter the site."
            rows={summary.landingPages}
            rowKey={(r) => r.key}
            columns={[pathColumn<SegRow>("Landing page"), ...segColumns<SegRow>("sessions")]}
            initialSort={{ key: "sessions", dir: "desc" }}
            searchText={(r) => r.label}
            csvName={`ga-landing-pages-${d}d`}
          />
        )}

        {tab === "articles" && (
          <DataTable<ArticleRow>
            title="Published articles"
            subtitle="Every live blog post with its traffic. Zero views means nobody opened it in this period."
            rows={summary.articles}
            rowKey={(r) => r.path}
            columns={articleColumns}
            initialSort={{ key: "views", dir: "desc" }}
            searchText={(r) => `${r.title} ${r.path}`}
            csvName={`ga-articles-${d}d`}
          />
        )}

        {tab === "acquisition" && (
          <>
            <DataTable<SegRow>
              title="Channels"
              subtitle="How visitors found the site, grouped by GA's default channel rules."
              rows={summary.channels}
              rowKey={(r) => r.key}
              columns={[labelColumn<SegRow>("Channel"), ...segColumns<SegRow>("sessions", summary.totals.current.sessions)]}
              initialSort={{ key: "sessions", dir: "desc" }}
              csvName={`ga-channels-${d}d`}
            />
            <DataTable<SegRow>
              title="Source / medium"
              subtitle="e.g. google / organic, instagram.com / referral, (direct) / (none)."
              rows={summary.sourceMedium}
              rowKey={(r) => r.key}
              columns={[labelColumn<SegRow>("Source / medium"), ...segColumns<SegRow>("sessions", summary.totals.current.sessions)]}
              initialSort={{ key: "sessions", dir: "desc" }}
              searchText={(r) => r.label}
              csvName={`ga-source-medium-${d}d`}
            />
            <DataTable<SegRow>
              title="Campaigns"
              subtitle={
                <>
                  Links tagged with <code>utm_campaign</code>. Tag Instagram, WhatsApp and newsletter links to see
                  them here.
                </>
              }
              rows={summary.campaigns}
              rowKey={(r) => r.key}
              columns={[labelColumn<SegRow>("Campaign"), ...segColumns<SegRow>("sessions")]}
              initialSort={{ key: "sessions", dir: "desc" }}
              csvName={`ga-campaigns-${d}d`}
              emptyText="No tagged campaigns in this period."
            />
          </>
        )}

        {tab === "events" && (
          <DataTable<EventRow>
            title="Events"
            subtitle="Everything GA recorded. Key events are the ones marked as conversions in GA → Admin → Key events."
            rows={summary.events}
            rowKey={(r) => r.name}
            columns={eventColumns}
            initialSort={{ key: "count", dir: "desc" }}
            searchText={(r) => r.name}
            csvName={`ga-events-${d}d`}
          />
        )}

        {tab === "outbound" && (
          <>
            <DataTable<(typeof outboundByDomain)[number]>
              title="Outbound clicks by site"
              subtitle="Clicks on links leaving pregnawell.com (WhatsApp, Instagram, booking pages …). Click a row for the exact links."
              rows={outboundByDomain}
              rowKey={(r) => r.domain}
              columns={[
                {
                  key: "domain",
                  header: "Site",
                  grow: true,
                  sortValue: (r) => r.domain,
                  render: (r) => (
                    <span className="block truncate">
                      {r.domain}
                      {/whatsapp|wa\.me/i.test(r.domain) && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          WhatsApp
                        </span>
                      )}
                    </span>
                  ),
                },
                { key: "clicks", header: "Clicks", numeric: true, sortValue: (r) => r.clicks, render: (r) => int(r.clicks) },
                { key: "users", header: "Users", numeric: true, sortValue: (r) => r.users, render: (r) => int(r.users) },
              ]}
              initialSort={{ key: "clicks", dir: "desc" }}
              csvName={`ga-outbound-sites-${d}d`}
              emptyText="No outbound clicks recorded yet. They're tracked automatically by Enhanced measurement."
              expand={(r) => (
                <MiniTable
                  head={["Link", "Clicks", "Users"]}
                  rows={r.urls.map((u) => [
                    <span key="u" className="block max-w-[60ch] truncate font-mono" dir="auto" title={u.url}>
                      {u.url}
                    </span>,
                    int(u.clicks),
                    int(u.users),
                  ])}
                />
              )}
            />
          </>
        )}

        {tab === "audience" && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <DataTable<CountryRow>
                title="Countries"
                rows={summary.countries}
                rowKey={(r) => r.key}
                columns={[
                  {
                    key: "country",
                    header: "Country",
                    grow: true,
                    sortValue: (r) => r.label,
                    render: (r) => (
                      <span className="block truncate">
                        <span className="mr-1.5">{flag(r.alpha2)}</span>
                        {r.label}
                      </span>
                    ),
                  },
                  ...compactColumns<CountryRow>(summary.totals.current.users),
                ]}
                initialSort={{ key: "users", dir: "desc" }}
                searchText={(r) => r.label}
                csvName={`ga-countries-${d}d`}
              />
              <DataTable<CityRow>
                title="Cities"
                rows={summary.cities}
                rowKey={(r) => r.key}
                columns={[
                  {
                    key: "city",
                    header: "City",
                    grow: true,
                    sortValue: (r) => r.label,
                    render: (r) => (
                      <span className="block truncate">
                        <span className="mr-1.5">{flag(r.alpha2)}</span>
                        {r.label}
                      </span>
                    ),
                  },
                  ...compactColumns<CityRow>(summary.totals.current.users),
                ]}
                initialSort={{ key: "users", dir: "desc" }}
                searchText={(r) => r.label}
                csvName={`ga-cities-${d}d`}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Breakdown title="Devices" rows={summary.devices} total={summary.totals.current.users} capitalize />
              <Breakdown title="New vs returning" rows={summary.newVsReturning} total={summary.totals.current.users} capitalize />
              <Breakdown
                title="Site language"
                note="Views by /en vs /ar pages."
                rows={summary.siteLocales.map((l) => ({
                  label: l.locale === "en" ? "English" : l.locale === "ar" ? "Arabic" : "Other pages",
                  value: l.views,
                }))}
                total={summary.siteLocales.reduce((s, l) => s + l.views, 0)}
                unit="views"
              />
              <Breakdown title="Operating systems" rows={summary.operatingSystems} total={summary.totals.current.users} />
              <Breakdown title="Browsers" rows={summary.browsers} total={summary.totals.current.users} />
              <Breakdown title="Browser language" rows={summary.languages} total={summary.totals.current.users} />
            </div>
          </>
        )}

        {tab === "when" && <HeatmapCard heatmap={summary.heatmap} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function pathColumn<T extends SegRow>(header: string, subtitle?: (r: T) => string): Column<T> {
  return {
    key: "path",
    header,
    grow: true,
    sortValue: (r) => r.label,
    render: (r) => (
      <span className="block truncate text-left" dir="auto">
        <a
          href={`https://pregnawell.com${r.label.startsWith("/") ? r.label : ""}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs text-[var(--brand-ink)] hover:text-[var(--brand-rose)]"
          title={r.label}
        >
          {r.label}
        </a>
        {subtitle && subtitle(r) && (
          <span className="block truncate text-[11px] text-[var(--brand-muted)]">{subtitle(r)}</span>
        )}
      </span>
    ),
  };
}

function labelColumn<T extends SegRow>(header: string): Column<T> {
  return {
    key: "label",
    header,
    grow: true,
    sortValue: (r) => r.label,
    render: (r) => (
      <span className="block truncate" dir="auto">
        {r.label}
      </span>
    ),
  };
}

// Full metric set. `lead` is shown first; `shareOf` adds a % of total.
function segColumns<T extends SegRow>(lead: "views" | "sessions", shareOf?: number): Column<T>[] {
  const counted = (key: "views" | "sessions" | "users", header: string, withShare = false): Column<T> => ({
    key,
    header,
    numeric: true,
    sortValue: (r) => r[key],
    render: (r) => (
      <>
        {int(r[key])}
        {withShare && shareOf ? (
          <span className="ml-1 text-[10px] text-[var(--brand-muted)]">{Math.round((r[key] / shareOf) * 100)}%</span>
        ) : null}
        <Delta now={r[key]} before={r.previous?.[key]} />
      </>
    ),
  });
  const leadCols =
    lead === "views"
      ? [counted("views", "Views"), counted("users", "Users"), counted("sessions", "Sessions")]
      : [counted("sessions", "Sessions", true), counted("users", "Users"), counted("views", "Views")];
  return [...leadCols, ...qualityColumns<T>((r) => r)];
}

function qualityColumns<T>(get: (r: T) => Seg): Column<T>[] {
  return [
    {
      key: "engagementRate",
      header: "Engaged",
      numeric: true,
      sortValue: (r) => get(r).engagementRate,
      csv: (r) => (get(r).engagementRate * 100).toFixed(1),
      render: (r) => <span className="text-[var(--brand-muted)]">{pct(get(r).engagementRate)}</span>,
    },
    {
      key: "avgEngagement",
      header: "Avg time",
      numeric: true,
      sortValue: (r) => get(r).avgEngagement,
      csv: (r) => Math.round(get(r).avgEngagement),
      render: (r) => <span className="text-[var(--brand-muted)]">{duration(get(r).avgEngagement)}</span>,
    },
    {
      key: "keyEvents",
      header: "Key ev.",
      numeric: true,
      sortValue: (r) => get(r).keyEvents,
      render: (r) =>
        get(r).keyEvents ? (
          <span className="font-semibold text-[var(--brand-purple-deep)]">{int(get(r).keyEvents)}</span>
        ) : (
          <span className="text-[var(--brand-muted)]">—</span>
        ),
    },
  ];
}

function compactColumns<T extends SegRow>(totalUsers: number): Column<T>[] {
  return [
    {
      key: "users",
      header: "Users",
      numeric: true,
      sortValue: (r) => r.users,
      render: (r) => (
        <>
          {int(r.users)}
          <span className="ml-1 text-[10px] text-[var(--brand-muted)]">
            {totalUsers ? `${Math.round((r.users / totalUsers) * 100)}%` : ""}
          </span>
        </>
      ),
    },
    { key: "sessions", header: "Sessions", numeric: true, sortValue: (r) => r.sessions, render: (r) => int(r.sessions) },
    {
      key: "engagementRate",
      header: "Engaged",
      numeric: true,
      sortValue: (r) => r.engagementRate,
      csv: (r) => (r.engagementRate * 100).toFixed(1),
      render: (r) => <span className="text-[var(--brand-muted)]">{pct(r.engagementRate)}</span>,
    },
  ];
}

const articleColumns: Column<ArticleRow>[] = [
  {
    key: "title",
    header: "Article",
    grow: true,
    sortValue: (r) => r.title,
    render: (r) => (
      <span className="block truncate text-left" dir="auto">
        <span className="mr-2 rounded-full bg-[var(--brand-blush)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--brand-purple)]">
          {r.language}
        </span>
        <a
          href={`https://pregnawell.com${r.path}`}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]"
        >
          {r.title}
        </a>
        {r.current.views === 0 && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            no views
          </span>
        )}
      </span>
    ),
  },
  {
    key: "views",
    header: "Views",
    numeric: true,
    sortValue: (r) => r.current.views,
    render: (r) => (
      <>
        {int(r.current.views)}
        <Delta now={r.current.views} before={r.previous?.views} />
      </>
    ),
  },
  {
    key: "users",
    header: "Users",
    numeric: true,
    sortValue: (r) => r.current.users,
    render: (r) => int(r.current.users),
  },
  ...qualityColumns<ArticleRow>((r) => r.current),
  {
    key: "published",
    header: "Published",
    numeric: true,
    sortValue: (r) => r.publishAt ?? "",
    render: (r) => (
      <span className="text-[var(--brand-muted)]">
        {r.publishAt
          ? new Date(r.publishAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "—"}
      </span>
    ),
  },
];

const eventColumns: Column<EventRow>[] = [
  {
    key: "name",
    header: "Event",
    grow: true,
    sortValue: (r) => r.name,
    render: (r) => (
      <span className="block truncate font-mono text-xs">
        {r.name}
        {r.keyEvents > 0 && (
          <span className="ml-2 rounded-full bg-[var(--brand-purple)] px-2 py-0.5 font-sans text-[10px] font-semibold text-white">
            key event
          </span>
        )}
        {EVENT_HINTS[r.name] && (
          <span className="ml-2 font-sans text-[11px] text-[var(--brand-muted)]">{EVENT_HINTS[r.name]}</span>
        )}
      </span>
    ),
  },
  {
    key: "count",
    header: "Count",
    numeric: true,
    sortValue: (r) => r.count,
    render: (r) => (
      <>
        {int(r.count)}
        <Delta now={r.count} before={r.previous?.count} />
      </>
    ),
  },
  { key: "users", header: "Users", numeric: true, sortValue: (r) => r.users, render: (r) => int(r.users) },
  {
    key: "perUser",
    header: "Per user",
    numeric: true,
    sortValue: (r) => (r.users ? r.count / r.users : 0),
    csv: (r) => (r.users ? (r.count / r.users).toFixed(2) : "0"),
    render: (r) => <span className="text-[var(--brand-muted)]">{r.users ? (r.count / r.users).toFixed(1) : "—"}</span>,
  },
];

const EVENT_HINTS: Record<string, string> = {
  page_view: "page loads",
  session_start: "new visits",
  first_visit: "brand-new visitors",
  user_engagement: "page in focus 10s+",
  scroll: "reached 90% of a page",
  click: "outbound link clicks",
  view_search_results: "site searches",
  file_download: "downloads",
  form_start: "started a form",
  form_submit: "submitted a form",
  video_start: "embedded video played",
};

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Delta({ now, before }: { now: number; before: number | undefined }) {
  if (before === undefined) return null;
  const diff = now - before;
  if (Math.abs(diff) < 0.5) return null;
  return (
    <span className={`ml-1 text-[10px] font-semibold ${diff > 0 ? "text-emerald-700" : "text-red-700"}`}>
      {diff > 0 ? "▲" : "▼"}
      {Math.abs(Math.round(diff)).toLocaleString("en-US")}
    </span>
  );
}

const BAR = "#6b4ea3";

function Breakdown({
  title,
  note,
  rows,
  total,
  unit = "users",
  capitalize = false,
}: {
  title: string;
  note?: string;
  rows: ({ label: string; value?: number } | SegRow)[];
  total: number;
  unit?: string;
  capitalize?: boolean;
}) {
  const items = rows
    .map((r) => ({ label: r.label, value: "users" in r ? r.users : (r.value ?? 0) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-[var(--brand-purple)]/10">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">{title}</p>
      {note && <p className="mt-0.5 text-[11px] text-[var(--brand-muted)]">{note}</p>}
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--brand-muted)]">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.map((r) => {
            const share = total ? r.value / total : 0;
            return (
              <li key={r.label}>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="truncate text-[var(--brand-ink)]" dir="auto">
                    {capitalize && r.label ? r.label[0].toUpperCase() + r.label.slice(1) : r.label}
                  </span>
                  <span className="whitespace-nowrap tabular-nums text-[var(--brand-muted)]">
                    <span className="font-semibold text-[var(--brand-purple-deep)]">{int(r.value)}</span> {unit} ·{" "}
                    {Math.round(share * 100)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[var(--brand-purple)]/8">
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, share * 100)}%`, background: BAR }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HeatmapCard({ heatmap }: { heatmap: Heatmap }) {
  const max = Math.max(0, ...heatmap.flat());
  const byDay = heatmap.map((row) => row.reduce((s, v) => s + v, 0));
  const byHour = Array.from({ length: 24 }, (_, h) => heatmap.reduce((s, row) => s + row[h], 0));
  const peakDay = byDay.indexOf(Math.max(...byDay));
  const peakHour = byHour.indexOf(Math.max(...byHour));
  const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-[var(--brand-purple)]/10">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">Sessions by day and hour</p>
      <p className="mt-1 text-xs text-[var(--brand-muted)]">
        In the GA property&rsquo;s time zone. Useful for timing posts, stories and WhatsApp broadcasts.
        {max > 0 && (
          <>
            {" "}
            Busiest: <strong className="text-[var(--brand-ink)]">{DAYS[peakDay]}</strong> and around{" "}
            <strong className="text-[var(--brand-ink)]">{hourLabel(peakHour)}</strong>.
          </>
        )}
      </p>
      {max === 0 ? (
        <p className="mt-4 text-sm text-[var(--brand-muted)]">No data for this period yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[3px] text-[10px]">
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center text-[var(--brand-muted)]">
                {h % 3 === 0 ? hourLabel(h) : ""}
              </span>
            ))}
            {heatmap.map((row, d) => (
              <Row key={d} label={DAYS[d]}>
                {row.map((v, h) => (
                  <span
                    key={h}
                    className="aspect-square rounded-[3px]"
                    title={`${DAYS[d]} ${hourLabel(h)}: ${v} session${v === 1 ? "" : "s"}`}
                    style={{ background: BAR, opacity: v ? 0.12 + 0.88 * (v / max) : 0.04 }}
                  />
                ))}
              </Row>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="self-center text-[var(--brand-muted)]">{label}</span>
      {children}
    </>
  );
}

function MiniTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left uppercase tracking-wider text-[var(--brand-muted)]">
          {head.map((h, i) => (
            <th key={h} className={`py-1 font-semibold ${i > 0 ? "pl-3 text-right" : ""}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i} className="border-t border-[var(--brand-purple)]/5">
            {cells.map((c, j) => (
              <td key={j} className={`py-1.5 ${j > 0 ? "pl-3 text-right tabular-nums whitespace-nowrap" : ""}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function flag(alpha2: string | null): string {
  if (!alpha2) return "🌐";
  return String.fromCodePoint(...[...alpha2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
