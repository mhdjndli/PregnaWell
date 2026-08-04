import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPosts } from "@/lib/blog";
import { getDict, isLocale, type Locale } from "@/lib/i18n";
import BlogGrid from "./BlogGrid";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const dict = getDict(locale);
  return { title: dict.nav.blog, description: dict.blog.subtitle };
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDict(locale);
  const posts = await getPublicPosts(locale);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -end-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-rose-soft)]/30 blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-6 lg:px-10 pt-16 pb-10 lg:pt-24 lg:pb-14">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-rose)] font-semibold">
            {dict.blog.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-6xl text-[var(--brand-purple-deep)] max-w-3xl">
            {dict.blog.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--brand-muted)]">{dict.blog.subtitle}</p>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <BlogGrid posts={posts} locale={locale} />
        </div>
      </section>
    </>
  );
}
