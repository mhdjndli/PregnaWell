/**
 * One-time background migration (editorial request, Oct 2026): published
 * posts carry a "## المصادر" / "## Sources" section whose bullets are bare
 * URLs (`- [https://…](https://…)`, the relay's old format). Rewrite each
 * bare bullet so the visible text NAMES the source (organization/journal +
 * short descriptive title, year only when known), keeping the URL exactly.
 *
 * Runs once per process, kicked off from ensureInitialized without being
 * awaited (it makes one Gemini call per affected post, which must never
 * delay a request). Naturally idempotent: a named bullet no longer matches
 * the bare pattern, so finished posts are skipped on later boots; a post
 * whose rewrite fails validation is left untouched and retried next boot.
 */
import type { Pool } from "pg";

const SOURCES_HEADING_RX = /^#{2,3}\s*(?:المصادر|المراجع|Sources|References)\s*:?\s*$/;
// A "bare" bullet shows a URL as its own anchor text.
const BARE_BULLET_RX = /^-\s*\[https?:\/\/[^\]]+\]\((https?:\/\/[^)\s]+)\)\s*$/;

let started = false;

export function nameBareSourcesInBackground(pool: Pool): void {
  if (started) return;
  started = true;
  void run(pool).catch((err) =>
    console.warn("[nameSources] pass failed:", (err as Error).message)
  );
}

async function run(pool: Pool): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("[nameSources] GEMINI_API_KEY missing, skipping");
    return;
  }
  const { rows } = await pool.query<{
    id: string;
    language: string;
    title: string;
    body_md: string;
  }>(
    `SELECT id, language, title, body_md FROM posts
     WHERE body_md LIKE '%## المصادر%'
        OR body_md LIKE '%## المراجع%'
        OR body_md LIKE '%## Sources%'
        OR body_md LIKE '%## References%'`
  );
  let fixed = 0;
  for (const post of rows) {
    try {
      if (await fixPost(pool, apiKey, post)) fixed++;
    } catch (err) {
      console.warn(`[nameSources] post ${post.id}: ${(err as Error).message}`);
    }
    // Gentle pacing between Gemini calls.
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log(`[nameSources] done: ${fixed} post(s) renamed of ${rows.length} with a sources section`);
}

async function fixPost(
  pool: Pool,
  apiKey: string,
  post: { id: string; language: string; title: string; body_md: string }
): Promise<boolean> {
  const lines = post.body_md.split("\n");
  const headIdx = lines.findIndex((l) => SOURCES_HEADING_RX.test(l.trim()));
  if (headIdx === -1) return false;

  // Bullet lines of the sources section (blank lines tolerated, anything
  // else ends the section). Only bare-URL bullets are rewritten.
  const bare: { line: number; url: string }[] = [];
  for (let i = headIdx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (!t.startsWith("-")) break;
    const m = t.match(BARE_BULLET_RX);
    if (m) bare.push({ line: i, url: m[1] });
  }
  if (!bare.length) return false;

  const named = await geminiName(apiKey, post, bare.map((b) => b.url));
  if (!named || named.length !== bare.length) {
    console.warn(`[nameSources] post ${post.id}: naming failed, left bare for next boot`);
    return false;
  }
  for (let i = 0; i < bare.length; i++) {
    lines[bare[i].line] = `- [${named[i]}](${bare[i].url})`;
  }
  await pool.query(`UPDATE posts SET body_md = $1, updated_at = now() WHERE id = $2`, [
    lines.join("\n"),
    post.id,
  ]);
  console.log(
    `[nameSources] post ${post.id} ("${post.title.slice(0, 40)}"): ${bare.length} source(s) named`
  );
  return true;
}

/** One Gemini call per post: returns the anchor text for each URL, in
 *  order, or null when the response fails validation. */
async function geminiName(
  apiKey: string,
  post: { language: string; title: string; body_md: string },
  urls: string[]
): Promise<string[] | null> {
  const lang = post.language === "ar" ? "Arabic" : "English";
  const context = post.body_md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|]+/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 2500);
  const prompt = `These URLs are the cited sources of a ${lang} health blog
article titled "${post.title}". For EACH URL, in the given order, write the
anchor text for its sources-list link, in ${lang}: the organization or
journal name, the year in parentheses ONLY if it is evident from the URL or
the article excerpt (never guess a year), then a colon and a short
descriptive title of what the source covers. Example anchor:
"منظمة الصحة العالمية (2016): توصيات مكملات الحديد اليومية للحوامل".
Never output a URL as the anchor. If a source is only identifiable by its
domain, use the domain's organization name and a neutral description.

URLS:
${urls.map((u, i) => `${i + 1}. ${u}`).join("\n")}

ARTICLE EXCERPT (context): ${context}

Return ONLY JSON: { "anchors": ["<anchor for URL 1>", ...] } with exactly ${urls.length} entries.`;

  for (const model of ["gemini-3.1-flash", "gemini-2.5-flash"]) {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
    } catch {
      continue;
    }
    if (!res.ok) continue;
    try {
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
      const parsed = JSON.parse(text) as { anchors?: unknown };
      const anchors = Array.isArray(parsed.anchors) ? parsed.anchors.map(String) : null;
      if (
        anchors &&
        anchors.length === urls.length &&
        anchors.every(
          (a) =>
            a.trim() &&
            !/^https?:\/\//i.test(a.trim()) &&
            !a.includes("](") &&
            !a.includes("[")
        )
      ) {
        return anchors.map((a) => a.trim());
      }
    } catch {
      /* try the next model */
    }
  }
  return null;
}
