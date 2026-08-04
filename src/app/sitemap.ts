import type { MetadataRoute } from "next";
import { getPublicPosts } from "@/lib/blog";
import { locales, type Locale } from "@/lib/i18n";

const BASE = "https://pregnawell.com";

type StaticPath = {
  path: string;
  changeFrequency: "weekly" | "monthly" | "daily";
  priority: number;
};

const STATIC_PATHS: StaticPath[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/story", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.9 },
  { path: "/testimonials", changeFrequency: "monthly", priority: 0.8 },
];

function alternatesFor(pathSuffix: string): Record<Locale, string> {
  const map = {} as Record<Locale, string>;
  for (const l of locales) {
    map[l] = `${BASE}/${l}${pathSuffix}`;
  }
  return map;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages (home, story, blog index, testimonials) for both locales,
  // each declaring its cross-locale alternate via alternates.languages —
  // Next serializes those as xhtml:link rel="alternate" hreflang tags.
  const staticEntries: MetadataRoute.Sitemap = [];
  for (const { path, changeFrequency, priority } of STATIC_PATHS) {
    for (const locale of locales) {
      staticEntries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: alternatesFor(path) },
      });
    }
  }

  // Individual article URLs for both locales. Public site serves the same
  // Arabic-only content set on either locale, so the two /(en|ar)/blog/<slug>
  // URLs are hreflang alternates of each other. Drafts and scheduled posts
  // are excluded by getPublicPosts's published + publish_at <= NOW() filter.
  const posts = await getPublicPosts("ar");
  const articleEntries: MetadataRoute.Sitemap = [];
  for (const p of posts) {
    for (const locale of locales) {
      articleEntries.push({
        url: `${BASE}/${locale}/blog/${p.slug}`,
        lastModified: p.publishAt ? new Date(p.publishAt) : now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages: alternatesFor(`/blog/${p.slug}`) },
      });
    }
  }

  return [...staticEntries, ...articleEntries];
}
