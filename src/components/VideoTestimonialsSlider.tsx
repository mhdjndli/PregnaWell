"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { videoTestimonials, type VideoTestimonial } from "@/lib/testimonials";
import type { Locale } from "@/lib/i18n";

const REAL = videoTestimonials;
// Cloned boundary slides: [last-clone, ...real, first-clone] so we can
// silently jump back to the equivalent real slide after a transition,
// giving the illusion of an infinite loop.
const SLIDES: VideoTestimonial[] = [REAL[REAL.length - 1], ...REAL, REAL[0]];
const REAL_COUNT = REAL.length;
const FIRST_REAL = 1; // index of first real slide inside SLIDES
const LAST_REAL = REAL_COUNT; // index of last real slide inside SLIDES

type Copy = {
  heading: string;
  privacy: string;
  readMore: string;
  prev: string;
  next: string;
  goTo: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    heading: "Hear It Straight From Them",
    privacy:
      "To protect our members' privacy, voices have been altered and last names withheld in every video. These are the stories as each woman told them.",
    readMore: "Read more stories",
    prev: "Previous story",
    next: "Next story",
    goTo: "Go to story",
  },
  ar: {
    heading: "اسمعيها منهنّ مباشرة",
    privacy:
      "حفاظًا على خصوصية المشتركات، تم تغيير الأصوات وإخفاء أسماء العائلة في جميع المقاطع. القصص كما روتها كل واحدة منهنّ.",
    readMore: "اقرأي المزيد من القصص",
    prev: "القصة السابقة",
    next: "القصة التالية",
    goTo: "اذهبي إلى القصة",
  },
};

