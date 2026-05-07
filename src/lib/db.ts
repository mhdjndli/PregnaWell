import "server-only";
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

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
  slug TEXT UNIQUE NOT NULL,
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
  published BOOLEAN NOT NULL DEFAULT FALSE,
  publish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_publish_at_idx ON posts (publish_at);
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published);
`;

export async function ensureInitialized(): Promise<void> {
  if (global._pgInitDone) return;
  const pool = getPool();
  await pool.query(SCHEMA);
  await seedFromFiles(pool);
  global._pgInitDone = true;
}

async function seedFromFiles(pool: Pool) {
  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM posts");
  if (Number(rows[0]?.count ?? 0) > 0) return;

  const dir = path.join(process.cwd(), "content", "blog");
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.(md|mdx)$/i, "");
    const fm = data as {
      title?: string;
      description?: string;
      date?: string;
      author?: string;
      category?: string;
      tags?: string[];
      cover?: string;
      draft?: boolean;
    };
    if (!fm.title) continue;
    const publishAt = fm.date ? new Date(fm.date) : new Date();
    const published = !fm.draft;
    await pool.query(
      `INSERT INTO posts (slug, title, description, body_md, cover_url, category, tags, author, published, publish_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (slug) DO NOTHING`,
      [
        slug,
        fm.title,
        fm.description ?? "",
        content,
        fm.cover ?? null,
        fm.category ?? null,
        fm.tags ?? [],
        fm.author ?? null,
        published,
        publishAt,
      ]
    );
  }
}
