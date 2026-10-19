"use client";

import { useMemo, useState, type ReactNode } from "react";
import type {
  AppearanceStat,
  Cannibalization,
  ContentStat,
  CountryStat,
  DeviceStat,
  GscPerformanceSummary,
  LowCtrPage,
  Metrics,
  Opportunity,
  PageStat,
  QueryMove,
  QueryPageStat,
  QueryStat,
  SearchTypeStat,
} from "@/lib/gscSummary";
import DataTable, { type Column } from "./DataTable";

const TABS = [
  ["queries", "Queries"],
  ["pages", "Pages"],
  ["articles", "Articles"],
  ["opportunities", "Opportunities"],
  ["movers", "Movers"],
  ["cannibalization", "Cannibalization"],
  ["audience", "Audience"],
] as const;
type Tab = (typeof TABS)[number][0];

const int = (v: number) => Math.round(v).toLocaleString("en-US");
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const pos = (v: number) => (v ? v.toFixed(1) : "—");

// Everything below the stat cards: full query / page tables with drill-down,
// per-article performance, insight lists and audience breakdowns. All data
// arrives pre-assembled from lib/gscSummary (same payload as the partner API).
export default function GscExplorer({ summary }: { summary: GscPerformanceSummary }) {
  const [tab, setTab] = useState<Tab>("queries");
  const { insights } = summary;

  const pagesByQuery = useMemo(() => groupBy(summary.queryPages, (r) => r.query), [summary.queryPages]);
  const queriesByPage = useMemo(() => groupBy(summary.queryPages, (r) => r.url), [summary.queryPages]);

  const counts: Partial<Record<Tab, number>> = {
    queries: summary.queries.length,
    pages: summary.pages.length,
    articles: summary.content.length,
    opportunities: insights.opportunities.length + insights.lowCtrPages.length,
    cannibalization: insights.cannibalization.length,
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
              <span className={`ml-1.5 ${tab === key ? "text-white/70" : "opacity-60"}`}>
                {int(counts[key]!)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === "queries" && (
          <DataTable<QueryStat>
            title="Queries"
            subtitle="Click a query to see which pages rank for it. Arrows compare with the previous period."
            rows={summary.queries}
            rowKey={(r) => r.query}
            columns={[
              queryColumn,
              ...metricColumns<QueryStat>((r) => r.previous),
            ]}
            initialSort={{ key: "clicks", dir: "desc" }}
            searchText={(r) => r.query}
            csvName={`queries-${summary.days}d`}
            expand={(r) => <PairList rows={pagesByQuery.get(r.query) ?? []} show="page" />}
          />
        )}

        {tab === "pages" && (
          <DataTable<PageStat>
            title="Pages"
            subtitle="Click a page to see the queries it ranks for."
            rows={summary.pages}
            rowKey={(r) => r.url}
            columns={[pageColumn, ...metricColumns<PageStat>((r) => r.previous)]}
            initialSort={{ key: "clicks", dir: "desc" }}
            searchText={(r) => r.path}
            csvName={`pages-${summary.days}d`}
            expand={(r) => <PairList rows={queriesByPage.get(r.url) ?? []} show="query" />}
          />
        )}

        {tab === "articles" && (
          <DataTable<ContentStat>
            title="Published articles"
            subtitle="Every live blog post with its search performance. Zero impressions means Google didn't show it at all in this period."
            rows={summary.content}
            rowKey={(r) => r.url}
            columns={[
              {
                key: "title",
                header: "Article",
                grow: true,
                sortValue: (r) => r.title,
                render: (r) => (
                  <span className="block truncate text-left" dir="auto">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]"
                    >
                      {r.title}
                    </a>
                    {r.current.impressions === 0 && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        no impressions
                      </span>
                    )}
                  </span>
                ),
              },
              {
                key: "language",
                header: "Lang",
                sortValue: (r) => r.language,
                render: (r) => <span className="text-xs uppercase text-[var(--brand-muted)]">{r.language}</span>,
              },
              {
                key: "published",
                header: "Published",
                sortValue: (r) => r.publishAt ?? "",
                render: (r) => (
                  <span className="text-xs text-[var(--brand-muted)]">
                    {r.publishAt ? shortDate(r.publishAt) : "—"}
                  </span>
                ),
              },
              ...metricColumns<ContentStat>((r) => r.previous, (r) => r.current),
            ]}
            initialSort={{ key: "clicks", dir: "desc" }}
            searchText={(r) => `${r.title} ${r.path}`}
            csvName={`articles-${summary.days}d`}
            expand={(r) =>
              r.topQueries.length === 0 ? (
                <p className="text-xs text-[var(--brand-muted)]">No queries recorded for this article yet.</p>
              ) : (
                <MiniTable
                  head={["Top queries", "Clicks", "Impr.", "Pos."]}
                  rows={r.topQueries.map((q) => [
                    <span key="q" dir="auto">{q.query}</span>,
                    int(q.clicks),
                    int(q.impressions),
                    pos(q.position),
                  ])}
                />
              )
            }
          />
        )}

        {tab === "opportunities" && (
          <>
            <DataTable<Opportunity>
              title="Striking distance"
              subtitle={`Queries ranking 4–20 with at least ${summary.limits.minImpressions} impressions. “Est. gain” is a rough guess at extra clicks if the query reached position 3. Improve or expand the page that ranks (click the row to see it).`}
              rows={insights.opportunities}
              rowKey={(r) => r.query}
              columns={[
                queryColumn,
                {
                  key: "gain",
                  header: "Est. gain",
                  numeric: true,
                  sortValue: (r) => r.estimatedExtraClicks,
                  render: (r) => <span className="font-semibold text-emerald-700">+{int(r.estimatedExtraClicks)}</span>,
                },
                ...metricColumns<Opportunity>(() => null),
              ]}
              initialSort={{ key: "gain", dir: "desc" }}
              searchText={(r) => r.query}
              csvName={`opportunities-${summary.days}d`}
              expand={(r) => <PairList rows={pagesByQuery.get(r.query) ?? []} show="page" />}
              emptyText="No striking-distance queries in this period."
            />
            <DataTable<LowCtrPage>
              title="Low click-through on page one"
              subtitle="Pages ranking in the top 10 whose CTR is under half of what that position usually gets. Rewrite the title and meta description first."
              rows={insights.lowCtrPages}
              rowKey={(r) => r.url}
              columns={[
                pageColumn,
                {
                  key: "expected",
                  header: "Typical CTR",
                  numeric: true,
                  sortValue: (r) => r.expectedCtr,
                  render: (r) => <span className="text-[var(--brand-muted)]">{pct(r.expectedCtr)}</span>,
                },
                ...metricColumns<LowCtrPage>(() => null),
              ]}
              initialSort={{ key: "impressions", dir: "desc" }}
              searchText={(r) => r.path}
              csvName={`low-ctr-pages-${summary.days}d`}
              expand={(r) => <PairList rows={queriesByPage.get(r.url) ?? []} show="query" />}
              emptyText="No page-one pages with unusually low CTR."
            />
          </>
        )}

        {tab === "movers" && (
          <div className="grid gap-4 xl:grid-cols-2">
            <MoversTable title="Rising queries" rows={insights.risingQueries} days={summary.days} name="rising" />
            <MoversTable title="Declining queries" rows={insights.decliningQueries} days={summary.days} name="declining" />
            <MoversTable title="New queries" rows={insights.newQueries} days={summary.days} name="new" />
            <MoversTable title="Lost queries" rows={insights.lostQueries} days={summary.days} name="lost" />
          </div>
        )}

        {tab === "cannibalization" && (
          <DataTable<Cannibalization>
            title="Pages competing for the same query"
            subtitle="Each of these queries sends meaningful impressions to two or more of our pages. Consider merging the articles, or linking the weaker one to the stronger one. English/Arabic twins of the same article are expected."
            rows={insights.cannibalization}
            rowKey={(r) => r.query}
            columns={[
              queryColumn,
              {
                key: "pages",
                header: "Pages",
                numeric: true,
                sortValue: (r) => r.pages.length,
                render: (r) => int(r.pages.length),
              },
              {
                key: "clicks",
                header: "Clicks",
                numeric: true,
                sortValue: (r) => r.clicks,
                render: (r) => int(r.clicks),
              },
              {
                key: "impressions",
                header: "Impr.",
                numeric: true,
                sortValue: (r) => r.impressions,
                render: (r) => int(r.impressions),
              },
            ]}
            initialSort={{ key: "impressions", dir: "desc" }}
            searchText={(r) => r.query}
            csvName={`cannibalization-${summary.days}d`}
            expand={(r) => <PairList rows={r.pages} show="page" />}
            emptyText="No queries are split across several pages."
          />
        )}

        {tab === "audience" && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <DataTable<CountryStat>
                title="Countries"
                rows={summary.countries}
                rowKey={(r) => r.code}
                columns={[
                  {
                    key: "name",
                    header: "Country",
                    grow: true,
                    sortValue: (r) => r.name,
                    csv: (r) => `${r.name} (${r.code.toUpperCase()})`,
                    render: (r) => (
                      <span>
                        {flag(r.alpha2)} {r.name}
                      </span>
                    ),
                  },
                  ...shareColumns<CountryStat>(summary.totals.current),
                ]}
                initialSort={{ key: "clicks", dir: "desc" }}
                searchText={(r) => r.name}
                csvName={`countries-${summary.days}d`}
              />
              <div className="space-y-4">
                <DataTable<DeviceStat>
                  title="Devices"
                  rows={summary.devices}
                  rowKey={(r) => r.device}
                  columns={[
                    {
                      key: "device",
                      header: "Device",
                      grow: true,
                      sortValue: (r) => r.device,
                      render: (r) => cap(r.device),
                    },
                    ...shareColumns<DeviceStat>(summary.totals.current),
                  ]}
                  initialSort={{ key: "clicks", dir: "desc" }}
                />
                <DataTable<SearchTypeStat>
                  title="Search type"
                  subtitle="Google reports each results tab separately. Discover and Google News have no queries or positions."
                  rows={summary.searchTypes}
                  rowKey={(r) => r.type}
                  columns={[
                    {
                      key: "type",
                      header: "Type",
                      grow: true,
                      sortValue: (r) => r.type,
                      render: (r) => (
                        <span title={r.error ?? undefined}>
                          {SEARCH_TYPE_LABELS[r.type]}
                          {r.error && <span className="ml-1 text-xs text-[var(--brand-muted)]">(unavailable)</span>}
                        </span>
                      ),
                    },
                    {
                      key: "clicks",
                      header: "Clicks",
                      numeric: true,
                      sortValue: (r) => r.clicks,
                      render: (r) => int(r.clicks),
                    },
                    {
                      key: "impressions",
                      header: "Impr.",
                      numeric: true,
                      sortValue: (r) => r.impressions,
                      render: (r) => int(r.impressions),
                    },
                    {
                      key: "ctr",
                      header: "CTR",
                      numeric: true,
                      sortValue: (r) => r.ctr,
                      render: (r) => pct(r.ctr),
                    },
                  ]}
                />
              </div>
            </div>
            <DataTable<AppearanceStat>
              title="Search appearance"
              subtitle="Rich result and special formats Google showed our pages in."
              rows={summary.searchAppearance}
              rowKey={(r) => r.appearance}
              columns={[
                {
                  key: "label",
                  header: "Appearance",
                  grow: true,
                  sortValue: (r) => r.label,
                  render: (r) => r.label,
                },
                ...shareColumns<AppearanceStat>(summary.totals.current),
              ]}
              initialSort={{ key: "impressions", dir: "desc" }}
              emptyText="No special search appearances recorded."
            />
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column builders
// ---------------------------------------------------------------------------

const queryColumn: Column<{ query: string }> = {
  key: "query",
  header: "Query",
  grow: true,
  sortValue: (r) => r.query,
  render: (r) => (
    <span className="block truncate text-left text-[var(--brand-ink)]" dir="auto" title={r.query}>
      {r.query}
    </span>
  ),
};

const pageColumn: Column<{ url: string; path: string }> = {
  key: "page",
  header: "Page",
  grow: true,
  sortValue: (r) => r.path,
  csv: (r) => r.url,
  render: (r) => (
    <a
      href={r.url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      dir="auto"
      title={r.path}
      className="block truncate text-left font-mono text-xs text-[var(--brand-purple-deep)] hover:text-[var(--brand-rose)]"
    >
      {r.path}
    </a>
  ),
};

function metricColumns<T>(
  previous: (r: T) => Metrics | null,
  current: (r: T) => Metrics = (r) => r as unknown as Metrics
): Column<T>[] {
  return [
    {
      key: "clicks",
      header: "Clicks",
      numeric: true,
      sortValue: (r) => current(r).clicks,
      render: (r) => (
        <>
          {int(current(r).clicks)}
          <Delta now={current(r).clicks} before={previous(r)?.clicks} />
        </>
      ),
    },
    {
      key: "impressions",
      header: "Impr.",
      numeric: true,
      sortValue: (r) => current(r).impressions,
      render: (r) => (
        <>
          {int(current(r).impressions)}
          <Delta now={current(r).impressions} before={previous(r)?.impressions} />
        </>
      ),
    },
    {
      key: "ctr",
      header: "CTR",
      numeric: true,
      sortValue: (r) => current(r).ctr,
      csv: (r) => (current(r).ctr * 100).toFixed(2),
      render: (r) => pct(current(r).ctr),
    },
    {
      key: "position",
      header: "Pos.",
      numeric: true,
      sortValue: (r) => current(r).position || Number.MAX_SAFE_INTEGER,
      csv: (r) => current(r).position.toFixed(1),
      render: (r) => {
        const p = previous(r)?.position;
        return (
          <span className="text-[var(--brand-muted)]">
            {pos(current(r).position)}
            {/* lower is better, so the arrow points up when position drops */}
            {p ? <Delta now={-current(r).position} before={-p} decimals={1} /> : null}
          </span>
        );
      },
    },
  ];
}

function shareColumns<T extends Metrics>(total: Metrics): Column<T>[] {
  return [
    {
      key: "clicks",
      header: "Clicks",
      numeric: true,
      sortValue: (r) => r.clicks,
      render: (r) => (
        <>
          {int(r.clicks)}
          <span className="ml-1 text-[10px] text-[var(--brand-muted)]">
            {total.clicks ? `${Math.round((r.clicks / total.clicks) * 100)}%` : ""}
          </span>
        </>
      ),
    },
    {
      key: "impressions",
      header: "Impr.",
      numeric: true,
      sortValue: (r) => r.impressions,
      render: (r) => int(r.impressions),
    },
    {
      key: "ctr",
      header: "CTR",
      numeric: true,
      sortValue: (r) => r.ctr,
      csv: (r) => (r.ctr * 100).toFixed(2),
      render: (r) => pct(r.ctr),
    },
    {
      key: "position",
      header: "Pos.",
      numeric: true,
      sortValue: (r) => r.position || Number.MAX_SAFE_INTEGER,
      csv: (r) => r.position.toFixed(1),
      render: (r) => <span className="text-[var(--brand-muted)]">{pos(r.position)}</span>,
    },
  ];
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Delta({ now, before, decimals = 0 }: { now: number; before: number | undefined; decimals?: number }) {
  if (before === undefined) return null;
  const diff = now - before;
  if (Math.abs(diff) < (decimals ? 0.05 : 0.5)) return null;
  return (
    <span className={`ml-1 text-[10px] font-semibold ${diff > 0 ? "text-emerald-700" : "text-red-700"}`}>
      {diff > 0 ? "▲" : "▼"}
      {Math.abs(diff).toLocaleString("en-US", { maximumFractionDigits: decimals })}
    </span>
  );
}

function MoversTable({ title, rows, days, name }: { title: string; rows: QueryMove[]; days: number; name: string }) {
  return (
    <DataTable<QueryMove>
      title={title}
      rows={rows}
      rowKey={(r) => r.query}
      columns={[
        queryColumn,
        {
          key: "clicksChange",
          header: "Δ Clicks",
          numeric: true,
          sortValue: (r) => r.clicksChange,
          render: (r) => <Signed value={r.clicksChange} />,
        },
        {
          key: "impressionsChange",
          header: "Δ Impr.",
          numeric: true,
          sortValue: (r) => r.impressionsChange,
          render: (r) => <Signed value={r.impressionsChange} />,
        },
        {
          key: "position",
          header: "Pos.",
          numeric: true,
          sortValue: (r) => r.current?.position ?? Number.MAX_SAFE_INTEGER,
          csv: (r) => `${r.previous ? r.previous.position.toFixed(1) : ""} -> ${r.current ? r.current.position.toFixed(1) : ""}`,
          render: (r) => (
            <span className="text-[var(--brand-muted)]">
              {r.previous ? pos(r.previous.position) : "—"} → {r.current ? pos(r.current.position) : "—"}
            </span>
          ),
        },
      ]}
      searchText={(r) => r.query}
      csvName={`${name}-queries-${days}d`}
      emptyText="Nothing here for this period."
    />
  );
}

function Signed({ value }: { value: number }) {
  if (value === 0) return <span className="text-[var(--brand-muted)]">0</span>;
  return (
    <span className={value > 0 ? "text-emerald-700" : "text-red-700"}>
      {value > 0 ? "+" : "−"}
      {int(Math.abs(value))}
    </span>
  );
}

function PairList({ rows, show }: { rows: QueryPageStat[]; show: "page" | "query" }) {
  if (rows.length === 0) {
    return <p className="text-xs text-[var(--brand-muted)]">No breakdown available for this row.</p>;
  }
  const sorted = [...rows].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
  return (
    <MiniTable
      head={[show === "page" ? "Ranking pages" : "Queries for this page", "Clicks", "Impr.", "CTR", "Pos."]}
      rows={sorted.slice(0, 50).map((r) => [
        show === "page" ? (
          <a
            key="p"
            href={r.url}
            target="_blank"
            rel="noreferrer"
            dir="auto"
            className="font-mono text-xs text-[var(--brand-purple-deep)] hover:text-[var(--brand-rose)]"
          >
            {r.path}
          </a>
        ) : (
          <span key="q" dir="auto">
            {r.query}
          </span>
        ),
        int(r.clicks),
        int(r.impressions),
        pct(r.ctr),
        pos(r.position),
      ])}
      footer={sorted.length > 50 ? `+ ${sorted.length - 50} more` : undefined}
    />
  );
}

function MiniTable({ head, rows, footer }: { head: string[]; rows: ReactNode[][]; footer?: string }) {
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
      {footer && (
        <tfoot>
          <tr>
            <td colSpan={head.length} className="pt-2 text-[var(--brand-muted)]">
              {footer}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

const SEARCH_TYPE_LABELS: Record<SearchTypeStat["type"], string> = {
  web: "Web",
  image: "Image",
  video: "Video",
  news: "News tab",
  discover: "Discover",
  googleNews: "Google News",
};

function groupBy<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = map.get(k);
    if (list) list.push(r);
    else map.set(k, [r]);
  }
  return map;
}

function flag(alpha2: string | null): string {
  if (!alpha2) return "🌐";
  return String.fromCodePoint(...[...alpha2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function cap(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
