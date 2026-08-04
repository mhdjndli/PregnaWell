import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDate, getPublicSlugs, getPublicPost } from "@/lib/blog";
import { categoryLabel, getDict, isLocale, locales, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";

type Params = { locale: string; slug: string };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const all: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    const slugs = await getPublicSlugs(locale);
    for (const slug of slugs) all.push({ locale, slug });
  }
  return all;
}

async function loadPost(rawLocale: string, slug: string) {
  const locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  try {
    return { locale, post: await getPublicPost(slug, locale) };
  } catch (err) {
    console.error(`[blog/${rawLocale}/${slug}] getPublicPost threw:`, err);
    return { locale, post: null };
  }
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const { post } = await loadPost(rawLocale, slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.description,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.description,
      images: post.cover ? [post.cover] : undefined,
      type: "article",
      publishedTime: post.publishAt ?? undefined,
    },
  };
}

export default async function BlogPostPage(
  { params }: { params: Promise<Params> }
) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const { locale, post } = await loadPost(rawLocale, slug);
  if (!post) notFound();
  const dict = getDict(locale);

  return (
    <article className="pb-24">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -end-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-rose-soft)]/25 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-6 lg:px-10 pt-12 lg:pt-20">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            <span aria-hidden className="arrow-end">←</span> {dict.blog.backAll}
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-[var(--brand-muted)]">
            {post.category && categoryLabel(post.category, locale) && (
              <span className="rounded-full bg-[var(--brand-blush)] px-3 py-1 font-semibold text-[var(--brand-rose)]">
                {categoryLabel(post.category, locale)}
              </span>
            )}
            <span>{formatDate(post.publishAt, locale)}</span>
            <span>· {post.readingMinutes} {dict.blog.minRead}</span>
            {post.author && <span>· {dict.blog.by} {post.author}</span>}
          </div>
          <div dir="rtl" lang="ar">
            <h1 className="mt-4 font-display text-4xl md:text-5xl text-[var(--brand-purple-deep)] leading-[1.1]">
              {post.title}
            </h1>
            <p className="mt-5 text-lg text-[var(--brand-muted)] leading-relaxed">
              {post.description}
            </p>
          </div>
        </div>
      </header>

      {post.cover && (
        <div className="mx-auto max-w-5xl px-6 lg:px-10 mt-12">
          <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-[var(--brand-purple)]/10 shadow-[0_30px_80px_-30px_rgba(61,42,110,0.4)]">
            <Image
              src={post.cover}
              alt={post.title}
              width={1600}
              height={900}
              className="block w-full h-auto aspect-video object-cover"
              priority
              unoptimized={!post.cover.startsWith("/")}
            />
            {post.author && (
              <div className="absolute inset-x-0 bottom-0 p-4 lg:p-6 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-4 py-1.5 text-xs md:text-sm font-semibold text-[var(--brand-purple-deep)] ring-1 ring-black/5 shadow-sm">
                  {dict.blog.by} {post.author}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-6 lg:px-10 mt-12" dir="rtl" lang="ar">
        <div className="prose-pregna" dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="mx-auto max-w-3xl px-6 lg:px-10 mt-10 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white ring-1 ring-[var(--brand-purple)]/10 px-3 py-1 text-xs text-[var(--brand-muted)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {(() => {
        const preFertility = post.category === "before";
        const cta = preFertility
          ? {
              href: site.ctas.fertilityScore,
              label: dict.cta.fertilityScore,
              eyebrow: dict.blog.assess.eyebrow,
              title: dict.blog.assess.title,
              body: dict.blog.assess.body,
            }
          : {
              href: site.ctas.masterclass,
              label: dict.cta.watchNow,
              eyebrow: dict.blog.keepGoing.eyebrow,
              title: dict.blog.keepGoing.title,
              body: dict.blog.keepGoing.body,
            };
        return (
          <div className="mx-auto max-w-3xl px-6 lg:px-10 mt-16">
            <div className="rounded-3xl bg-[var(--brand-purple-deep)] text-white p-8 lg:p-10">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose-soft)] font-semibold">
                {cta.eyebrow}
              </p>
              <h3 className="mt-2 font-display text-2xl">{cta.title}</h3>
              <p className="mt-3 text-white/85">{cta.body}</p>
              <Link
                href={cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--brand-purple-deep)] hover:bg-[var(--brand-blush)] transition"
              >
                {cta.label} <span aria-hidden className="arrow-up-end">↗</span>
              </Link>
            </div>
          </div>
        );
      })()}
    </article>
  );
}
