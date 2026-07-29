"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  clearSessionCookie,
  isAuthed,
  setSessionCookie,
} from "@/lib/auth";
import { ensureInitialized, getPool } from "@/lib/db";
import { slugify } from "@/lib/blog";
import { isCategoryId, isLocale, type Locale, type CategoryId } from "@/lib/i18n";
import { randomUUID } from "node:crypto";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

async function requireAuth() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { ok: false as const, error: "Incorrect password." };
  }
  await setSessionCookie();
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin");
}

export type PostFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parsePublishAt(input: string | null | undefined): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseTags(input: string | null | undefined): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function uploadImageAction(formData: FormData): Promise<{
  ok: boolean;
  url?: string;
  id?: string;
  error?: string;
}> {
  await requireAuth();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file provided." };
  if (!ALLOWED_IMAGE_TYPES.has(file.type))
    return { ok: false, error: `Unsupported type: ${file.type}` };
  if (file.size > MAX_IMAGE_BYTES)
    return { ok: false, error: `File too large (max ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB)` };

  const buf = Buffer.from(await file.arrayBuffer());
  await ensureInitialized();
  const id = randomUUID();
  await getPool().query(
    `INSERT INTO images (id, filename, mime_type, size, data) VALUES ($1, $2, $3, $4, $5)`,
    [id, file.name || "upload", file.type, buf.length, buf]
  );
  return { ok: true, url: `/api/images/${id}`, id };
}

type GeminiInlineData = { mimeType?: string; mime_type?: string; data: string };
type GeminiPart = { inlineData?: GeminiInlineData; inline_data?: GeminiInlineData };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

