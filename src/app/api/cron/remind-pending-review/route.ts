import { NextResponse, type NextRequest } from "next/server";

import { notifyReviewDeadlineApproaching } from "@/lib/notify/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Faz E #3 (2026-09-03 CEO strategy review): reminds the freelancer, not the
 * client -- the client going quiet is the freelancer's problem to chase, and
 * the platform can't nudge someone who isn't looking. Same shape as
 * /api/cron/expire-deliveries, one day earlier in the same window: finds
 * AWAITING_CLIENT rows whose deadline is coming up, not already past.
 *
 * REMINDER_WINDOW_HOURS is generous (48h, not "the last day") because Vercel
 * Hobby cron only runs once daily at an unpredictable time within its
 * scheduled hour -- a tighter window risks the reminder landing after
 * expire-deliveries has already auto-accepted the same row. reminder_sent_at
 * is what actually prevents a duplicate reminder on the next day's run, not
 * this window's width.
 */
const REMINDER_WINDOW_HOURS = 48;

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

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

  const { data: dueSoon, error } = await admin
    .from("deliveries")
    .select("id, contract_id, client_review_deadline, contracts(id, title, freelancer_id)")
    .eq("status", "AWAITING_CLIENT")
    .is("reminder_sent_at", null)
    .not("client_review_deadline", "is", null)
    .gt("client_review_deadline", now.toISOString())
    .lte("client_review_deadline", windowEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reminded: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  for (const delivery of dueSoon ?? []) {
    const contract = delivery.contracts;
    if (!contract || !delivery.client_review_deadline) continue;

    const sent = await notifyReviewDeadlineApproaching({
      toUserId: contract.freelancer_id,
      contractId: contract.id,
      contractTitle: contract.title,
      deadline: delivery.client_review_deadline,
    });

    if (!sent.ok) {
      // One address failing to resolve must not stop the rest, and must not
      // mark reminder_sent_at -- an unresolved address today may resolve
      // tomorrow, and a silent failure here is exactly the F-1 class of bug
      // this session has twice already found and fixed elsewhere.
      failed.push({ id: delivery.id, reason: sent.reason });
      continue;
    }

    const { error: markError } = await admin
      .from("deliveries")
      .update({ reminder_sent_at: now.toISOString() })
      .eq("id", delivery.id);

    if (markError) {
      failed.push({ id: delivery.id, reason: markError.message });
      continue;
    }

    reminded.push(delivery.id);
  }

  return NextResponse.json({
    checked: dueSoon?.length ?? 0,
    reminded: reminded.length,
    failed,
  });
}
