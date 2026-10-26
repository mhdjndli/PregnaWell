import "server-only";
import { ensureInitialized, getPool } from "./db";
import { site } from "./site";
import type { Locale } from "./i18n";

// ===========================================================================
// Blog CTA click tracking.
//
// Every click from a blog post into the funnel (pregnawell.clinic: the
// fertility score app, the masterclass VSL, the booking widget) is logged as
// one row in blog_cta_clicks with the post, which CTA, where on the page it
// sat, and the exact timestamp. The admin "Blog conversions" page reads it.
// ===========================================================================

export type CtaId = "fertility_score" | "masterclass" | "booking" | "other_funnel";
export type CtaPlacement = "cta_box" | "in_article";

export const CTA_LABELS: Record<CtaId, string> = {
  fertility_score: "Fertility Score",
  masterclass: "Masterclass",
  booking: "Book a call",
  other_funnel: "Other funnel page",
};

export const PLACEMENT_LABELS: Record<CtaPlacement, string> = {
  cta_box: "End-of-post CTA",
  in_article: "In-article link",
};

const FUNNEL_HOST = "pregnawell.clinic";

function isFunnelHost(host: string): boolean {
  return host === FUNNEL_HOST || host.endsWith(`.${FUNNEL_HOST}`);
}

function samePage(a: URL, b: string): boolean {
  try {
    const u = new URL(b);
    return a.host === u.host && a.pathname.replace(/\/$/, "") === u.pathname.replace(/\/$/, "");
  } catch {
    return false;
  }
}

/** Funnel CTA for a link target, or null when the link is not a funnel link. */
export function classifyCta(href: string): CtaId | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (!isFunnelHost(url.hostname)) return null;
  if (samePage(url, site.ctas.fertilityScore)) return "fertility_score";
  if (samePage(url, site.ctas.masterclass)) return "masterclass";
  if (samePage(url, site.ctas.call)) return "booking";
  return "other_funnel";
}

function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

export function isBot(ua: string): boolean {
  return !ua || /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|curl|wget|python|httpclient/i.test(ua);
}