export async function generateCoverImageAction(formData: FormData): Promise<{
  ok: boolean;
  url?: string;
  id?: string;
  error?: string;
}> {
  await requireAuth();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY is not configured on the server." };
  }
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Add a title first." };
  const rawLanguage = String(formData.get("language") ?? "en").trim();
  const language: Locale = isLocale(rawLanguage) ? (rawLanguage as Locale) : "en";
  void language;

  const rawBody = String(formData.get("body_md") ?? "");
  const bodyForContext = rawBody
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1800);

  const prompt =
    `BLOG TITLE: "${title}"\n` +
    `BLOG BODY (context only, DO NOT render any of these words in the image): """${bodyForContext}"""\n\n` +
    `Create a 16:9 blog cover image. First, read the blog title and body provided and work out what ` +
    `the article is actually about - its central idea, its subject matter, and the feeling a reader ` +
    `should get from it. Then design a cover that expresses that idea through real photography.\n` +
    `CRITICAL: The blog body is context for you to understand the topic. Do not render any of the ` +
    `body text in the image. The only text in the image is the title.\n` +
    `LAYOUT — STRICT: The frame divides into two zones.\n` +
    `• Right half = TEXT ZONE. Completely empty, clean, evenly lit cream surface. No objects, no ` +
    `props, no shadows cast into it, no shapes, no partial objects entering from any edge. Nothing ` +
    `whatsoever may sit behind, under, beside or overlapping the title. This zone contains only the ` +
    `flat cream backdrop and the text.\n` +
    `• Left half = OBJECT ZONE. All photographed objects live here, weighted toward the lower left. ` +
    `Nothing crosses the centre line of the frame.\n\n` +
    `These two zones are a compositional guide only, never a visible division — there must be no ` +
    `hard edge, seam, line or colour break between them. The cream surface flows continuously across ` +
    `the entire frame as one unbroken backdrop, and the objects on the left dissolve gradually into ` +
    `soft focus and open space as they approach the centre, so the transition into the empty text ` +
    `area reads as a natural gradient rather than a split.\n\n` +
    `WHAT TO SHOOT: In the left zone, a photorealistic still life of two to four real physical ` +
    `objects drawn directly from the article's subject matter — objects a reader would immediately ` +
    `recognise as belonging to this topic. No random decorative props, no items unrelated to the ` +
    `article. Real textures, real materials, tangible depth, arranged loosely with space between ` +
    `them.\n` +
    `PHOTOGRAPHY: High-end editorial still-life photography. Soft, warm, diffused natural window ` +
    `light from the upper left, gentle falloff, soft realistic shadows falling to the left and ` +
    `downward, away from the text zone. Shallow depth of field, objects in sharp focus, backdrop ` +
    `falling into smooth clean bokeh. Slight three-quarter angle. Full-frame camera, 85mm lens, ` +
    `f/2.0. Calm, premium, unstaged — not glossy commercial stock.\n` +
    `ABSOLUTELY NO: people, faces, hands, body parts, figures, silhouettes, animals, logos, ` +
    `packaging, labels, watermarks, borders, frames, UI elements, illustration, vector art, 3D ` +
    `render look, or any text other than the title.\n` +
    `TITLE: Set the title in the upper-right of the frame, right-aligned, large and dominant, on ` +
    `three or four lines. This is Arabic text — render it right-to-left with correctly connected ` +
    `letterforms, exactly as written, correctly spelled, with no extra words, subtitles or bylines. ` +
    `The exact title to render, verbatim: "${title}"\n` +
    `Base colour: deep purple #442F71.\n` +
    `HIGHLIGHTS: From the title, choose yourself the one or two phrases that carry the most meaning ` +
    `— the words that tell a scrolling reader what this article is about. Prefer the core subject of ` +
    `the article and its main promise or outcome. Skip connecting words, prepositions and filler. ` +
    `Each chosen phrase should be two to three words, and the two phrases must not sit adjacent to ` +
    `one another.\n` +
    `Set the chosen phrases in white inside solid rounded-corner boxes filled with dusty rose ` +
    `#A96273, like a marker highlight. The boxes hug the text tightly and sit inline within the ` +
    `sentence, never on their own line.\n` +
    `Do not draw any brackets, square brackets, parentheses, quotation marks, asterisks or any ` +
    `other punctuation around the highlighted phrases. The highlight is the coloured box alone. The ` +
    `words inside it appear exactly as they do in normal running text, with no added characters of ` +
    `any kind. The remaining words of the title stay in deep purple with no box.\n` +
    `COLOUR: Warm cream #EDD8C1 surface and backdrop. Objects styled in dusty rose #A96273, teal ` +
    `green #4B7C73 and deep purple #442F71 tones. Grade the whole image warm, muted and ` +
    `low-saturation within this four-colour palette. No competing hues.\n` +
    `Aspect ratio 16:9.`;

  const model = "gemini-3.1-flash-image-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      }),
    });
  } catch (err) {
    return {
      ok: false,
      error: `Failed to reach Gemini: ${(err as Error).message ?? "network error"}`,
    };
  }

  let body: GeminiResponse;
  try {
    body = (await res.json()) as GeminiResponse;
  } catch {
    return { ok: false, error: `Gemini returned non-JSON (HTTP ${res.status}).` };
  }

  if (!res.ok) {
    return { ok: false, error: body.error?.message ?? `Gemini error (HTTP ${res.status}).` };
  }
  if (body.promptFeedback?.blockReason) {
    return { ok: false, error: `Gemini blocked the prompt: ${body.promptFeedback.blockReason}` };
  }

  const parts = body.candidates?.[0]?.content?.parts ?? [];
  const inline = parts
    .map((p) => p.inlineData ?? p.inline_data)
    .find((d): d is GeminiInlineData => !!d && typeof d.data === "string");
  if (!inline) {
    return { ok: false, error: "Gemini did not return an image." };
  }

  const mime = inline.mimeType ?? inline.mime_type ?? "image/png";
  if (!ALLOWED_IMAGE_TYPES.has(mime)) {
    return { ok: false, error: `Unsupported image type from Gemini: ${mime}` };
  }
  const buf = Buffer.from(inline.data, "base64");
  if (buf.length === 0) return { ok: false, error: "Gemini returned an empty image." };
  if (buf.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Generated image exceeded size limit." };
  }

  await ensureInitialized();
  const id = randomUUID();
  const ext = mime.split("/")[1] ?? "png";
  const filename = `${slugify(title) || "cover"}-gemini.${ext}`;
  await getPool().query(
    `INSERT INTO images (id, filename, mime_type, size, data) VALUES ($1, $2, $3, $4, $5)`,
    [id, filename, mime, buf.length, buf]
  );
  return { ok: true, url: `/api/images/${id}`, id };
}

