"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  storyTestimonials,
  testimonialCategories,
  type TestimonialCategoryId,
} from "@/lib/testimonials";

type Filter = TestimonialCategoryId | "all";

export default function StoriesGrid() {
  const [filter, setFilter] = useState<Filter>("all");

  const chips: Array<{ id: Filter; label: string }> = useMemo(
    () => [
      { id: "all", label: "الكل" },
      ...testimonialCategories.map((c) => ({ id: c.id as Filter, label: c.label })),
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      filter === "all"
        ? storyTestimonials
        : storyTestimonials.filter((s) => s.categories.includes(filter)),
    [filter],
  );

  const categoryLabelById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of testimonialCategories) map[c.id] = c.label;
    return map;
  }, []);

  return (
    <div dir="rtl" lang="ar" className="mt-14">
      <div className="flex flex-wrap gap-2 justify-center">
        {chips.map((chip) => {
          const active = chip.id === filter;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
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

      <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((story) => (
          <article
            key={story.slug}
            className="flex flex-col rounded-3xl bg-white overflow-hidden ring-1 ring-[var(--brand-purple)]/10 shadow-[0_15px_40px_-25px_rgba(61,42,110,0.35)]"
          >
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex flex-wrap gap-2">
                {story.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-[var(--brand-blush)] px-3 py-1 text-xs font-semibold text-[var(--brand-rose)]"
                  >
                    {categoryLabelById[c]}
                  </span>
                ))}
              </div>
              <h3 className="mt-4 font-display text-xl text-[var(--brand-purple-deep)] leading-snug">
                {story.headline}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-[var(--brand-ink)]">
                {story.quote}
              </p>
            </div>
            {story.images.length > 0 && (
              <div
                className={`grid gap-1 bg-[var(--brand-cream)] ${
                  story.images.length > 1 ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                {story.images.map((src) => (
                  <div
                    key={src}
                    className="relative w-full aspect-[3/4] flex items-center justify-center p-2"
                  >
                    <Image
                      src={src}
                      alt={story.headline}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
