import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

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
  const comingSoon =
    locale === "ar"
      ? "قريباً — قصص حقيقية من أمهات ساعدناهن في رحلتهن."
      : "Coming soon — real stories from mothers we've walked with.";
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -end-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-rose-soft)]/25 blur-3xl" />
      </div>
      <div className="mx-auto max-w-3xl px-6 lg:px-10 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-rose)] font-semibold">
          {dict.nav.testimonials}
        </p>
        <h1 className="mt-4 font-display text-4xl md:text-5xl text-[var(--brand-purple-deep)]">
          {dict.nav.testimonials}
        </h1>
        <p className="mt-6 text-lg text-[var(--brand-muted)]">{comingSoon}</p>
      </div>
    </section>
  );
}