export async function recordCtaClick(input: {
  postId: string;
  href: string;
  placement: CtaPlacement;
  visitorId: string | null;
  userAgent: string;
  country: string | null;
}): Promise<boolean> {
  const cta = classifyCta(input.href);
  if (!cta) return false;
  await ensureInitialized();
  // Only public posts count; snapshot slug/title so the log survives a
  // later rename or delete. Same visitor + post + link within 10s is
  // a double-click, not a second conversion.
  const { rowCount } = await getPool().query(
    `INSERT INTO blog_cta_clicks
       (post_id, slug, language, post_title, cta, placement, destination, visitor_id, device, country)
     SELECT p.id, p.slug, p.language, p.title, $2, $3, $4, $5, $6, $7
       FROM posts p
      WHERE p.id = $1
        AND p.published = TRUE AND (p.publish_at IS NULL OR p.publish_at <= NOW())
        AND NOT EXISTS (
          SELECT 1 FROM blog_cta_clicks c
           WHERE c.post_id = p.id AND c.destination = $4 AND c.placement = $3
             AND c.visitor_id IS NOT DISTINCT FROM $5
             AND c.clicked_at > NOW() - INTERVAL '10 seconds'
        )`,
    [
      input.postId,
      cta,
      input.placement,
      input.href.slice(0, 2000),
      input.visitorId,
      deviceOf(input.userAgent),
      input.country,
    ]
  );
  return (rowCount ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------

export const CONVERSION_RANGES = [7, 28, 90, 365] as const;

export function parseConversionDays(value: unknown): number {
  const n = Number(value);
  return (CONVERSION_RANGES as readonly number[]).includes(n) ? n : 28;
}

export type PostConversionRow = {
  postId: string | null;
  slug: string;
  language: Locale;
  title: string;
  clicks: number;
  visitors: number;
  byCta: Partial<Record<CtaId, number>>;
  lastClickAt: string;
};

export type ClickLogRow = {
  id: string;
  clickedAt: string;
  postId: string | null;
  slug: string;
  language: Locale;
  title: string;
  cta: CtaId;
  placement: CtaPlacement;
  device: string | null;
  country: string | null;
};

export type ConversionsReport = {
  totals: { clicks: number; visitors: number; posts: number; previousClicks: number };
  byCta: { cta: CtaId; clicks: number }[];
  series: { date: string; value: number }[];
  posts: PostConversionRow[];
  log: ClickLogRow[];
};

/** Day buckets are in this zone so "on that date" matches the team's calendar. */
export const REPORT_TZ = "Asia/Dubai";

// One row per post; clicks on a since-deleted post (post_id nulled) still
// group by their snapshotted language/slug instead of collapsing together.
const POST_KEY = `COALESCE(c.post_id::text, 'gone:' || c.language || '/' || c.slug)`;

function iso(v: Date | string): string {
  return (v instanceof Date ? v : new Date(v)).toISOString();
}

export async function getConversionsReport(
  days: number,
  postId: string | null
): Promise<ConversionsReport> {
  await ensureInitialized();
  const pool = getPool();
  const since = `NOW() - make_interval(days => $1::int)`;

  const [totals, prev, byCta, series, posts, postCtas, log] = await Promise.all([
    pool.query<{ clicks: string; visitors: string; posts: string }>(
      `SELECT COUNT(*) AS clicks,
              COUNT(DISTINCT COALESCE(visitor_id, id::text)) AS visitors,
              COUNT(DISTINCT ${POST_KEY}) AS posts
         FROM blog_cta_clicks c WHERE clicked_at >= ${since}`,
      [days]
    ),
    pool.query<{ clicks: string }>(
      `SELECT COUNT(*) AS clicks FROM blog_cta_clicks
        WHERE clicked_at >= NOW() - make_interval(days => $1::int * 2)
          AND clicked_at < ${since}`,
      [days]
    ),
    pool.query<{ cta: CtaId; clicks: string }>(
      `SELECT cta, COUNT(*) AS clicks FROM blog_cta_clicks
        WHERE clicked_at >= ${since} GROUP BY cta ORDER BY clicks DESC`,
      [days]
    ),
    pool.query<{ day: string; clicks: string }>(
      `WITH d AS (
         SELECT generate_series(
           ((NOW() AT TIME ZONE $2) - make_interval(days => $1::int - 1))::date,
           (NOW() AT TIME ZONE $2)::date,
           INTERVAL '1 day'
         )::date AS day
       )
       SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COUNT(c.id) AS clicks
         FROM d
         LEFT JOIN blog_cta_clicks c
           ON (c.clicked_at AT TIME ZONE $2)::date = d.day
          AND ($3::uuid IS NULL OR c.post_id = $3::uuid)
        GROUP BY d.day ORDER BY d.day`,
      [days, REPORT_TZ, postId]
    ),
    pool.query<{
      key: string;
      post_id: string | null;
      slug: string;
      language: Locale;
      title: string;
      clicks: string;
      visitors: string;
      last_click: Date;
    }>(
      `SELECT ${POST_KEY} AS key,
              MAX(c.post_id::text) AS post_id,
              COALESCE(MAX(p.slug), MAX(c.slug)) AS slug,
              COALESCE(MAX(p.language), MAX(c.language)) AS language,
              COALESCE(MAX(p.title), MAX(c.post_title)) AS title,
              COUNT(*) AS clicks,
              COUNT(DISTINCT COALESCE(c.visitor_id, c.id::text)) AS visitors,
              MAX(c.clicked_at) AS last_click
         FROM blog_cta_clicks c
         LEFT JOIN posts p ON p.id = c.post_id
        WHERE c.clicked_at >= ${since}
        GROUP BY 1
        ORDER BY clicks DESC, last_click DESC`,
      [days]
    ),
    pool.query<{ key: string; cta: CtaId; clicks: string }>(
      `SELECT ${POST_KEY} AS key, c.cta, COUNT(*) AS clicks
         FROM blog_cta_clicks c
        WHERE c.clicked_at >= ${since}
        GROUP BY 1, 2`,
      [days]
    ),
    pool.query<{
      id: string;
      clicked_at: Date;
      post_id: string | null;
      slug: string;
      language: Locale;
      title: string;
      cta: CtaId;
      placement: CtaPlacement;
      device: string | null;
      country: string | null;
    }>(
      `SELECT c.id::text, c.clicked_at, c.post_id,
              COALESCE(p.slug, c.slug) AS slug,
              COALESCE(p.language, c.language) AS language,
              COALESCE(p.title, c.post_title) AS title,
              c.cta, c.placement, c.device, c.country
         FROM blog_cta_clicks c
         LEFT JOIN posts p ON p.id = c.post_id
        WHERE c.clicked_at >= ${since}
          AND ($2::uuid IS NULL OR c.post_id = $2::uuid)
        ORDER BY c.clicked_at DESC
        LIMIT 500`,
      [days, postId]
    ),
  ]);

  const ctasByPost = new Map<string, Partial<Record<CtaId, number>>>();
  for (const r of postCtas.rows) {
    const m = ctasByPost.get(r.key) ?? {};
    m[r.cta] = Number(r.clicks);
    ctasByPost.set(r.key, m);
  }

  const t = totals.rows[0];
  return {
    totals: {
      clicks: Number(t?.clicks ?? 0),
      visitors: Number(t?.visitors ?? 0),
      posts: Number(t?.posts ?? 0),
      previousClicks: Number(prev.rows[0]?.clicks ?? 0),
    },
    byCta: byCta.rows.map((r) => ({ cta: r.cta, clicks: Number(r.clicks) })),
    series: series.rows.map((r) => ({ date: r.day, value: Number(r.clicks) })),
    posts: posts.rows.map((r) => ({
      postId: r.post_id,
      slug: r.slug,
      language: r.language,
      title: r.title,
      clicks: Number(r.clicks),
      visitors: Number(r.visitors),
      byCta: ctasByPost.get(r.key) ?? {},
      lastClickAt: iso(r.last_click),
    })),
    log: log.rows.map((r) => ({
      id: r.id,
      clickedAt: iso(r.clicked_at),
      postId: r.post_id,
      slug: r.slug,
      language: r.language,
      title: r.title,
      cta: r.cta,
      placement: r.placement,
      device: r.device,
      country: r.country,
    })),
  };
}