type GeminiTextPart = { text?: string };
type GeminiTextResponse = {
  candidates?: { content?: { parts?: GeminiTextPart[] } }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

function stripMarkdownToPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateSeoAction(formData: FormData): Promise<{
  ok: boolean;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  error?: string;
}> {
  await requireAuth();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY is not configured on the server." };
  }
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body_md") ?? "");
  if (!title) return { ok: false, error: "Add a title first." };
  if (!body.trim()) return { ok: false, error: "Add some content first." };

  const rawLanguage = String(formData.get("language") ?? "en").trim();
  const language: Locale = isLocale(rawLanguage) ? (rawLanguage as Locale) : "en";

  const plain = stripMarkdownToPlainText(body).slice(0, 6000);
  const langName = language === "ar" ? "Arabic" : "English";
  const prompt =
    `You write SEO metadata for a women's health blog. Given the post title and content below, ` +
    `produce SEO metadata in ${langName}, in the same language and tone as the post.\n\n` +
    `Rules:\n` +
    `- metaTitle: max 60 characters, compelling, includes the primary keyword, no quotes.\n` +
    `- metaDescription: 140-160 characters, plain sentence(s), no quotes, no emoji.\n` +
    `- keywords: 5 to 8 short lowercase keywords or short phrases (no hashtags), ` +
    `ordered from most to least relevant. Each keyword 1-4 words.\n\n` +
    `Title: ${title}\n\nContent:\n${plain}`;

  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              metaTitle: { type: "STRING" },
              metaDescription: { type: "STRING" },
              keywords: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["metaTitle", "metaDescription", "keywords"],
          },
        },
      }),
    });
  } catch (err) {
    return {
      ok: false,
      error: `Failed to reach Gemini: ${(err as Error).message ?? "network error"}`,
    };
  }

  let body_: GeminiTextResponse;
  try {
    body_ = (await res.json()) as GeminiTextResponse;
  } catch {
    return { ok: false, error: `Gemini returned non-JSON (HTTP ${res.status}).` };
  }
  if (!res.ok) {
    return { ok: false, error: body_.error?.message ?? `Gemini error (HTTP ${res.status}).` };
  }
  if (body_.promptFeedback?.blockReason) {
    return { ok: false, error: `Gemini blocked the prompt: ${body_.promptFeedback.blockReason}` };
  }

  const text = body_.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) return { ok: false, error: "Gemini returned an empty response." };

  let parsed: { metaTitle?: unknown; metaDescription?: unknown; keywords?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Gemini returned malformed JSON." };
  }

  const metaTitle = typeof parsed.metaTitle === "string" ? parsed.metaTitle.trim() : "";
  const metaDescription =
    typeof parsed.metaDescription === "string" ? parsed.metaDescription.trim() : "";
  const keywords = Array.isArray(parsed.keywords)
    ? parsed.keywords
        .map((k) => (typeof k === "string" ? k.trim().toLowerCase() : ""))
        .filter((k) => k.length > 0 && k.length <= 60)
        .slice(0, 12)
    : [];

  if (!metaTitle && !metaDescription && keywords.length === 0) {
    return { ok: false, error: "Gemini did not return any SEO fields." };
  }
  return { ok: true, metaTitle, metaDescription, keywords };
}

type PostInput = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  body_md: string;
  cover_image_id: string | null;
  cover_url: string | null;
  category: CategoryId | null;
  tags: string[];
  author: string | null;
  meta_title: string | null;
  meta_description: string | null;
  language: Locale;
  publish_at: Date | null;
  published: boolean;
};

