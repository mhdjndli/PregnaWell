import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDate, getPublicPosts } from "@/lib/blog";
import { categoryLabel, getDict, isLocale, type Locale } from "@/lib/i18n";

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
          {posts.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-[var(--brand-purple)]/10">
              <p className="font-display text-2xl text-[var(--brand-purple-deep)]">
                {dict.blog.empty.title}
              </p>
              <p className="mt-3 text-[var(--brand-muted)]">{dict.blog.empty.body}</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, idx) => (
                <Link
                  key={post.slug}
                  href={`/${locale}/blog/${post.slug}`}
                  className={`group rounded-3xl bg-white overflow-hidden ring-1 ring-[var(--brand-purple)]/10 hover:-translate-y-1 transition shadow-[0_15px_40px_-25px_rgba(61,42,110,0.35)] flex flex-col ${
                    idx === 0 ? "md:col-span-2 lg:col-span-2" : ""
                  }`}
                >
                  {post.cover && (
                    <div className={`relative w-full ${idx === 0 ? "h-72 md:h-96" : "h-52"}`}>
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        className="object-cover transition group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        unoptimized={post.cover.startsWith("/api/images/")}
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
                    </div>
                    <h2
                      className={`mt-3 font-display text-[var(--brand-purple-deep)] ${
                        idx === 0 ? "text-2xl md:text-3xl" : "text-xl"
                      }`}
                    >
                      {post.title}
                    </h2>
                    <p className="mt-3 text-sm text-[var(--brand-muted)] leading-relaxed flex-1">
                      {post.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-purple)] group-hover:text-[var(--brand-rose)]">
                      {dict.cta.readArticle}{" "}
                      <span aria-hidden className="arrow-end transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
