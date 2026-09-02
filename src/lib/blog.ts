import "server-only";
import { marked } from "marked";
import { ensureInitialized, getPool } from "./db";
import type { Locale } from "./i18n";

export type BlogStatus = "draft" | "scheduled" | "published";

export type BlogRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body_md: string;
  cover_image_id: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[];
  author: string | null;
  meta_title: string | null;
  meta_description: string | null;
  language: Locale;
  published: boolean;
  publish_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover: string | null;
  category: string | null;
  tags: string[];
  author: string | null;
  language: Locale;
  publishAt: string | null;
  updatedAt: string;
  status: BlogStatus;
  readingMinutes: number;
};

export type BlogPost = BlogSummary & {
  metaTitle: string | null;
  metaDescription: string | null;
  body_md: string;
  html: string;
};

function readingTime(text: string) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function statusOf(row: BlogRow): BlogStatus {
  if (!row.published) return "draft";
  if (row.publish_at && new Date(row.publish_at).getTime() > Date.now()) return "scheduled";
  return "published";
}

function coverFor(row: Pick<BlogRow, "cover_image_id" | "cover_url">): string | null {
  if (row.cover_image_id) return `/api/images/${row.cover_image_id}`;
  return row.cover_url ?? null;
}

function toSummary(row: BlogRow): BlogSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    cover: coverFor(row),
    category: row.category,
    tags: row.tags ?? [],
    author: row.author,
    language: row.language ?? "en",
    publishAt: row.publish_at,
    updatedAt: row.updated_at,
    status: statusOf(row),
    readingMinutes: readingTime(row.body_md),
  };
}

const PUBLIC_FILTER = `published = TRUE AND (publish_at IS NULL OR publish_at <= NOW())`;

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    await ensureInitialized();
    return await fn();
  } catch (err) {
    console.warn("[blog] DB unavailable, returning fallback:", (err as Error).message);
    return fallback;
  }
}

// Each locale serves its own library: /en/blog only lists English posts and
// /ar/blog only Arabic ones.
export async function getPublicPosts(language: Locale): Promise<BlogSummary[]> {
  return safe(async () => {
    const { rows } = await getPool().query<BlogRow>(
      `SELECT * FROM posts WHERE language = $1 AND ${PUBLIC_FILTER} ORDER BY publish_at DESC NULLS LAST, created_at DESC`,
      [language]
    );
    return rows.map(toSummary);
  }, []);
}

export async function getPublicSlugs(language: Locale): Promise<string[]> {
  return safe(async () => {
    const { rows } = await getPool().query<{ slug: string }>(
      `SELECT slug FROM posts WHERE language = $1 AND ${PUBLIC_FILTER}`,
      [language]
    );
    return rows.map((r) => r.slug);
  }, []);
}

export async function getPublicPost(slug: string, language: Locale): Promise<BlogPost | null> {
  return safe(async () => {
    const { rows } = await getPool().query<BlogRow>(
      `SELECT * FROM posts WHERE slug = $1 AND language = $2 AND ${PUBLIC_FILTER} LIMIT 1`,
      [slug, language]
    );
    const row = rows[0];
    if (!row) return null;
    return rowToPost(row);
  }, null);
}

export async function getAllPostsAdmin(language?: Locale): Promise<BlogSummary[]> {
  await ensureInitialized();
  const { rows } = language
    ? await getPool().query<BlogRow>(
        `SELECT * FROM posts WHERE language = $1 ORDER BY COALESCE(publish_at, created_at) DESC`,
        [language]
      )
    : await getPool().query<BlogRow>(
        `SELECT * FROM posts ORDER BY COALESCE(publish_at, created_at) DESC`
      );
  return rows.map(toSummary);
}

export async function getPostByIdAdmin(id: string): Promise<BlogPost | null> {
  await ensureInitialized();
  const { rows } = await getPool().query<BlogRow>(
    `SELECT * FROM posts WHERE id = $1 LIMIT 1`,
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  return rowToPost(row);
}

export async function getPostBySlugAdmin(
  slug: string,
  language: Locale
): Promise<BlogPost | null> {
  await ensureInitialized();
  const { rows } = await getPool().query<BlogRow>(
    `SELECT * FROM posts WHERE slug = $1 AND language = $2 LIMIT 1`,
    [slug, language]
  );
  const row = rows[0];
  if (!row) return null;
  return rowToPost(row);
}

function rowToPost(row: BlogRow): BlogPost {
  let html = "";
  try {
    html = marked.parse(row.body_md ?? "", { async: false }) as string;
  } catch (err) {
    console.error(`[blog] marked.parse failed for slug=${row.slug} lang=${row.language}:`, err);
  }
  return {
    ...toSummary(row),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    body_md: row.body_md ?? "",
    html,
  };
}

export { formatDate } from "./format";

// Unicode-aware: Arabic titles keep their Arabic letters instead of being
// reduced to an empty/transliterated English slug. Diacritics and tatweel are
// stripped so the slug stays stable however the title was typed.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFC")
    .replace(/['"\u2018\u2019\u201C\u201D]/g, "")
    .replace(/[\u0640\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
