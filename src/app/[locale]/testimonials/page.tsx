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
      {/* HERO */}
      <section dir="rtl" lang="ar" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -start-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-rose-soft)]/25 blur-3xl" />
          <div className="absolute -bottom-24 -end-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-blush)]/60 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-6 lg:px-10 pt-16 pb-14 lg:pt-24 lg:pb-20 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-rose)] font-semibold">
            {dict.nav.testimonials}
          </p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl text-[var(--brand-purple-deep)] leading-[1.1]">
            قصص نجاح حقيقية من نساء بدأن مثلكِ تمامًا
          </h1>
          <div className="mt-8 space-y-3 text-lg text-[var(--brand-muted)] leading-relaxed">
            <p>كل امرأة هنا كانت مترددة في البداية. خافت أن تبدأ، وتساءلت إن كان هذا البرنامج مختلفًا حقًا.</p>
            <p>لكن بعد انضمامها إلى PregnaWell، تغيّر كل شيء.</p>
            <p>هذه قصصهنّ… من القلق إلى الأمل، ومن الحلم إلى النتيجة.</p>
            <p className="font-semibold text-[var(--brand-purple)]">
              شاهدي بنفسكِ كيف يمكن لرحلة واحدة أن تغيّر الحياة.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED SARAH STORY */}
      <section dir="rtl" lang="ar" className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="rounded-[2rem] bg-white overflow-hidden ring-1 ring-[var(--brand-purple)]/10 shadow-[0_30px_80px_-30px_rgba(61,42,110,0.35)] grid md:grid-cols-2">
          <div className="relative w-full min-h-[320px] md:min-h-[440px] bg-[var(--brand-cream)]">
            <Image
              src={featuredStory.image}
              alt={featuredStory.headline}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <span className="self-start rounded-full bg-[var(--brand-blush)] px-3 py-1 text-xs font-semibold text-[var(--brand-rose)]">
              القصة الأولى
            </span>
            <h2 className="mt-4 font-display text-3xl md:text-4xl text-[var(--brand-purple-deep)] leading-[1.15]">
              {featuredStory.headline}
            </h2>
            <p className="mt-5 text-xl leading-relaxed text-[var(--brand-purple)] font-semibold">
              {featuredStory.intro}
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--brand-muted)]">
              {featuredStory.body}
            </p>
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      <section dir="rtl" lang="ar" className="mx-auto max-w-7xl px-6 lg:px-10 mt-24">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-rose)] font-semibold">
            الفيديوهات
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl text-[var(--brand-purple-deep)]">
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
                  title={v.headline}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              <div className="p-7 lg:p-8 flex-1 flex flex-col">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-2xl text-[var(--brand-purple-deep)]">
                    {v.headline}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-blush)] px-3 py-1 text-xs font-semibold text-[var(--brand-rose)]">
                    <span aria-hidden className="text-sm leading-none">{v.flag}</span>
                    {v.country}
                  </span>
                </div>
                <p className="mt-4 text-lg leading-relaxed text-[var(--brand-purple)] font-semibold">
                  {v.quote}
                </p>
                <p className="mt-3 text-base leading-relaxed text-[var(--brand-muted)]">
                  {v.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* GRID + FILTERS */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 mt-24">
        <StoriesGrid />
      </section>

      {/* CLOSING CTA */}
      <section dir="rtl" lang="ar" className="mx-auto max-w-4xl px-6 lg:px-10 mt-24">
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
