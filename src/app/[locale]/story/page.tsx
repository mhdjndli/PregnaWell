import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { marked } from "marked";
import { site } from "@/lib/site";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const dict = getDict(locale);
  return { title: dict.nav.story, description: dict.story.intro };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDict(locale);
  const bodyHtml = marked.parse(dict.story.body, { async: false }) as string;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -end-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-rose-soft)]/35 blur-3xl" />
          <div className="absolute -bottom-32 -start-24 h-[360px] w-[360px] rounded-full bg-[var(--brand-purple-soft)]/25 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-6 lg:px-10 pt-16 pb-12 lg:pt-24 lg:pb-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-rose)] font-semibold">
            {dict.story.eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl text-[var(--brand-purple-deep)]">
            {dict.story.title}
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-[var(--brand-muted)] leading-relaxed">
            {dict.story.intro}
          </p>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="relative rounded-[2rem] overflow-hidden ring-1 ring-[var(--brand-purple)]/10 shadow-[0_30px_80px_-30px_rgba(61,42,110,0.4)]">
            <Image
              src="/assets/maha-2.jpg"
              alt="Maha Hommos"
              width={1600}
              height={900}
              className="h-[420px] w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <article className="pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <div className="prose-pregna" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>
      </article>

      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 grid gap-4 sm:grid-cols-2">
          <Link
            href={site.ctas.masterclass}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-3xl bg-[var(--brand-purple-deep)] text-white p-8 hover:-translate-y-1 transition shadow-[0_20px_50px_-25px_rgba(61,42,110,0.5)]"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose-soft)] font-semibold">
              {dict.story.ctas.startHere.eyebrow}
            </p>
            <h3 className="mt-2 font-display text-2xl">{dict.story.ctas.startHere.title}</h3>
            <p className="mt-2 text-white/80 text-sm">{dict.story.ctas.startHere.body}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
              {dict.cta.watchNow} <span aria-hidden className="arrow-end">→</span>
            </span>
          </Link>
          <Link
            href={site.ctas.fertilityScore}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-3xl bg-[var(--brand-blush)] text-[var(--brand-purple-deep)] p-8 hover:-translate-y-1 transition ring-1 ring-[var(--brand-rose-soft)]/40"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
              {dict.story.ctas.orAssess.eyebrow}
            </p>
            <h3 className="mt-2 font-display text-2xl">{dict.story.ctas.orAssess.title}</h3>
            <p className="mt-2 text-[var(--brand-purple)]/80 text-sm">{dict.story.ctas.orAssess.body}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
              {dict.cta.fertilityScore} <span aria-hidden className="arrow-end">→</span>
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
