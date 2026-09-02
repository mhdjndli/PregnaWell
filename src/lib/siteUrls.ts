import "server-only";
import { getPublicPosts } from "./blog";
import { locales } from "./i18n";

// Every public page on pregnawell.com, mirroring src/app/sitemap.ts:
// static routes x locales plus each published article x locales.
// Used by the admin Search Console page to check indexing per URL.

const BASE = "https://pregnawell.com";
const STATIC_PATHS = ["", "/story", "/blog", "/testimonials"];

export async function getAllSiteUrls(): Promise<string[]> {
  const urls: string[] = [];
  for (const path of STATIC_PATHS) {
    for (const locale of locales) urls.push(`${BASE}/${locale}${path}`);
  }
  for (const locale of locales) {
    try {
      const posts = await getPublicPosts(locale);
      for (const post of posts) {
        urls.push(`${BASE}/${locale}/blog/${encodeURIComponent(post.slug)}`);
      }
    } catch {
      // DB unreachable: still return the static pages.
    }
  }
  return urls;
}
