import type { MetadataRoute } from "next";
import { getPublicPosts } from "@/lib/blog";

const BASE = "https://pregnawell.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/story`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.9 },
  ];

  const posts = await getPublicPosts();
  const postUrls: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.publishAt ?? undefined,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticUrls, ...postUrls];
}
