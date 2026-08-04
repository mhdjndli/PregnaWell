"use client";

import Link from "next/link";
import { useState } from "react";
import { videoTestimonials } from "@/lib/testimonials";
import type { Locale } from "@/lib/i18n";

export default function VideoTestimonialsSlider({ locale }: { locale: Locale }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const readMoreLabel =
    locale === "ar" ? "اقرأي المزيد من القصص" : "Read more stories";

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Section heading + privacy note (Arabic content, RTL) */}
        <div dir="rtl" lang="ar" className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-5xl text-[var(--brand-purple-deep)]">
            اسمعيها منهنّ مباشرة
          </h2>
          <p className="mt-5 text-base text-[var(--brand-muted)] leading-relaxed">
            حفاظًا على خصوصية المشتركات، تم تغيير الأصوات وإخفاء أسماء العائلة في جميع المقاطع. القصص كما روتها كل واحدة منهنّ.
          </p>
        </div>

        {/* Horizontal snap-scroll slider */}
        <div className="mt-10 md:mt-12 -mx-6 lg:-mx-10 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <div dir="rtl" className="flex gap-6 px-6 lg:px-10 pb-4">
            {videoTestimonials.map((v) => {
              const isActive = activeSlug === v.slug;
              return (
                <article
                  key={v.slug}
                  lang="ar"
                  className="snap-start shrink-0 w-[88%] sm:w-[80%] md:w-[75%] lg:w-[68%] rounded-[2rem] bg-white overflow-hidden ring-1 ring-[var(--brand-purple)]/10 shadow-[0_20px_60px_-30px_rgba(61,42,110,0.35)]"
                >
                  <div className="grid md:grid-cols-2">
                    {/* Text side — desktop right (order-1 in RTL grid), mobile below video (order-2) */}
                    <div className="order-2 md:order-1 p-6 lg:p-8 flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-xl md:text-2xl text-[var(--brand-purple-deep)]">
                          {v.headline}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-blush)] px-3 py-1 text-xs font-semibold text-[var(--brand-rose)]">
                          <span aria-hidden className="text-sm leading-none">
                            {v.flag}
                          </span>
                          {v.country}
                        </span>
                      </div>
                      <p className="mt-3 text-base leading-relaxed text-[var(--brand-purple)] font-semibold">
                        {v.quote}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--brand-muted)]">
                        {v.body}
                      </p>
                    </div>

                    {/* Video side — desktop left (order-2 in RTL grid), mobile top (order-1) */}
                    <div className="order-1 md:order-2 relative w-full aspect-video bg-[var(--brand-purple-deep)]">
                      {isActive ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
                          title={v.headline}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveSlug(v.slug)}
                          aria-label={`Play ${v.headline}`}
                          className="group absolute inset-0 h-full w-full overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                            alt=""
                            aria-hidden
                            className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.03]"
                          />
                          <span className="absolute inset-0 bg-[var(--brand-purple-deep)]/25 transition group-hover:bg-[var(--brand-purple-deep)]/15" />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-white/95 text-[var(--brand-purple-deep)] shadow-[0_15px_35px_-10px_rgba(61,42,110,0.6)] transition group-hover:scale-110">
                              <svg
                                aria-hidden
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-7 w-7 md:h-9 md:w-9 ms-1"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* CTA below the slider — inherits site locale direction */}
        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/testimonials`}
            className="inline-flex items-center gap-2 text-base font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            {readMoreLabel}{" "}
            <span aria-hidden className="arrow-end">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
