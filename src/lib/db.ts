import "server-only";
import dns from "node:dns";
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { slugify } from "./slug";

// Railway's private network (postgres.railway.internal) is IPv6-only.
// Node 18+ defaults to IPv4 first, which makes the lookup fail with
// "getaddrinfo ENOTFOUND". Prefer IPv6 (or fall back to verbatim) so
// private DATABASE_URL just works.
try {
  dns.setDefaultResultOrder("ipv6first");
} catch {
  // Older Node versions: ignore.
}

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _pgInitDone: boolean | undefined;
}

function makePool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add a Postgres plugin on Railway (it auto-sets DATABASE_URL) " +
        "or set DATABASE_URL locally to connect to a Postgres instance."
    );
  }
  const ssl = process.env.PGSSLMODE === "disable" || process.env.NODE_ENV !== "production"
    ? false
    : { rejectUnauthorized: false };
  return new Pool({ connectionString, ssl, max: 5 });
}

export function getPool(): Pool {
  if (!global._pgPool) global._pgPool = makePool();
  return global._pgPool;
}

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  body_md TEXT NOT NULL DEFAULT '',
  cover_image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  cover_url TEXT,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  author TEXT,
  meta_title TEXT,
  meta_description TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  publish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent migration: add language column if upgrading from earlier schema.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

-- Ensure language is one of our supported locales.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_language_check'
  ) THEN
    ALTER TABLE posts
      ADD CONSTRAINT posts_language_check CHECK (language IN ('en','ar'));
  END IF;
END $$;

-- Slug must be unique per language (en + ar can each have their own "welcome").
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_slug_key'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_slug_key;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_language_uniq ON posts (slug, language);

CREATE INDEX IF NOT EXISTS posts_publish_at_idx ON posts (publish_at);
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published);
CREATE INDEX IF NOT EXISTS posts_language_idx ON posts (language);

-- 301 map for renamed post slugs (e.g. Arabic posts that originally landed
-- with English slugs). The blog post page consults this on a slug miss.
CREATE TABLE IF NOT EXISTS slug_redirects (
  old_slug TEXT NOT NULL,
  language TEXT NOT NULL,
  new_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (old_slug, language)
);

-- Cached Google Search Console URL-inspection results for the admin panel.
CREATE TABLE IF NOT EXISTS gsc_inspections (
  url TEXT PRIMARY KEY,
  verdict TEXT NOT NULL DEFAULT '',
  coverage_state TEXT NOT NULL DEFAULT '',
  robots_txt_state TEXT NOT NULL DEFAULT '',
  indexing_state TEXT NOT NULL DEFAULT '',
  last_crawl_time TIMESTAMPTZ,
  google_canonical TEXT,
  www_verdict TEXT,
  www_coverage_state TEXT,
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent upgrade for deployments that created the table before the
-- www-twin columns existed.
ALTER TABLE gsc_inspections ADD COLUMN IF NOT EXISTS www_verdict TEXT;
ALTER TABLE gsc_inspections ADD COLUMN IF NOT EXISTS www_coverage_state TEXT;
`;

export async function ensureInitialized(): Promise<void> {
  if (global._pgInitDone) return;
  const pool = getPool();
  await pool.query(SCHEMA);
  await seedFromFiles(pool);
  await migrateArabicSlugs(pool);
  global._pgInitDone = true;
}

type SeedFrontmatter = {
  title?: string;
  description?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  cover?: string;
  draft?: boolean;
  slug?: string;
  language?: string;
  meta_title?: string;
  meta_description?: string;
};

async function seedFromFiles(pool: Pool) {
  // Seed each language independently. We only seed a given language when no
  // posts exist for it yet, so adding files later for one language doesn't
  // duplicate the other.
  await seedLanguageFromDir(pool, "en", path.join(process.cwd(), "content", "blog"));
  await seedLanguageFromDir(pool, "ar", path.join(process.cwd(), "content", "blog-ar"));
}

async function seedLanguageFromDir(pool: Pool, language: "en" | "ar", dir: string) {
  if (!fs.existsSync(dir)) return;

  // Iterate every file. ON CONFLICT (slug, language) DO NOTHING means existing
  // rows are untouched (so admin edits are preserved across deploys), and any
  // new files get inserted. Note: if a seeded post is deleted in admin, the
  // next deploy will re-create it as a draft. To prevent a post from coming
  // back, also remove its .md from this directory.
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    const fm = data as SeedFrontmatter;
    if (!fm.title) continue;
    const slug = (fm.slug ?? file.replace(/\.(md|mdx)$/i, "")).trim();
    // If this slug was renamed (slug_redirects), the post already exists
    // under its new slug - do not resurrect it under the old one.
    const renamed = await pool.query(
      `SELECT 1 FROM slug_redirects WHERE old_slug = $1 AND language = $2 LIMIT 1`,
      [slug, language]
    );
    if ((renamed.rowCount ?? 0) > 0) continue;
    const publishAt = fm.date ? new Date(fm.date) : new Date();
    const published = !fm.draft;
    await pool.query(
      `INSERT INTO posts (slug, title, description, body_md, cover_url, category, tags, author, meta_title, meta_description, language, published, publish_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (slug, language) DO NOTHING`,
      [
        slug,
        fm.title,
        fm.description ?? "",
        content,
        fm.cover ?? null,
        fm.category ?? null,
        fm.tags ?? [],
        fm.author ?? null,
        fm.meta_title ?? null,
        fm.meta_description ?? null,
        language,
        published,
        publishAt,
      ]
    );
  }
}

// One-time (idempotent) data migration: Arabic posts that landed with
// English slugs get an Arabic slug derived from their title, and the old
// slug is recorded in slug_redirects so existing URLs 301 to the new one.
// Posts whose slug is already Arabic don't match the ASCII regex and are
// untouched, so this is a no-op after the first run.
async function migrateArabicSlugs(pool: Pool) {
  const { rows } = await pool.query<{ id: string; slug: string; title: string }>(
    `SELECT id, slug, title FROM posts WHERE language = 'ar' AND slug ~ '^[a-z0-9-]+$'`
  );
  for (const row of rows) {
    const base = slugify(row.title);
    if (!base || base === row.slug || /^[a-z0-9-]+$/.test(base)) continue;

    // Uniquify against live posts (two Arabic posts can share a title).
    let next = base;
    for (let i = 2; i <= 20; i++) {
      const clash = await pool.query(
        `SELECT 1 FROM posts WHERE slug = $1 AND language = 'ar' AND id <> $2 LIMIT 1`,
        [next, row.id]
      );
      if ((clash.rowCount ?? 0) === 0) break;
      next = `${base.slice(0, 76)}-${i}`;
    }

    await pool.query(
      `INSERT INTO slug_redirects (old_slug, language, new_slug) VALUES ($1, 'ar', $2)
       ON CONFLICT (old_slug, language) DO UPDATE SET new_slug = EXCLUDED.new_slug`,
      [row.slug, next]
    );
    // Flatten any older redirects that pointed at the slug being renamed.
    await pool.query(
      `UPDATE slug_redirects SET new_slug = $1 WHERE language = 'ar' AND new_slug = $2`,
      [next, row.slug]
    );
    await pool.query(`UPDATE posts SET slug = $1, updated_at = NOW() WHERE id = $2`, [
      next,
      row.id,
    ]);
    console.log(`[db] slug migrated: ar/${row.slug} -> ar/${next}`);
  }
}
