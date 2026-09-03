"use server";

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { ensureInitialized, getPool } from "@/lib/db";
import { inspectUrl } from "@/lib/searchConsole";

async function requireAuth() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }
}

export type InspectionRecord = {
  url: string;
  verdict: string;
  coverageState: string;
  robotsTxtState: string;
  indexingState: string;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
  // Google indexed the site under www before the host redirect shipped.
  // When the apex URL is not indexed we also inspect the www twin so the
  // panel can show "indexed under www (migrating)" during the handover.
  wwwVerdict: string | null;
  wwwCoverageState: string | null;
  inspectedAt: string;
};

const MAX_BATCH = 8;

// Inspect a small batch of URLs against the URL Inspection API and cache the
// results. The client walks the full URL list in batches so a full-site check
// shows progress and never hits the server-action timeout.
export async function inspectPagesAction(urls: string[]): Promise<{
  ok: boolean;
  results?: InspectionRecord[];
  error?: string;
}> {
  await requireAuth();
  if (!Array.isArray(urls) || urls.length === 0) {
    return { ok: false, error: "No URLs provided." };
  }
  const batch = urls.slice(0, MAX_BATCH).filter(
    (u) => typeof u === "string" && u.startsWith("https://pregnawell.com/")
  );
  if (batch.length === 0) {
    return { ok: false, error: "Only pregnawell.com URLs can be inspected." };
  }

  try {
    const results = await Promise.all(
      batch.map(async (url): Promise<InspectionRecord> => {
        const r = await inspectUrl(url);
        let wwwVerdict: string | null = null;
        let wwwCoverageState: string | null = null;
        if (r.verdict !== "PASS") {
          try {
            const www = await inspectUrl(
              url.replace("https://pregnawell.com/", "https://www.pregnawell.com/")
            );
            wwwVerdict = www.verdict;
            wwwCoverageState = www.coverageState;
          } catch {
            // URL-prefix properties don't cover the www host; skip quietly.
          }
        }
        return {
          url,
          verdict: r.verdict,
          coverageState: r.coverageState,
          robotsTxtState: r.robotsTxtState,
          indexingState: r.indexingState,
          lastCrawlTime: r.lastCrawlTime,
          googleCanonical: r.googleCanonical,
          wwwVerdict,
          wwwCoverageState,
          inspectedAt: new Date().toISOString(),
        };
      })
    );

    await ensureInitialized();
    const pool = getPool();
    for (const r of results) {
      await pool.query(
        `INSERT INTO gsc_inspections
           (url, verdict, coverage_state, robots_txt_state, indexing_state, last_crawl_time, google_canonical, www_verdict, www_coverage_state, inspected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (url) DO UPDATE SET
           verdict = EXCLUDED.verdict,
           coverage_state = EXCLUDED.coverage_state,
           robots_txt_state = EXCLUDED.robots_txt_state,
           indexing_state = EXCLUDED.indexing_state,
           last_crawl_time = EXCLUDED.last_crawl_time,
           google_canonical = EXCLUDED.google_canonical,
           www_verdict = EXCLUDED.www_verdict,
           www_coverage_state = EXCLUDED.www_coverage_state,
           inspected_at = NOW()`,
        [
          r.url,
          r.verdict,
          r.coverageState,
          r.robotsTxtState,
          r.indexingState,
          r.lastCrawlTime,
          r.googleCanonical,
          r.wwwVerdict,
          r.wwwCoverageState,
        ]
      );
    }
    return { ok: true, results };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
