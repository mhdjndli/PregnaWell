import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { formatDate, getPublicSlugs, getPublicPost } from "@/lib/blog";
import { categoryLabel, getDict, isLocale, locales, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { JsonLd, pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

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
  const decoded = decodeURIComponent(slug);
  const { locale, post } = await loadPost(rawLocale, decoded);
  if (!post) return { title: "Article not found", robots: { index: false } };
  return pageMetadata({
    locale,
    path: `/blog/${encodeURIComponent(decoded)}`,
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.description,
    // An article exists in one language only - no hreflang alternates.
    localized: false,
    image: post.cover,
    article: {
      publishedTime: post.publishAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author] : undefined,
    },
  });
}

export default async function BlogPostPage(
  { params }: { params: Promise<Params> }
) {
  const { locale: rawLocale, slug: rawSlug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const slug = decodeURIComponent(rawSlug);
  const { locale, post } = await loadPost(rawLocale, slug);
  if (!post) {
    // The libraries are per-language. If this slug lives in the other
    // language's library (old mixed-library URLs that Google indexed),
    // send readers and crawlers to its real home.
    for (const other of locales) {
      if (other === locale) continue;
      const elsewhere = await getPublicPost(slug, other).catch(() => null);
      if (elsewhere) {
        permanentRedirect(`/${other}/blog/${encodeURIComponent(slug)}`);
      }
    }
    notFound();
  }
  const dict = getDict(locale);
  const dir = post.language === "ar" ? "rtl" : "ltr";
  const canonicalUrl = `${SITE_URL}/${locale}/blog/${encodeURIComponent(slug)}`;
  const coverAbsolute = post.cover
    ? post.cover.startsWith("/")
      ? `${SITE_URL}${post.cover}`
      : post.cover
    : undefined;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: coverAbsolute,
    datePublished: post.publishAt ?? undefined,
    dateModified: post.updatedAt,
    inLanguage: post.language,
    mainEntityOfPage: canonicalUrl,
    author: {
      "@type": "Person",
      name: post.author ?? "Maha Hommos",
      url: `${SITE_URL}/${locale}/story`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/logo-mark.png` },
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: dict.nav.blog, item: `${SITE_URL}/${locale}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  return (
    <article className="pb-24">
      <JsonLd data={[articleLd, breadcrumbLd]} />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -end-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-rose-soft)]/25 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-6 lg:px-10 pt-12 lg:pt-16">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            <span aria-hidden className="arrow-end">←</span> {dict.blog.backAll}
          </Link>

          <div className="mt-6 overflow-hidden rounded-[2rem] bg-white ring-1 ring-[var(--brand-purple)]/10 shadow-[0_30px_80px_-30px_rgba(61,42,110,0.35)]">
            <div className="p-6 sm:p-10 lg:p-14">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--brand-muted)]">
                {post.category && categoryLabel(post.category, locale) && (
                  <span className="rounded-full bg-[var(--brand-blush)] px-3 py-1 font-semibold text-[var(--brand-rose)]">
                    {categoryLabel(post.category, locale)}
                  </span>
                )}
                <span>{formatDate(post.publishAt, locale)}</span>
                <span>· {post.readingMinutes} {dict.blog.minRead}</span>
                {post.author && <span>· {dict.blog.by} {post.author}</span>}
              </div>

              <div dir={dir} lang={post.language}>
                <h1 className="mt-4 font-display text-3xl md:text-4xl text-[var(--brand-purple-deep)] leading-[1.15]">
                  {post.title}
                </h1>
                <p className="mt-4 text-lg text-[var(--brand-muted)] leading-relaxed">
                  {post.description}
                </p>
              </div>

              {post.cover && (
                <div className="relative mt-8 overflow-hidden rounded-2xl ring-1 ring-[var(--brand-purple)]/10">
                  <Image
                    src={post.cover}
                    alt={post.title}
                    width={1600}
                    height={900}
                    className="block w-full h-auto aspect-video object-cover"
                    sizes="(max-width: 896px) 100vw, 768px"
                    priority
                    unoptimized={!post.cover.startsWith("/")}
                  />
                  {post.author && (
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-4 py-1.5 text-xs font-semibold text-[var(--brand-purple-deep)] ring-1 ring-black/5 shadow-sm">
                        {dict.blog.by} {post.author}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10" dir={dir} lang={post.language}>
                <div className="prose-pregna" dangerouslySetInnerHTML={{ __html: post.html }} />
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap gap-2" dir={dir}>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--brand-cream)] ring-1 ring-[var(--brand-purple)]/10 px-3 py-1 text-xs text-[var(--brand-muted)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

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
              <div className="mt-10">
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
        </div>
      </div>
    </article>
  );
}
