import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { getDict, isLocale, type Locale } from "@/lib/i18n";
import PressMarquee from "@/components/PressMarquee";
import Programs from "@/components/Programs";
import Testimonials from "@/components/Testimonials";
import Faq from "@/components/Faq";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDict(locale);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -end-24 h-[480px] w-[480px] rounded-full bg-[var(--brand-rose-soft)]/40 blur-3xl" />
          <div className="absolute -bottom-32 -start-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-purple-soft)]/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-16 pb-20 lg:pt-24 lg:pb-28 grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-rose)] ring-1 ring-[var(--brand-rose-soft)]/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-rose)]" />
              {dict.hero.eyebrow}
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-[var(--brand-purple-deep)]">
              {dict.hero.titleLead}
              <em className="not-italic text-[var(--brand-rose)]">{dict.hero.titleAccent}</em>
              {dict.hero.titleTrail}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[var(--brand-muted)] leading-relaxed">
              {dict.hero.subtitle}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={site.ctas.masterclass}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                {dict.cta.masterclass}
                <span aria-hidden>→</span>
              </Link>
              <Link
                href={site.ctas.fertilityScore}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                {dict.cta.fertilityScore}
              </Link>
            </div>

            <p className="mt-5 text-sm text-[var(--brand-muted)]">{dict.hero.free}</p>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-xl">
              <Stat value="10M+" label={dict.stats.videoViews} />
              <Stat value="50K+" label={dict.stats.mothersSupported} />
              <Stat value="300K+" label={dict.stats.instagramFollowers} />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[var(--brand-rose-soft)]/60 via-white to-[var(--brand-purple-soft)]/40 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-[var(--brand-purple)]/10 shadow-[0_30px_80px_-30px_rgba(61,42,110,0.45)]">
                <Image
                  src="/assets/maha-1.jpg"
                  alt="Maha Hommos"
                  width={900}
                  height={1100}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -start-6 rounded-2xl bg-white/95 backdrop-blur p-4 shadow-xl ring-1 ring-[var(--brand-purple)]/10 max-w-[220px]">
                <p className="font-display text-base text-[var(--brand-purple-deep)]">{dict.hero.quote}</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">{dict.hero.quoteAttribution}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PressMarquee locale={locale} />

      {/* Why PregnaWell */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
            {dict.why.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl text-[var(--brand-purple-deep)]">
            {dict.why.title}
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-[var(--brand-muted)] leading-relaxed">
            {dict.why.subtitle}
          </p>
        </div>
      </section>

      <Programs locale={locale} />

      <Testimonials locale={locale} />

      <Faq locale={locale} />

      {/* Founder strip */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="overflow-hidden rounded-[2rem] bg-[var(--brand-purple-deep)] text-white shadow-[0_30px_60px_-30px_rgba(61,42,110,0.55)] grid lg:grid-cols-12 items-stretch">
            <div className="relative lg:col-span-5 min-h-[320px]">
              <Image
                src="/assets/maha-2.jpg"
                alt="Maha Hommos"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
            <div className="lg:col-span-7 p-8 lg:p-14">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose-soft)] font-semibold">
                {dict.founder.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-3xl md:text-4xl">{dict.founder.title}</h2>
              <p className="mt-4 text-white/85 leading-relaxed">{dict.founder.body}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/story`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--brand-purple-deep)] hover:bg-[var(--brand-blush)] transition"
                >
                  {dict.cta.readMyStory}
                </Link>
                <Link
                  href={site.ctas.masterclass}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10"
                >
                  {dict.founder.masterclass}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl text-[var(--brand-purple-deep)]">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-[var(--brand-muted)]">{label}</p>
    </div>
  );
}
