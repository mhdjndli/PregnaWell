import { randomUUID } from "node:crypto";
import { ensureInitialized, getPool } from "@/lib/db";
import { slugify } from "@/lib/blog";
import type { Locale } from "@/lib/i18n";

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

type GeminiInlineData = { mimeType?: string; mime_type?: string; data: string };
type GeminiPart = { inlineData?: GeminiInlineData; inline_data?: GeminiInlineData };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

export type CoverImageResult =
  | { ok: true; url: string; id: string }
  | { ok: false; error: string };

const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

export function detectTitleLanguage(title: string): Locale {
  return ARABIC_RE.test(title) ? "ar" : "en";
}

function buildPrompt(title: string, bodyForContext: string, language: Locale): string {
  const titleDirective =
    language === "ar"
      ? `This is Arabic text — render it right-to-left with correctly connected letterforms, ` +
        `exactly as written, correctly spelled, with no extra words, subtitles or bylines. `
      : `This is English text — render it left-to-right, exactly as written, correctly spelled, ` +
        `with no extra words, subtitles or bylines. Use a clean modern sans-serif typeface. `;

  return (
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
    `three or four lines. ` +
    titleDirective +
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
    `Aspect ratio 16:9.`
  );
}

// Generates a 16:9 blog cover with Gemini and stores it in the `images`
// table. The rendered title language follows the title's script: Arabic
// characters → Arabic RTL text, otherwise English.
export async function generateCoverImage(
  title: string,
  bodyMd: string
): Promise<CoverImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY is not configured on the server." };
  }
  const cleanTitle = title.trim();
  if (!cleanTitle) return { ok: false, error: "Add a title first." };

  const language = detectTitleLanguage(cleanTitle);
  const bodyForContext = bodyMd
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1800);

  const prompt = buildPrompt(cleanTitle, bodyForContext, language);

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
  const filename = `${slugify(cleanTitle) || "cover"}-gemini.${ext}`;
  await getPool().query(
    `INSERT INTO images (id, filename, mime_type, size, data) VALUES ($1, $2, $3, $4, $5)`,
    [id, filename, mime, buf.length, buf]
  );
  return { ok: true, url: `/api/images/${id}`, id };
}
