import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDict, isLocale, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import {
  featuredStory,
  socialStats,
  videoTestimonials,
} from "@/lib/testimonials";
import StoriesGrid from "./StoriesGrid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const dict = getDict(locale);
  return { title: dict.nav.testimonials };
}

export default async function TestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDict(locale);

  return (
    <div>
      {/* HERO — tight intro + featured Sarah story in one visual block */}
      <section dir="rtl" lang="ar" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -start-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-rose-soft)]/25 blur-3xl" />
          <div className="absolute -bottom-24 -end-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-blush)]/60 blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-6 lg:px-10 pt-8 md:pt-12 pb-6 md:pb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-rose)] font-semibold">
            {dict.nav.testimonials}
          </p>
          <h1 className="mt-3 font-display text-[26px] leading-[1.25] sm:text-3xl md:text-4xl text-[var(--brand-purple-deep)]">
            قصص نجاح حقيقية من نساء بدأن مثلكِ تمامًا
          </h1>
          <p className="mt-4 text-base md:text-lg leading-relaxed text-[var(--brand-muted)] max-w-2xl mx-auto">
            هذه قصصهنّ من القلق إلى الأمل — شاهدي كيف يمكن لرحلة واحدة أن تغيّر الحياة.
          </p>
        </div>

        {/* Featured Sarah story — sits directly under the intro, no wasted gap */}
        <div className="mx-auto max-w-5xl px-6 lg:px-10 pb-2">
          <div className="rounded-[2rem] bg-white overflow-hidden ring-1 ring-[var(--brand-purple)]/10 shadow-[0_30px_80px_-30px_rgba(61,42,110,0.35)] grid md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
            <div className="relative w-full aspect-[4/5] md:aspect-auto md:min-h-[320px] bg-[var(--brand-cream)]">
              <Image
                src={featuredStory.image}
                alt={featuredStory.headline}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 280px"
                className="object-contain md:object-cover"
              />
              <span className="absolute top-3 end-3 rounded-full bg-white/95 backdrop-blur px-3 py-1 text-[11px] font-semibold text-[var(--brand-rose)] shadow-sm">
                القصة الأولى
              </span>
            </div>
            <div className="p-5 md:p-8 flex flex-col justify-center">
              <h2 className="font-display text-xl md:text-2xl text-[var(--brand-purple-deep)] leading-snug">
                {featuredStory.headline}
              </h2>
              <p className="mt-3 text-base md:text-lg leading-relaxed text-[var(--brand-purple)] font-semibold">
                {featuredStory.intro}
              </p>
              <p className="mt-2 text-sm md:text-base leading-relaxed text-[var(--brand-muted)]">
                {featuredStory.body}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      <section dir="rtl" lang="ar" className="mx-auto max-w-7xl px-6 lg:px-10 mt-8 md:mt-12">
        <div className="text-center">
          <h2 className="font-display text-3xl md:text-5xl text-[var(--brand-purple-deep)]">
            اسمعيها منهنّ مباشرة
          </h2>
          <p className="mt-5 text-base text-[var(--brand-muted)] leading-relaxed max-w-2xl mx-auto">
            حفاظًا على خصوصية المشتركات، تم تغيير الأصوات وإخفاء أسماء العائلة في جميع المقاطع. القصص كما روتها كل واحدة منهنّ.
          </p>
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          {videoTestimonials.map((v) => (
            <article
              key={v.slug}
              className="flex flex-col rounded-[2rem] bg-white overflow-hidden ring-1 ring-[var(--brand-purple)]/10 shadow-[0_20px_60px_-30px_rgba(61,42,110,0.35)]"
            >
              <div className="relative w-full aspect-video bg-[var(--brand-purple-deep)]">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
                  title={v.headline.ar}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              <div className="p-7 lg:p-8 flex-1 flex flex-col">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-2xl text-[var(--brand-purple-deep)]">
                    {v.headline.ar}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-blush)] px-3 py-1 text-xs font-semibold text-[var(--brand-rose)]">
                    <span aria-hidden className="text-sm leading-none">{v.flag}</span>
                    {v.country.ar}
                  </span>
                </div>
                <p className="mt-4 text-lg leading-relaxed text-[var(--brand-purple)] font-semibold">
                  {v.quote.ar}
                </p>
                <p className="mt-3 text-base leading-relaxed text-[var(--brand-muted)]">
                  {v.body.ar}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* GRID + FILTERS */}
      <section dir="rtl" lang="ar" className="mx-auto max-w-7xl px-6 lg:px-10 mt-14 md:mt-16">
        <div className="text-center">
          <h2 className="font-display text-3xl md:text-5xl text-[var(--brand-purple-deep)]">
            اقرأيها منهنّ مباشرة
          </h2>
        </div>
        <StoriesGrid />
      </section>

      {/* CLOSING CTA */}
      <section dir="rtl" lang="ar" className="mx-auto max-w-4xl px-6 lg:px-10 mt-14 md:mt-20">
        <div className="rounded-[2rem] bg-[var(--brand-purple-deep)] text-white p-10 lg:p-14 text-center">
          <div className="space-y-3 text-lg leading-relaxed text-white/90">
            <p>كل امرأة في هذه الصفحة كانت مترددة يومًا ما…</p>
            <p>لكنها اختارت أن تؤمن بنفسها.</p>
            <p>واليوم قصتها هنا، تذكّرنا أن الأمل لا يحتاج إلا لخطوة.</p>
          </div>
          <p className="mt-8 font-display text-2xl md:text-3xl text-white">
            ✨ ابدئي رحلتكِ مع ديتوكس الخصوبة الآن
          </p>
          <p className="mt-3 text-white/85 text-base">
            لأن الأمومة لا تبدأ من الحمل، بل من العافية. 🌷
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href={site.ctas.masterclass}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-base font-semibold text-[var(--brand-purple-deep)] hover:bg-[var(--brand-blush)] transition"
            >
              ابدئي رحلتكِ
            </Link>
            <Link
              href={site.ctas.masterclass}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/80 hover:text-white underline underline-offset-4"
            >
              أو احجزي استشارة تعريفية مجانية
            </Link>
          </div>
        </div>
      </section>

      {/* SOCIAL STATS */}
      <section className="mx-auto max-w-6xl px-6 lg:px-10 mt-20 mb-4">
        <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
          {socialStats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white ring-1 ring-[var(--brand-purple)]/10 p-6 text-center"
            >
              <p className="font-display text-3xl md:text-4xl text-[var(--brand-purple-deep)]">
                {s.value}
              </p>
              <p
                dir="rtl"
                lang="ar"
                className="mt-1 text-xs text-[var(--brand-muted)]"
              >
                {s.suffix}
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--brand-purple)]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
