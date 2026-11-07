import { NextResponse } from "next/server";
import { isBot, recordCtaClick, type CtaPlacement } from "@/lib/ctaClicks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/track/cta
//
// Fired by BlogCtaTracker (navigator.sendBeacon) when a reader clicks a
// funnel or WhatsApp link on a blog post. Body: { postId, href, placement, visitorId }.
// The server re-derives everything that matters (post, CTA type) from the
// DB and the link target, so a forged beacon can at most add a click to a
// real public post. Always answers 204 so the page never waits on it.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLACEMENTS: readonly CtaPlacement[] = ["cta_box", "in_article", "floating_button"];

export async function POST(request: Request) {
  const done = new NextResponse(null, { status: 204 });
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return done;

  let body: Record<string, unknown>;
  try {
    // sendBeacon may arrive as text/plain; parse the raw text either way.
    body = JSON.parse(await request.text());
  } catch {
    return done;
  }

  const postId = typeof body.postId === "string" ? body.postId : "";
  const href = typeof body.href === "string" ? body.href : "";
  const placement = PLACEMENTS.includes(body.placement as CtaPlacement)
    ? (body.placement as CtaPlacement)
    : "in_article";
  const visitorId =
    typeof body.visitorId === "string" && /^[\w-]{8,64}$/.test(body.visitorId)
      ? body.visitorId
      : null;
  if (!UUID_RE.test(postId) || !href) return done;

  try {
    await recordCtaClick({
      postId,
      href,
      placement,
      visitorId,
      userAgent: ua,
      // Set by Cloudflare / Vercel-style edges when present; null otherwise.
      country:
        request.headers.get("cf-ipcountry") ??
        request.headers.get("x-vercel-ip-country") ??
        null,
    });
  } catch (err) {
    console.error("[track/cta] failed to record click:", (err as Error).message);
  }
  return done;
}
