"use client";

import { useEffect, useState, useTransition } from "react";
import type { Realtime } from "@/lib/gaSummary";
import { realtimeAction } from "@/app/admin/analytics/actions";

const REFRESH_MS = 60_000;
const BAR_COLOR = "#6b4ea3";

// Live "right now" card: active users in the last 30 minutes, refreshed
// every minute while the tab is visible.
export default function RealtimePanel({ initial, initialError }: { initial: Realtime | null; initialError: string | null }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState(initialError);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const res = await realtimeAction();
      if (res.ok && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error ?? "Could not load realtime data.");
      }
    });
  }

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const max = Math.max(1, ...(data?.perMinute ?? []));

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-[var(--brand-purple)]/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">
            Right now · last 30 minutes
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--brand-muted)]">
          {data && (
            <span>
              Updated{" "}
              {new Date(data.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={pending}
            className="rounded-full bg-[var(--brand-blush)]/70 px-3 py-1.5 font-semibold text-[var(--brand-purple)] transition hover:bg-[var(--brand-blush)] disabled:opacity-50"
          >
            {pending ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="font-display text-4xl text-[var(--brand-purple-deep)]">
              {data.activeUsers.toLocaleString("en-US")}
            </p>
            <p className="text-xs text-[var(--brand-muted)]">active users</p>
            <div
              className="mt-4 flex h-16 items-end gap-[2px]"
              role="img"
              aria-label={`Active users per minute, peak ${max}`}
            >
              {data.perMinute.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  title={`${29 - i === 0 ? "This minute" : `${29 - i} min ago`}: ${v} user${v === 1 ? "" : "s"}`}
                  style={{
                    height: `${v ? Math.max(6, (v / max) * 100) : 3}%`,
                    background: v ? BAR_COLOR : "var(--brand-purple)",
                    opacity: v ? 1 : 0.1,
                  }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[var(--brand-muted)]">
              <span>-30 min</span>
              <span>now</span>
            </div>
          </div>

          <List
            title="Pages being viewed"
            rows={data.pages.map((p) => [p.title || "(untitled)", p.users])}
            empty="Nobody on the site right now."
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <List title="Countries" rows={data.countries.map((c) => [c.name, c.users])} />
            <List
              title="Devices"
              rows={data.devices.map((d) => [d.name ? d.name[0].toUpperCase() + d.name.slice(1) : "—", d.users])}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function List({ title, rows, empty = "—" }: { title: string; rows: [string, number][]; empty?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-muted)]">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--brand-muted)]">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-xs">
          {rows.slice(0, 6).map(([label, value]) => (
            <li key={label} className="flex items-center justify-between gap-3">
              <span className="truncate text-[var(--brand-ink)]" dir="auto">
                {label}
              </span>
              <span className="tabular-nums font-semibold text-[var(--brand-purple-deep)]">{value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
