import "server-only";
import dns from "node:dns";
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

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
`;

export async function ensureInitialized(): Promise<void> {
  if (global._pgInitDone) return;
  const pool = getPool();
  await pool.query(SCHEMA);
  await seedFromFiles(pool);
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
