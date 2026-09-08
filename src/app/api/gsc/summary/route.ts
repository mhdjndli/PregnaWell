import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { isGscConfigured } from "@/lib/searchConsole";
import {
  getCachedInspections,
  getPerformanceSummary,
  parseRangeDays,
  type GscPerformanceSummary,
  type InspectionRecord,
} from "@/lib/gscSummary";
import { getAllSiteUrls } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ===========================================================================
// GET /api/gsc/summary?days=7|28|90|180   (default 28)
//
// Read-only feed of the /admin/search-console dashboard for trusted partner
// dashboards (e.g. exeedagency.com). Same code path as the admin page, so the
// numbers always match.
//
// Authentication: Authorization: Bearer <GSC_SHARE_TOKEN>
// The endpoint is disabled (404) until GSC_SHARE_TOKEN is set.
// ===========================================================================

type SummaryResult =
  | {
      ok: true;
      generatedAt: string;
      performance: GscPerformanceSummary | null;
      performanceError: string | null;
      indexing: { urls: string[]; inspections: InspectionRecord[] };
    }
  | { ok: false; error: string };

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

export async function GET(request: Request) {
  const expected = process.env.GSC_SHARE_TOKEN;
  if (!expected) {
    return NextResponse.json<SummaryResult>(
      { ok: false, error: "Not found." },
      { status: 404 }
    );
  }
  const provided = bearerFromHeader(request.headers.get("authorization"));
  if (!provided || !tokensMatch(provided, expected)) {
    return NextResponse.json<SummaryResult>(
      { ok: false, error: "Invalid or missing bearer token." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    );
  }
  if (!isGscConfigured()) {
    return NextResponse.json<SummaryResult>(
      { ok: false, error: "Search Console is not configured on this server." },
      { status: 503 }
    );
  }

  const days = parseRangeDays(new URL(request.url).searchParams.get("days"));

  let performance: GscPerformanceSummary | null = null;
  let performanceError: string | null = null;
  try {
    performance = await getPerformanceSummary(days);
  } catch (err) {
    performanceError = (err as Error).message;
  }

  const [urls, inspections] = await Promise.all([getAllSiteUrls(), getCachedInspections()]);

  return NextResponse.json<SummaryResult>({
    ok: true,
    generatedAt: new Date().toISOString(),
    performance,
    performanceError,
    indexing: { urls, inspections },
  });
}