function readPostInput(formData: FormData): PostInput {
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || title);
  const description = String(formData.get("description") ?? "").trim();
  const body_md = String(formData.get("body_md") ?? "");
  const cover_image_id = (String(formData.get("cover_image_id") ?? "").trim() || null) as
    | string
    | null;
  const cover_url = (String(formData.get("cover_url") ?? "").trim() || null) as
    | string
    | null;
  const rawCategory = String(formData.get("category") ?? "").trim();
  const category: CategoryId | null = isCategoryId(rawCategory) ? rawCategory : null;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const rawLanguage = String(formData.get("language") ?? "en").trim();
  const language: Locale = isLocale(rawLanguage) ? (rawLanguage as Locale) : "en";
  const author = (String(formData.get("author") ?? "").trim() || null) as string | null;
  const meta_title = (String(formData.get("meta_title") ?? "").trim() || null) as string | null;
  const meta_description = (String(formData.get("meta_description") ?? "").trim() || null) as
    | string
    | null;
  const status = String(formData.get("status") ?? "draft");
  const publish_at = parsePublishAt(String(formData.get("publish_at") ?? "") || null);
  const published = status === "published" || status === "scheduled";
  return {
    id: (String(formData.get("id") ?? "").trim() || undefined) as string | undefined,
    title,
    slug,
    description,
    body_md,
    cover_image_id,
    cover_url,
    category,
    tags,
    author,
    meta_title,
    meta_description,
    language,
    publish_at: status === "scheduled" ? publish_at : status === "published" ? publish_at ?? new Date() : null,
    published,
  };
}

function validate(input: PostInput): Record<string, string> | null {
  const errors: Record<string, string> = {};
  if (!input.title) errors.title = "Title is required.";
  if (!input.slug) errors.slug = "Slug is required.";
  if (!/^[a-z0-9-]+$/.test(input.slug)) errors.slug = "Slug may only contain lowercase letters, digits, and hyphens.";
  return Object.keys(errors).length ? errors : null;
}

export async function savePostAction(formData: FormData) {
  await requireAuth();
  const input = readPostInput(formData);
  const fieldErrors = validate(input);
  if (fieldErrors) {
    return { ok: false as const, fieldErrors };
  }

  await ensureInitialized();
  const pool = getPool();

  try {
    if (input.id) {
      await pool.query(
        `UPDATE posts SET
           slug = $2,
           title = $3,
           description = $4,
           body_md = $5,
           cover_image_id = $6,
           cover_url = $7,
           category = $8,
           tags = $9,
           author = $10,
           meta_title = $11,
           meta_description = $12,
           language = $13,
           published = $14,
           publish_at = $15,
           updated_at = NOW()
         WHERE id = $1`,
        [
          input.id,
          input.slug,
          input.title,
          input.description,
          input.body_md,
          input.cover_image_id,
          input.cover_url,
          input.category,
          input.tags,
          input.author,
          input.meta_title,
          input.meta_description,
          input.language,
          input.published,
          input.publish_at,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO posts (slug, title, description, body_md, cover_image_id, cover_url, category, tags, author, meta_title, meta_description, language, published, publish_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          input.slug,
          input.title,
          input.description,
          input.body_md,
          input.cover_image_id,
          input.cover_url,
          input.category,
          input.tags,
          input.author,
          input.meta_title,
          input.meta_description,
          input.language,
          input.published,
          input.publish_at,
        ]
      );
    }
  } catch (err: unknown) {
    const msg = (err as { code?: string; message?: string }).message ?? "Save failed.";
    if ((err as { code?: string }).code === "23505") {
      return {
        ok: false as const,
        fieldErrors: { slug: "A post with this slug already exists." },
      };
    }
    return { ok: false as const, error: msg };
  }

  revalidatePath(`/${input.language}/blog`);
  revalidatePath(`/${input.language}/blog/${input.slug}`);
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function deletePostAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await ensureInitialized();
  await getPool().query(`DELETE FROM posts WHERE id = $1`, [id]);
  revalidatePath("/en/blog");
  revalidatePath("/ar/blog");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}
