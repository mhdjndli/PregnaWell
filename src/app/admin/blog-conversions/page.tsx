import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import {
  CONVERSION_RANGES,
  CTA_LABELS,
  PLACEMENT_LABELS,
  REPORT_TZ,
  getConversionsReport,
  parseConversionDays,
  type ConversionsReport,
  type CtaId,
} from "@/lib/ctaClicks";
import AdminShell from "@/components/admin/AdminShell";
import TrendChart from "@/components/admin/gsc/TrendChart";

export const dynamic = "force-dynamic";

const CLICKS_COLOR = "#6b4ea3";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CTA_COLUMNS: CtaId[] = ["fertility_score", "masterclass", "booking"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: REPORT_TZ,
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: REPORT_TZ,
  });
}

export default async function BlogConversionsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; post?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin");

  const params = await searchParams;
  const days = parseConversionDays(params.days);
  const postId = params.post && UUID_RE.test(params.post) ? params.post : null;

  let report: ConversionsReport | null = null;
  let error: string | null = null;
  try {
    report = await getConversionsReport(days, postId);
  } catch (err) {
    error = (err as Error).message;
  }

  const href = (d: number, p: string | null) =>
    `/admin/blog-conversions?days=${d}${p ? `&post=${p}` : ""}`;
  const selected = postId ? report?.posts.find((p) => p.postId === postId) : null;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl text-[var(--brand-purple-deep)]">Blog conversions</h1>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            Every click from a blog post into the funnel — Fertility Score, Masterclass and
            booking links. Times are Dubai time (GST).
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-[var(--brand-purple)]/10">
          {CONVERSION_RANGES.map((r) => (
            <Link
              key={r}
              href={href(r, postId)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                r === days
                  ? "bg-[var(--brand-purple)] text-white"
                  : "text-[var(--brand-muted)] hover:text-[var(--brand-purple)]"
              }`}
            >
              {r === 365 ? "1y" : `${r}d`}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-8 rounded-2xl bg-red-50 p-5 text-sm text-red-800 ring-1 ring-red-100">
          <p className="font-semibold">Could not load conversions</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {report && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="CTA clicks"
              value={report.totals.clicks.toLocaleString("en-US")}
              note={deltaNote(report.totals.clicks, report.totals.previousClicks)}
              tone="purple"
            />
            <Stat label="Unique visitors" value={report.totals.visitors.toLocaleString("en-US")} />
            <Stat label="Posts converting" value={report.totals.posts.toLocaleString("en-US")} />
            <Stat
              label="Top CTA"
              value={report.byCta[0] ? CTA_LABELS[report.byCta[0].cta] : "—"}
              note={
                report.byCta[0]
                  ? `${report.byCta[0].clicks.toLocaleString("en-US")} clicks`
                  : undefined
              }
            />
          </div>

          {report.byCta.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {report.byCta.map((c) => (
                <span
                  key={c.cta}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--brand-purple-deep)] ring-1 ring-[var(--brand-purple)]/10"
                >
                  {CTA_LABELS[c.cta]} · {c.clicks.toLocaleString("en-US")}
                </span>
              ))}
            </div>
          )}

          {postId && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--brand-blush)]/60 px-5 py-3 text-sm">
              <span className="text-[var(--brand-muted)]">Showing chart and click log for</span>
              <span className="font-semibold text-[var(--brand-purple-deep)]" dir="auto">
                {selected?.title ?? "this post"}
              </span>
              <Link
                href={href(days, null)}
                className="ms-auto text-xs font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
              >
                Show all posts ✕
              </Link>
            </div>
          )}

          <div className="mt-6">
            <TrendChart
              label={postId ? "CTA clicks per day — this post" : "CTA clicks per day"}
              color={CLICKS_COLOR}
              points={report.series}
            />
          </div>

          <section className="mt-8">
            <h2 className="font-display text-xl text-[var(--brand-purple-deep)]">Clicks by post</h2>
            {report.posts.length === 0 ? (
              <Empty />
            ) : (
              <div className="mt-3 overflow-x-auto rounded-2xl bg-white ring-1 ring-[var(--brand-purple)]/10">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--brand-purple)]/10 text-left text-xs uppercase tracking-wider text-[var(--brand-muted)]">
                      <th className="px-4 py-3 font-semibold">Post</th>
                      <th className="px-3 py-3 text-right font-semibold">Clicks</th>
                      <th className="px-3 py-3 text-right font-semibold">Visitors</th>
                      {CTA_COLUMNS.map((c) => (
                        <th key={c} className="whitespace-nowrap px-3 py-3 text-right font-semibold">
                          {CTA_LABELS[c]}
                        </th>
                      ))}
                      <th className="px-4 py-3 font-semibold">Last click</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.posts.map((p) => {
                      const active = p.postId !== null && p.postId === postId;
                      return (
                        <tr
                          key={p.postId ?? `${p.language}/${p.slug}`}
                          className={`border-b border-[var(--brand-purple)]/5 last:border-0 ${
                            active ? "bg-[var(--brand-blush)]/50" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-[var(--brand-cream)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--brand-muted)]">
                                {p.language}
                              </span>
                              {p.postId ? (
                                <Link
                                  href={href(days, p.postId)}
                                  className="font-semibold text-[var(--brand-purple-deep)] hover:text-[var(--brand-purple)]"
                                  dir="auto"
                                >
                                  {p.title}
                                </Link>
                              ) : (
                                <span className="text-[var(--brand-muted)]" dir="auto">
                                  {p.title} <em className="text-xs">(deleted)</em>
                                </span>
                              )}
                              {p.postId && (
                                <a
                                  href={`/${p.language}/blog/${encodeURIComponent(p.slug)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-[var(--brand-muted)] hover:text-[var(--brand-purple)]"
                                  aria-label="Open post"
                                >
                                  ↗
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums text-[var(--brand-purple-deep)]">
                            {p.clicks.toLocaleString("en-US")}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {p.visitors.toLocaleString("en-US")}
                          </td>
                          {CTA_COLUMNS.map((c) => (
                            <td key={c} className="px-3 py-3 text-right tabular-nums text-[var(--brand-muted)]">
                              {p.byCta[c] ? p.byCta[c]!.toLocaleString("en-US") : "—"}
                            </td>
                          ))}
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--brand-muted)]">
                            {fmtDate(p.lastClickAt)} · {fmtTime(p.lastClickAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl text-[var(--brand-purple-deep)]">Click log</h2>
            <p className="mt-1 text-xs text-[var(--brand-muted)]">
              Most recent first{report.log.length === 500 ? " · latest 500 shown" : ""}.
            </p>
            {report.log.length === 0 ? (
              <Empty />
            ) : (
              <div className="mt-3 overflow-x-auto rounded-2xl bg-white ring-1 ring-[var(--brand-purple)]/10">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--brand-purple)]/10 text-left text-xs uppercase tracking-wider text-[var(--brand-muted)]">
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-3 py-3 font-semibold">Time</th>
                      <th className="px-3 py-3 font-semibold">Post</th>
                      <th className="px-3 py-3 font-semibold">CTA</th>
                      <th className="px-3 py-3 font-semibold">Where</th>
                      <th className="px-4 py-3 font-semibold">Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.log.map((r) => (
                      <tr key={r.id} className="border-b border-[var(--brand-purple)]/5 last:border-0">
                        <td className="whitespace-nowrap px-4 py-2.5">{fmtDate(r.clickedAt)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-[var(--brand-muted)]">
                          {fmtTime(r.clickedAt)}
                        </td>
                        <td className="max-w-[320px] truncate px-3 py-2.5" dir="auto">
                          {r.postId ? (
                            <Link
                              href={href(days, r.postId)}
                              className="text-[var(--brand-purple-deep)] hover:text-[var(--brand-purple)]"
                            >
                              {r.title}
                            </Link>
                          ) : (
                            <span className="text-[var(--brand-muted)]">{r.title}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="rounded-full bg-[var(--brand-blush)] px-2 py-0.5 text-xs font-semibold text-[var(--brand-rose)]">
                            {CTA_LABELS[r.cta] ?? r.cta}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-[var(--brand-muted)]">
                          {PLACEMENT_LABELS[r.placement] ?? r.placement}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs capitalize text-[var(--brand-muted)]">
                          {r.device ?? "—"}
                          {r.country ? ` · ${r.country}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}

function deltaNote(now: number, before: number): string | undefined {
  if (before === 0) return undefined;
  const d = (now - before) / before;
  return `${d >= 0 ? "▲" : "▼"} ${Math.abs(d * 100).toFixed(0)}% vs previous period`;
}

function Stat({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "default" | "purple";
}) {
  return (
    <div
      className={`rounded-2xl p-5 ring-1 ring-[var(--brand-purple)]/10 ${
        tone === "purple" ? "bg-[var(--brand-purple-deep)] text-white" : "bg-white text-[var(--brand-purple-deep)]"
      }`}
    >
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      {note && (
        <p className={`mt-1 text-xs font-semibold ${tone === "purple" ? "text-white/80" : "text-[var(--brand-muted)]"}`}>
          {note}
        </p>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="mt-3 rounded-2xl bg-white p-8 text-center text-sm text-[var(--brand-muted)] ring-1 ring-[var(--brand-purple)]/10">
      No CTA clicks in this period yet. Clicks show up here the moment a reader taps a
      funnel link on any blog post.
    </div>
  );
}
