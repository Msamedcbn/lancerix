import { NextResponse, type NextRequest } from "next/server";

import { notifyAdminDigest } from "@/lib/notify/email";
import { getDashboardCounts } from "@/lib/data/admin-dashboard";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Admin operator toolkit (T7). Reuses getDashboardCounts() -- the same
 * function /admin's dashboard renders -- passed the service-role client
 * instead of a request-scoped one, since a cron has no user session. Skips
 * entirely on a zero-item day (no "all clear" noise mail) and skips if
 * already sent today (Vercel Hobby cron can refire within its scheduled
 * hour, same reasoning as remind-pending-review's idempotency guard).
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

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: alreadySent, error: checkError } = await admin
    .from("admin_digest_sends")
    .select("id")
    .eq("sent_date", today)
    .maybeSingle();

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }
  if (alreadySent) {
    return NextResponse.json({ skipped: "already sent today" });
  }

  const counts = await getDashboardCounts(admin);

  const countOf = (s: Awaited<ReturnType<typeof getDashboardCounts>>["qaQueue"]) =>
    s.ok ? s.count : 0;

  const totals = {
    qaQueue: countOf(counts.qaQueue),
    pendingOrders: countOf(counts.pendingOrders),
    pendingInvoices: countOf(counts.pendingInvoices),
    disputes: countOf(counts.disputes),
    unclaimedInvites: countOf(counts.unclaimedInvites),
  };
  const itemCount = Object.values(totals).reduce((sum, n) => sum + n, 0);

  if (itemCount === 0) {
    return NextResponse.json({ skipped: "nothing pending" });
  }

  const sent = await notifyAdminDigest(totals);
  if (!sent.ok) {
    // Non-fatal, matching every other notify* call site in this codebase:
    // logged, not thrown, not marked as sent -- tomorrow's run catches it.
    console.error("notifyAdminDigest failed", sent.reason);
    return NextResponse.json({ error: sent.reason }, { status: 502 });
  }

  const { error: markError } = await admin
    .from("admin_digest_sends")
    .insert({ sent_date: today, item_count: itemCount });

  if (markError) {
    return NextResponse.json({ error: markError.message }, { status: 500 });
  }

  return NextResponse.json({ sent: true, itemCount });
}
