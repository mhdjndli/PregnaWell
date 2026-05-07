import "server-only";
import { marked } from "marked";
import { ensureInitialized, getPool } from "./db";

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
  publishAt: string | null;
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
    publishAt: row.publish_at,
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

export async function getPublicPosts(): Promise<BlogSummary[]> {
  return safe(async () => {
    const { rows } = await getPool().query<BlogRow>(
      `SELECT * FROM posts WHERE ${PUBLIC_FILTER} ORDER BY publish_at DESC NULLS LAST, created_at DESC`
    );
    return rows.map(toSummary);
  }, []);
}

export async function getPublicSlugs(): Promise<string[]> {
  return safe(async () => {
    const { rows } = await getPool().query<{ slug: string }>(
      `SELECT slug FROM posts WHERE ${PUBLIC_FILTER}`
    );
    return rows.map((r) => r.slug);
  }, []);
}

export async function getPublicPost(slug: string): Promise<BlogPost | null> {
  return safe(async () => {
    const { rows } = await getPool().query<BlogRow>(
      `SELECT * FROM posts WHERE slug = $1 AND ${PUBLIC_FILTER} LIMIT 1`,
      [slug]
    );
    const row = rows[0];
    if (!row) return null;
    return rowToPost(row);
  }, null);
}

export async function getAllPostsAdmin(): Promise<BlogSummary[]> {
  await ensureInitialized();
  const { rows } = await getPool().query<BlogRow>(
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

export async function getPostBySlugAdmin(slug: string): Promise<BlogPost | null> {
  await ensureInitialized();
  const { rows } = await getPool().query<BlogRow>(
    `SELECT * FROM posts WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  const row = rows[0];
  if (!row) return null;
  return rowToPost(row);
}

function rowToPost(row: BlogRow): BlogPost {
  const html = marked.parse(row.body_md ?? "", { async: false }) as string;
  return {
    ...toSummary(row),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    body_md: row.body_md ?? "",
    html,
  };
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
