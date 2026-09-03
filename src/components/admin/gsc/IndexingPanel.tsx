"use client";

import { useMemo, useState, useTransition } from "react";
import {
  inspectPagesAction,
  type InspectionRecord,
} from "@/app/admin/search-console/actions";

const BATCH_SIZE = 8;

type Props = {
  urls: string[];
  initial: InspectionRecord[];
};

// Walks every site URL through the URL Inspection API in small batches via a
// server action, showing progress; results are cached in Postgres so the
// last-known status survives reloads.
export default function IndexingPanel({ urls, initial }: Props) {
  const [records, setRecords] = useState<Map<string, InspectionRecord>>(
    () => new Map(initial.map((r) => [r.url, r]))
  );
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "indexed" | "www" | "not-indexed" | "unchecked">("all");
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    let indexed = 0;
    let onWww = 0;
    let notIndexed = 0;
    let unchecked = 0;
    for (const url of urls) {
      const r = records.get(url);
      if (!r) unchecked++;
      else if (r.verdict === "PASS") indexed++;
      else if (r.wwwVerdict === "PASS") onWww++;
      else notIndexed++;
    }
    return { indexed, onWww, notIndexed, unchecked };
  }, [urls, records]);

  const visible = urls.filter((url) => {
    const r = records.get(url);
    if (filter === "indexed") return r?.verdict === "PASS";
    if (filter === "www") return !!r && r.verdict !== "PASS" && r.wwwVerdict === "PASS";
    if (filter === "not-indexed")
      return !!r && r.verdict !== "PASS" && r.wwwVerdict !== "PASS";
    if (filter === "unchecked") return !r;
    return true;
  });

  function runCheck(targets: string[]) {
    setError(null);
    setProgress({ done: 0, total: targets.length });
    startTransition(async () => {
      let done = 0;
      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);
        const res = await inspectPagesAction(batch);
        if (!res.ok || !res.results) {
          setError(res.error ?? "Inspection failed.");
          break;
        }
        setRecords((prev) => {
          const next = new Map(prev);
          for (const r of res.results!) next.set(r.url, r);
          return next;
        });
        done += batch.length;
        setProgress({ done, total: targets.length });
      }
      setProgress(null);
    });
  }

  return (
    <div className="rounded-3xl bg-white ring-1 ring-[var(--brand-purple)]/10 overflow-hidden shadow-[0_15px_40px_-30px_rgba(61,42,110,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--brand-purple)]/10 px-6 py-4">
        <div>
          <h2 className="font-display text-xl text-[var(--brand-purple-deep)]">
            Indexing status
          </h2>
          <p className="mt-0.5 text-xs text-[var(--brand-muted)]">
            {urls.length} pages · {counts.indexed} indexed
            {counts.onWww > 0 && <> · {counts.onWww} on www (migrating)</>} ·{" "}
            {counts.notIndexed} not indexed · {counts.unchecked} unchecked
          </p>
        </div>
        <div className="flex items-center gap-3">
          {progress && (
            <div className="flex items-center gap-2 text-xs text-[var(--brand-muted)]">
              <span className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--brand-blush)]">
                <span
                  className="block h-full rounded-full bg-[var(--brand-purple)] transition-all"
                  style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
                />
              </span>
              {progress.done}/{progress.total}
            </div>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => runCheck(urls)}
            className="rounded-full bg-[var(--brand-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-purple-deep)] disabled:opacity-50"
          >
            {isPending ? "Checking…" : "Check all pages"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-[var(--brand-purple)]/5 px-6 py-3 text-xs">
        {(
          [
            ["all", "All"],
            ["indexed", "Indexed"],
            ["www", "On www"],
            ["not-indexed", "Not indexed"],
            ["unchecked", "Unchecked"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              filter === key
                ? "bg-[var(--brand-purple)] text-white"
                : "bg-[var(--brand-blush)]/60 text-[var(--brand-muted)] hover:text-[var(--brand-purple)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-h-[520px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-[var(--brand-purple)]/10 text-left text-xs uppercase tracking-wider text-[var(--brand-muted)]">
              <th className="px-6 py-3 font-semibold">Page</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Coverage</th>
              <th className="px-4 py-3 font-semibold">Last crawl</th>
              <th className="px-4 py-3 font-semibold w-1"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-[var(--brand-muted)]">
                  Nothing matches this filter.
                </td>
              </tr>
            )}
            {visible.map((url) => {
              const r = records.get(url);
              const path = url.replace("https://pregnawell.com", "") || "/";
              return (
                <tr
                  key={url}
                  className="border-b border-[var(--brand-purple)]/5 last:border-0 hover:bg-[var(--brand-blush)]/30"
                >
                  <td className="px-6 py-3">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-[var(--brand-purple-deep)] hover:text-[var(--brand-rose)]"
                    >
                      {path}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <VerdictPill verdict={r?.verdict} wwwVerdict={r?.wwwVerdict} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--brand-muted)]">
                    {r && r.verdict !== "PASS" && r.wwwVerdict === "PASS"
                      ? `www: ${r.wwwCoverageState ?? "Indexed"} — apex: ${r.coverageState || "unknown"}`
                      : r?.coverageState || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--brand-muted)] whitespace-nowrap">
                    {r?.lastCrawlTime
                      ? new Date(r.lastCrawlTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runCheck([url])}
                      className="text-xs font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)] disabled:opacity-50"
                    >
                      Re-check
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VerdictPill({
  verdict,
  wwwVerdict,
}: {
  verdict?: string;
  wwwVerdict?: string | null;
}) {
  if (verdict && verdict !== "PASS" && wwwVerdict === "PASS") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 whitespace-nowrap">
        <span aria-hidden>⇄</span> Indexed under www (migrating)
      </span>
    );
  }
  if (!verdict) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
        <span aria-hidden>○</span> Unchecked
      </span>
    );
  }
  if (verdict === "PASS") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        <span aria-hidden>✓</span> Indexed
      </span>
    );
  }
  if (verdict === "FAIL") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
        <span aria-hidden>✕</span> Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
      <span aria-hidden>!</span> Not indexed
    </span>
  );
}
