import type { MetadataRoute } from "next";
import { getPublicPosts } from "@/lib/blog";
import { locales } from "@/lib/i18n";

const BASE = "https://pregnawell.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    staticUrls.push(
      { url: `${BASE}/${locale}`, changeFrequency: "weekly", priority: 1.0 },
      { url: `${BASE}/${locale}/story`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${BASE}/${locale}/blog`, changeFrequency: "weekly", priority: 0.9 }
    );
  }

  const postUrls: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    const posts = await getPublicPosts(locale);
    for (const p of posts) {
      postUrls.push({
        url: `${BASE}/${locale}/blog/${p.slug}`,
        lastModified: p.publishAt ?? undefined,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      });
    }
  }

  return [...staticUrls, ...postUrls];
}