export default function VideoTestimonialsSlider({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const isRTL = locale === "ar";

  const [index, setIndex] = useState(FIRST_REAL);
  const [animate, setAnimate] = useState(true);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const realIndex = ((index - FIRST_REAL) % REAL_COUNT + REAL_COUNT) % REAL_COUNT;

  const goNext = useCallback(() => {
    setAnimate(true);
    setIndex((i) => i + 1);
  }, []);

  const goPrev = useCallback(() => {
    setAnimate(true);
    setIndex((i) => i - 1);
  }, []);

  const goTo = useCallback((realIdx: number) => {
    setAnimate(true);
    setIndex(FIRST_REAL + realIdx);
  }, []);

  // After the slide transition finishes, if we landed on a clone,
  // silently jump to the equivalent real slide.
  const onTransitionEnd = useCallback(() => {
    if (index === LAST_REAL + 1) {
      setAnimate(false);
      setIndex(FIRST_REAL);
    } else if (index === FIRST_REAL - 1) {
      setAnimate(false);
      setIndex(LAST_REAL);
    }
  }, [index]);

  // Re-enable animation on the next frame after a silent jump.
  useEffect(() => {
    if (!animate) {
      const id = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(id);
    }
  }, [animate]);

  // Keyboard: arrow keys navigate when focus is inside the slider.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!el.contains(document.activeElement)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        isRTL ? goPrev() : goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        isRTL ? goNext() : goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, isRTL]);

  // translateX percentage. In LTR the track moves left as index grows
  // (negative sign); in RTL the coordinate system for the RTL flex track
  // is mirrored, so the track moves right as index grows (positive sign).
  const sign = isRTL ? 1 : -1;
  const trackStyle = {
    transform: `translateX(${sign * index * 100}%)`,
    transition: animate ? "transform 500ms ease" : "none",
  } as const;

  return (
    <section className="py-16 lg:py-24" aria-roledescription="carousel">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-5xl text-[var(--brand-purple-deep)]">
            {copy.heading}
          </h2>
          <p className="mt-5 text-base text-[var(--brand-muted)] leading-relaxed">
            {copy.privacy}
          </p>
        </div>

        {/* Slider frame — clips horizontally, leaves vertical shadow room */}
        <div
          ref={wrapperRef}
          tabIndex={0}
          aria-label={copy.heading}
          className="relative mt-10 md:mt-12 focus:outline-none"
        >
          <div
            className="overflow-hidden"
            style={{
              // Room for the drop-shadow on top/bottom without clipping.
              paddingBlock: "1.5rem",
              marginBlock: "-1.5rem",
            }}
          >
            <div
              dir={isRTL ? "rtl" : "ltr"}
              style={trackStyle}
              onTransitionEnd={onTransitionEnd}
              className="flex"
            >
              {SLIDES.map((v, i) => {
                const isCurrent = i === index;
                const shouldPlay = isCurrent && activeSlug === v.slug;
                return (
                  <div
                    key={`${v.slug}-${i}`}
                    className="shrink-0 basis-full px-3 md:px-4"
                    aria-hidden={!isCurrent}
                  >
                    <article className="rounded-[2rem] bg-white overflow-hidden ring-1 ring-[var(--brand-purple)]/10 shadow-[0_20px_60px_-30px_rgba(61,42,110,0.35)]">
                      <div className="grid md:grid-cols-2 md:items-center">
                        {/* Text side */}
                        <div
                          dir={isRTL ? "rtl" : "ltr"}
                          className="order-2 md:order-1 p-6 lg:p-8 flex flex-col justify-center"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-display text-xl md:text-2xl text-[var(--brand-purple-deep)]">
                              {v.headline[locale]}
                            </h3>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-blush)] px-3 py-1 text-xs font-semibold text-[var(--brand-rose)]">
                              <span aria-hidden className="text-sm leading-none">
                                {v.flag}
                              </span>
                              {v.country[locale]}
                            </span>
                          </div>
                          <p className="mt-3 text-base leading-relaxed text-[var(--brand-purple)] font-semibold">
                            {v.quote[locale]}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--brand-muted)]">
                            {v.body[locale]}
                          </p>
                        </div>

                        {/* Video side — vertically centered inside its cell */}
                        <div className="order-1 md:order-2 self-center w-full">
                          <div className="relative w-full aspect-video bg-[var(--brand-purple-deep)]">
                            {shouldPlay ? (
                              <iframe
                                src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
                                title={v.headline[locale]}
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="absolute inset-0 h-full w-full"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveSlug(v.slug)}
                                aria-label={`${copy.next.startsWith("Next") ? "Play" : "شغّلي"} — ${v.headline[locale]}`}
                                className="group absolute inset-0 h-full w-full overflow-hidden"
                                tabIndex={isCurrent ? 0 : -1}
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
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prev button — visually on the start side */}
          <button
            type="button"
            onClick={isRTL ? goNext : goPrev}
            aria-label={copy.prev}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 start-0 -translate-x-1/2 h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-purple-deep)] ring-1 ring-[var(--brand-purple)]/15 shadow-[0_10px_30px_-15px_rgba(61,42,110,0.5)] hover:bg-[var(--brand-blush)] transition rtl:translate-x-1/2"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>

          {/* Next button — visually on the end side */}
          <button
            type="button"
            onClick={isRTL ? goPrev : goNext}
            aria-label={copy.next}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 end-0 translate-x-1/2 h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-purple-deep)] ring-1 ring-[var(--brand-purple)]/15 shadow-[0_10px_30px_-15px_rgba(61,42,110,0.5)] hover:bg-[var(--brand-blush)] transition rtl:-translate-x-1/2"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        {/* Mobile prev/next + dots */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={isRTL ? goNext : goPrev}
            aria-label={copy.prev}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--brand-purple-deep)] ring-1 ring-[var(--brand-purple)]/15"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {REAL.map((v, i) => {
              const active = i === realIndex;
              return (
                <button
                  key={v.slug}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${copy.goTo} ${i + 1}`}
                  aria-current={active}
                  className={`h-2.5 rounded-full transition-all ${
                    active
                      ? "w-6 bg-[var(--brand-purple)]"
                      : "w-2.5 bg-[var(--brand-purple)]/25 hover:bg-[var(--brand-purple)]/50"
                  }`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={isRTL ? goPrev : goNext}
            aria-label={copy.next}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--brand-purple-deep)] ring-1 ring-[var(--brand-purple)]/15"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/testimonials`}
            className="inline-flex items-center gap-2 text-base font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            {copy.readMore}{" "}
            <span aria-hidden className="arrow-end">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
