import type { MetadataRoute } from "next";
import { getPublicPosts } from "@/lib/blog";
import { locales, type Locale } from "@/lib/i18n";

// Generate this route at request time (not at build) so the DB is available
// and the article slug list is included. Under the default (SSG) mode Railway
// runs the build without DATABASE_URL, so getPublicPosts falls back to []
// and the sitemap ships without any /blog/* entries.
export const dynamic = "force-dynamic";

const BASE = "https://pregnawell.com";

type StaticPath = {
  path: string;
  changeFrequency: "weekly" | "monthly" | "daily";
  priority: number;
  // If true, lastModified is the most recent article publish/edit date
  // (so the blog list URL reflects when new content actually appeared).
  useLatestArticleDate?: boolean;
};

const STATIC_PATHS: StaticPath[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/story", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.9, useLatestArticleDate: true },
  { path: "/testimonials", changeFrequency: "monthly", priority: 0.8 },
];

function alternatesFor(pathSuffix: string): Record<Locale, string> {
  const map = {} as Record<Locale, string>;
  for (const l of locales) {
    map[l] = `${BASE}/${l}${pathSuffix}`;
  }
  return map;
}

function pickDate(iso: string | null | undefined, fallback: Date): Date {
  if (!iso) return fallback;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Each locale has its own article library; fetch both.
  // getPublicPosts already filters drafts and future-scheduled posts.
  const postsByLocale = new Map<Locale, Awaited<ReturnType<typeof getPublicPosts>>>();
  for (const locale of locales) {
    postsByLocale.set(locale, await getPublicPosts(locale));
  }
  const allPosts = [...postsByLocale.values()].flat();

  // Newest content date across all articles - used as the blog list's
  // lastmod so the sitemap reflects when new content actually appeared.
  const latestArticleDate = allPosts.reduce<Date>((max, p) => {
    const candidate = pickDate(p.updatedAt || p.publishAt, new Date(0));
    return candidate > max ? candidate : max;
  }, new Date(0));
  const blogListLastMod = latestArticleDate.getTime() > 0 ? latestArticleDate : now;

  // Static routes for both locales with hreflang alternates. Next serializes
  // alternates.languages as xhtml:link rel="alternate" hreflang tags and
  // declares the xmlns:xhtml namespace on <urlset> automatically.
  const staticEntries: MetadataRoute.Sitemap = [];
  for (const { path, changeFrequency, priority, useLatestArticleDate } of STATIC_PATHS) {
    const lastMod = useLatestArticleDate ? blogListLastMod : now;
    for (const locale of locales) {
      staticEntries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: lastMod,
        changeFrequency,
        priority,
        alternates: { languages: alternatesFor(path) },
      });
    }
  }

  // Individual article URLs - each article lives only under its own
  // language's locale (no cross-language alternates: the libraries are
  // separate). lastmod pulled from each post's updated_at (falling back
  // to publish_at) so every article shows its actual last-modified date.
  const articleEntries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const p of postsByLocale.get(locale) ?? []) {
      articleEntries.push({
        url: `${BASE}/${locale}/blog/${encodeURIComponent(p.slug)}`,
        lastModified: pickDate(p.updatedAt || p.publishAt, now),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return [...staticEntries, ...articleEntries];
}
