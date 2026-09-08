import { NextResponse, type NextRequest } from "next/server";

import { dueSiteIds, runMonitoringScan } from "@/lib/qa/monitoring-run";

export const dynamic = "force-dynamic";
// A scheduled scan is a full package run per site -- the same headless Chromium
// work a paid standalone check does, which measured ~90s locally. 300s is
// Vercel's ceiling on most plans, so this route deliberately scans a few sites
// per invocation and leaves the rest to the next tick rather than trying to
// drain the queue in one go.
export const maxDuration = 300;

/** How many sites one invocation will attempt. Kept well under what 300s can
 * fit so a slow target cannot push the last site past the deadline and lose a
 * scan that was already half-run. */
const SITES_PER_RUN = 2;

/**
 * The monitoring subscription's heartbeat: scan the sites that are due, and
 * email the subscriber only when something changed since the previous scan.
 *
 * Runs daily rather than weekly even though the default cadence is weekly --
 * cadence is per subscription (CADENCE_DAYS), so the scheduler has to wake up
 * often enough to serve the shortest one, and dueSiteIds() decides what is
 * actually ready. A daily tick also means a site added today waits hours, not
 * up to a week, for its first scan.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set; refusing to run unauthenticated" },
      { status: 500 },
    );
  }

  const authorised =
    request.headers.get("authorization") === `Bearer ${secret}` ||
    request.nextUrl.searchParams.get("secret") === secret;

  if (!authorised) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const due = await dueSiteIds(SITES_PER_RUN);

  const results = [];
  for (const siteId of due) {
    // Sequential on purpose: two concurrent package scans mean two headless
    // Chromium processes in one function instance, which is how a run runs out
    // of memory rather than time.
    results.push(await runMonitoringScan(siteId));
  }

  return NextResponse.json({
    due: due.length,
    scanned: results.filter((r) => r.scanned).length,
    notified: results.filter((r) => r.notified).length,
  });
}
