"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { BlogSummary } from "@/lib/blog";
import { formatDate } from "@/lib/format";
import {
  categories,
  categoryLabel,
  getDict,
  type CategoryId,
  type Locale,
} from "@/lib/i18n";

type Filter = CategoryId | "all";

export default function BlogGrid({
  posts,
  locale,
}: {
  posts: BlogSummary[];
  locale: Locale;
}) {
  const dict = getDict(locale);
  const [filter, setFilter] = useState<Filter>("all");

  const chips: Array<{ id: Filter; label: string }> = useMemo(
    () => [
      { id: "all", label: dict.blog.filters.all },
      ...categories.map((c) => ({
        id: c.id as Filter,
        label: locale === "ar" ? c.ar : c.en,
      })),
    ],
    [dict.blog.filters.all, locale],
  );

  const filtered = useMemo(
    () =>
      filter === "all"
        ? posts
        : posts.filter((p) => p.category === filter),
    [filter, posts],
  );

  return (
    <>
      <div className="mb-10 -mx-6 lg:-mx-10 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-6 lg:px-10 w-max">
          {chips.map((chip) => {
            const active = chip.id === filter;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--brand-purple)] text-white shadow-[0_10px_25px_-15px_rgba(61,42,110,0.6)]"
                    : "bg-white text-[var(--brand-purple)] ring-1 ring-[var(--brand-purple)]/15 hover:bg-[var(--brand-blush)]"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-[var(--brand-purple)]/10">
          <p className="font-display text-2xl text-[var(--brand-purple-deep)]">
            {dict.blog.empty.title}
          </p>
          <p className="mt-3 text-[var(--brand-muted)]">{dict.blog.empty.body}</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, idx) => {
            const featured = idx === 0 && !!post.cover;
            return (
              <Link
                key={post.slug}
                href={`/${locale}/blog/${post.slug}`}
                className={`group rounded-3xl bg-white overflow-hidden ring-1 ring-[var(--brand-purple)]/10 hover:-translate-y-1 transition shadow-[0_15px_40px_-25px_rgba(61,42,110,0.35)] flex flex-col ${
                  featured ? "md:col-span-2 lg:col-span-2" : ""
                }`}
              >
                {post.cover && (
                  <div
                    className={`relative w-full ${
                      featured ? "aspect-video md:h-96" : "aspect-video"
                    }`}
                  >
                    <Image
                      src={post.cover}
                      alt={post.title}
                      fill
                      className="object-cover transition group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized={!post.cover.startsWith("/")}
                    />
                  </div>
                )}
                <div className="p-7 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 text-xs text-[var(--brand-muted)] flex-wrap">
                    {post.category && categoryLabel(post.category, locale) && (
                      <span className="rounded-full bg-[var(--brand-blush)] px-3 py-1 font-semibold text-[var(--brand-rose)]">
                        {categoryLabel(post.category, locale)}
                      </span>
                    )}
                    <span>{formatDate(post.publishAt, locale)}</span>
                    <span>· {post.readingMinutes} {dict.blog.minRead}</span>
                    {post.author && (
                      <span className="font-medium text-[var(--brand-purple)]">
                        · {dict.blog.by} {post.author}
                      </span>
                    )}
                  </div>
                  <h2
                    dir="rtl"
                    lang="ar"
                    className={`mt-3 font-display text-[var(--brand-purple-deep)] ${
                      featured ? "text-2xl md:text-3xl" : "text-xl"
                    }`}
                  >
                    {post.title}
                  </h2>
                  <p
                    dir="rtl"
                    lang="ar"
                    className="mt-3 text-sm text-[var(--brand-muted)] leading-relaxed flex-1"
                  >
                    {post.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-purple)] group-hover:text-[var(--brand-rose)]">
                    {dict.cta.readArticle}{" "}
                    <span
                      aria-hidden
                      className="arrow-end transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
