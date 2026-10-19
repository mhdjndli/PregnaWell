"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  numeric?: boolean;
  // Enables sorting on the column; also the CSV value unless `csv` is given.
  sortValue?: (row: T) => number | string;
  csv?: (row: T) => number | string;
  render: (row: T) => ReactNode;
  // The `grow` column takes the leftover width and truncates; the others
  // size to their content.
  grow?: boolean;
};

const PAGE_SIZE = 50;

// Sortable, searchable table with CSV export and optional row drill-down.
// Rendering is paged client-side so thousands of rows stay responsive.
export default function DataTable<T>({
  title,
  subtitle,
  rows,
  columns,
  rowKey,
  initialSort,
  searchText,
  csvName,
  expand,
  emptyText = "No data for this period yet.",
}: {
  title?: string;
  subtitle?: ReactNode;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  searchText?: (row: T) => string;
  csvName?: string;
  expand?: (row: T) => ReactNode;
  emptyText?: string;
}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let out = term && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(term)) : rows;
    const col = sort ? columns.find((c) => c.key === sort.key) : undefined;
    if (sort && col?.sortValue) {
      const get = col.sortValue;
      const sign = sort.dir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => {
        const va = get(a);
        const vb = get(b);
        return (typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb))) * sign;
      });
    }
    return out;
  }, [rows, columns, sort, search, searchText]);

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return;
    setSort((s) =>
      s?.key === col.key
        ? { key: col.key, dir: s.dir === "desc" ? "asc" : "desc" }
        : { key: col.key, dir: col.numeric ? "desc" : "asc" }
    );
  }

  function toggleRow(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function exportCsv() {
    const cell = (v: number | string) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const exportable = columns.filter((c) => c.csv || c.sortValue);
    const lines = [
      exportable.map((c) => cell(c.header)).join(","),
      ...filtered.map((r) => exportable.map((c) => cell((c.csv ?? c.sortValue)!(r))).join(",")),
    ];
    // BOM so Excel opens Arabic text as UTF-8.
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${csvName ?? "search-console"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const visible = filtered.slice(0, limit);
  const colSpan = columns.length + (expand ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--brand-purple)]/10">
      {(title || searchText || csvName) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {title && (
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">
                {title}
                <span className="ml-2 font-normal normal-case tracking-normal">
                  {filtered.length.toLocaleString("en-US")}
                  {filtered.length !== rows.length && ` of ${rows.length.toLocaleString("en-US")}`}
                </span>
              </p>
            )}
            {subtitle && <p className="mt-1 text-xs text-[var(--brand-muted)]">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {searchText && (
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setLimit(PAGE_SIZE);
                }}
                placeholder="Search…"
                dir="auto"
                className="w-44 rounded-full border border-[var(--brand-purple)]/15 bg-white px-3 py-1.5 text-xs outline-none focus:border-[var(--brand-purple)]"
              />
            )}
            {csvName && (
              <button
                type="button"
                onClick={exportCsv}
                disabled={filtered.length === 0}
                className="rounded-full bg-[var(--brand-blush)]/70 px-3 py-1.5 text-xs font-semibold text-[var(--brand-purple)] transition hover:bg-[var(--brand-blush)] disabled:opacity-50"
              >
                CSV
              </button>
            )}
          </div>
        </div>
      )}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--brand-purple)]/10 text-left text-xs uppercase tracking-wider text-[var(--brand-muted)]">
              {expand && <th className="w-8" />}
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={`whitespace-nowrap px-3 py-2 font-semibold first:pl-5 last:pr-5 ${
                      c.numeric ? "text-right" : ""
                    }`}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c)}
                        className={`uppercase tracking-wider transition hover:text-[var(--brand-purple)] ${
                          active ? "text-[var(--brand-purple)]" : ""
                        }`}
                      >
                        {c.header}
                        {active && (sort.dir === "desc" ? " ↓" : " ↑")}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-5 py-8 text-center text-sm text-[var(--brand-muted)]">
                  {search ? "Nothing matches your search." : emptyText}
                </td>
              </tr>
            )}
            {visible.map((r) => {
              const key = rowKey(r);
              const isOpen = open.has(key);
              return (
                <Fragment key={key}>
                  <tr
                    className={`border-b border-[var(--brand-purple)]/5 ${
                      expand ? "cursor-pointer hover:bg-[var(--brand-blush)]/30" : ""
                    } ${isOpen ? "bg-[var(--brand-blush)]/30" : ""}`}
                    onClick={expand ? () => toggleRow(key) : undefined}
                  >
                    {expand && (
                      <td className="pl-4 text-xs text-[var(--brand-muted)]" aria-hidden>
                        {isOpen ? "▾" : "▸"}
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-3 py-2.5 align-top first:pl-5 last:pr-5 ${
                          c.numeric ? "text-right tabular-nums whitespace-nowrap" : ""
                        } ${c.grow ? "w-full min-w-40 max-w-0 truncate" : ""}`}
                      >
                        {c.render(r)}
                      </td>
                    ))}
                  </tr>
                  {expand && isOpen && (
                    <tr className="border-b border-[var(--brand-purple)]/10 bg-[var(--brand-cream)]">
                      <td colSpan={colSpan} className="px-5 py-3">
                        {expand(r)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length > limit && (
        <div className="flex items-center justify-center gap-3 border-t border-[var(--brand-purple)]/5 py-3 text-xs">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            Show {Math.min(PAGE_SIZE, filtered.length - limit)} more
          </button>
          <span className="text-[var(--brand-muted)]">·</span>
          <button
            type="button"
            onClick={() => setLimit(filtered.length)}
            className="font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            Show all {filtered.length.toLocaleString("en-US")}
          </button>
        </div>
      )}
    </div>
  );
}
