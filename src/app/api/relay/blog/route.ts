import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { ensureInitialized, getPool } from "@/lib/db";
import { slugify } from "@/lib/blog";
import { isCategoryId, isLocale, type CategoryId, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ===========================================================================
// POST /api/relay/blog
//
// Authentication: Authorization: Bearer <RELAY_BEARER_TOKEN>
//
// JSON body. Posts created via this endpoint are saved as DRAFTS by default
// so they can be reviewed in /admin before going live. Only `title` and
// `content` (markdown) are required.
//
// Field name from the Relay agent → what we do with it:
//
//   title          string    required.
//   content        string    required (markdown). Aliases: body, body_md, body_markdown.
//   external links string|array  optional. URLs to append as a "Sources" section
//                            at the end of the body. Aliases: external_links, externalLinks.
//   language       "en"|"ar"  optional. Auto-detected from the title/body
//                            (Arabic characters → "ar") else "en".
//
// Other optional fields the route still accepts (all default to null/blank):
//   description, slug, category ("before"|"during"|"after"),
//   tags (array or comma-separated string), author (defaults to "Maha Hommos"),
//   cover_url, meta_title, meta_description, publish (boolean), publish_at (ISO 8601).
// ===========================================================================

type RelayResult =
  | {
      ok: true;
      id: string;
      slug: string;
      language: Locale;
      status: "draft" | "scheduled" | "published";
      url: string;
    }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function unauthorized(reason: string) {
  return NextResponse.json<RelayResult>(
    { ok: false, error: reason },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
  );
}

function badRequest(error: string, fieldErrors?: Record<string, string>) {
  return NextResponse.json<RelayResult>({ ok: false, error, fieldErrors }, { status: 400 });
}

function bearerFromHeader(value: string | null): string | null {
  if (!value) return null;
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1].trim() : null;
}

function tokensMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

function detectLanguage(...samples: (string | undefined | null)[]): Locale {
  for (const s of samples) {
    if (s && ARABIC_RE.test(s)) return "ar";
  }
  return "en";
}

function deriveDescription(body: string, max = 200): string {
  if (!body) return "";
  // Strip markdown noise to a clean plain string, then truncate at a word
  // boundary just under `max` chars.
  const plain = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/[#*_~>-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

function normalizeExternalLinks(input: unknown): string[] {
  const items = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(/[\s,;\n]+/)
      : [];
  return items
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => /^https?:\/\//i.test(v))
    .slice(0, 25);
}

function appendSourcesSection(body: string, links: string[], language: Locale): string {
  if (links.length === 0) return body;
  const heading = language === "ar" ? "المصادر" : "Sources";
  const bullets = links.map((url) => `- [${url}](${url})`).join("\n");
  return `${body.trimEnd()}\n\n## ${heading}\n\n${bullets}\n`;
}

function normalizeTags(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((t) => (typeof t === "string" ? t.trim().toLowerCase() : ""))
      .filter(Boolean)
      .slice(0, 20);
  }
  if (typeof input === "string") {
    return input
      .split(/[,;]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20);
  }
  return [];
}

function parseDate(input: unknown): Date | null {
  if (typeof input !== "string" || !input.trim()) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

export async function POST(request: Request) {
  // ---- auth ---------------------------------------------------------------
  const expected = process.env.RELAY_BEARER_TOKEN;
  if (!expected) {
    return NextResponse.json<RelayResult>(
      { ok: false, error: "Relay endpoint is not configured (RELAY_BEARER_TOKEN missing)." },
      { status: 503 }
    );
  }
  const provided = bearerFromHeader(request.headers.get("authorization"));
  if (!provided) return unauthorized("Missing Bearer token.");
  if (!tokensMatch(provided, expected)) return unauthorized("Invalid Bearer token.");

  // ---- parse body ---------------------------------------------------------
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }
  if (!payload || typeof payload !== "object") {
    return badRequest("Request body must be a JSON object.");
  }

  const title = pickString(payload.title).trim();
  const body_md = pickString(
    payload.body_md,
    payload.body,
    payload.content,
    payload.body_markdown
  );

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "title is required.";
  if (!body_md.trim()) {
    fieldErrors.body_md = "body_md (markdown) is required. Aliases: body, content, body_markdown.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return badRequest("Validation failed.", fieldErrors);
  }

  const rawLanguage = typeof payload.language === "string" ? payload.language.trim() : "";
  const language: Locale = isLocale(rawLanguage)
    ? (rawLanguage as Locale)
    : detectLanguage(title, body_md);

  // Append a "Sources" / "المصادر" section to the body if the Relay agent
  // sent any external links (field name has a space in the Relay UI, so we
  // also accept snake_case / camelCase aliases).
  const externalLinks = normalizeExternalLinks(
    payload["external links"] ?? payload.external_links ?? payload.externalLinks
  );
  const finalBody = appendSourcesSection(body_md, externalLinks, language);

  const rawSlug = pickString(payload.slug).trim();
  const slug = slugify(rawSlug || title);
  if (!slug) {
    return badRequest("Could not derive a slug from the title.", {
      slug: "slug must contain at least one letter or digit.",
    });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return badRequest("Invalid slug.", {
      slug: "slug may only contain lowercase letters, digits, and hyphens.",
    });
  }

  const description =
    pickString(payload.description).trim() || deriveDescription(body_md);

  // ---- publish / draft logic ---------------------------------------------
  // Posts created via Relay default to DRAFT so Maha can review them in
  // /admin before publishing. They only go live if the agent explicitly
  // sends publish=true, or schedules a future publish_at.
  const publishExplicit =
    typeof payload.publish === "boolean" ? payload.publish : undefined;
  const publishAtParsed = parseDate(payload.publish_at);
  const futureScheduled = !!publishAtParsed && publishAtParsed.getTime() > Date.now();
  let effectivePublished: boolean;
  let publish_at: Date | null;
  if (futureScheduled) {
    effectivePublished = true;
    publish_at = publishAtParsed;
  } else if (publishExplicit === true) {
    effectivePublished = true;
    publish_at = publishAtParsed ?? new Date();
  } else {
    effectivePublished = false;
    publish_at = null;
  }

  const rawCategory = typeof payload.category === "string" ? payload.category.trim() : "";
  const category: CategoryId | null = isCategoryId(rawCategory)
    ? (rawCategory as CategoryId)
    : null;

  const tags = normalizeTags(payload.tags);
  const author = pickString(payload.author).trim() || "Maha Hommos";
  const cover_url = pickString(payload.cover_url).trim() || null;
  const meta_title = pickString(payload.meta_title).trim() || null;
  const meta_description = pickString(payload.meta_description).trim() || null;

  // ---- insert -------------------------------------------------------------
  await ensureInitialized();
  let id: string;
  try {
    const { rows } = await getPool().query<{ id: string }>(
      `INSERT INTO posts (
         slug, title, description, body_md, cover_image_id, cover_url,
         category, tags, author, meta_title, meta_description,
         language, published, publish_at
       ) VALUES (
         $1, $2, $3, $4, NULL, $5,
         $6, $7, $8, $9, $10,
         $11, $12, $13
       ) RETURNING id`,
      [
        slug,
        title,
        description,
        finalBody,
        cover_url,
        category,
        tags,
        author,
        meta_title,
        meta_description,
        language,
        effectivePublished,
        publish_at,
      ]
    );
    id = rows[0].id;
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === "23505") {
      return NextResponse.json<RelayResult>(
        {
          ok: false,
          error: "A post with this slug already exists for this language.",
          fieldErrors: { slug: "duplicate slug for this language" },
        },
        { status: 409 }
      );
    }
    console.error("[relay/blog] insert failed:", e);
    return NextResponse.json<RelayResult>(
      { ok: false, error: e.message ?? "Failed to create post." },
      { status: 500 }
    );
  }

  const status = !effectivePublished
    ? "draft"
    : publish_at && publish_at.getTime() > Date.now()
      ? "scheduled"
      : "published";

  // Best-effort cache revalidation so the new post appears on the public site
  // without a redeploy. Dynamic import keeps the build clean.
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/${language}/blog`);
    revalidatePath(`/${language}/blog/${slug}`);
  } catch (err) {
    console.warn("[relay/blog] revalidate failed:", (err as Error).message);
  }

  return NextResponse.json<RelayResult>(
    {
      ok: true,
      id,
      slug,
      language,
      status,
      url: `https://pregnawell.com/${language}/blog/${slug}`,
    },
    { status: 201 }
  );
}

// Friendly GET for sanity-checking that the endpoint exists and the
// token works (also useful from a browser or `curl` when wiring Relay).
export async function GET(request: Request) {
  const expected = process.env.RELAY_BEARER_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Relay endpoint is not configured (RELAY_BEARER_TOKEN missing)." },
      { status: 503 }
    );
  }
  const provided = bearerFromHeader(request.headers.get("authorization"));
  if (!provided || !tokensMatch(provided, expected)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Send POST with Authorization: Bearer <token> and a JSON body. See route.ts for the schema.",
      },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    );
  }
  return NextResponse.json({
    ok: true,
    endpoint: "POST /api/relay/blog",
    note: "Posts created via Relay default to DRAFT and need to be published from /admin.",
    accepts: {
      required: ["title", "content"],
      optional: [
        "external links",
        "language",
        "description",
        "slug",
        "category",
        "tags",
        "author",
        "cover_url",
        "meta_title",
        "meta_description",
        "publish",
        "publish_at",
      ],
      aliases: {
        content: ["body", "body_md", "body_markdown"],
        "external links": ["external_links", "externalLinks"],
      },
    },
  });
}
