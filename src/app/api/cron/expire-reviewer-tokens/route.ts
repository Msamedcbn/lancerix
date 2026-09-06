import { NextResponse, type NextRequest } from "next/server";

import { notifyReviewerTokenExpired } from "@/lib/notify/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * 2026-09-06 four-role audit, Finding 1: a reviewer's report link expires in
 * 14 days (submit_qa_delivery() sets it). This is the one path the admin
 * re-enters the loop on -- when the reviewer never acted at all -- so that
 * removing the admin as manual relay for the happy path does not also mean
 * losing visibility when it silently doesn't happen.
 *
 * admin_notified_at is the idempotency guard, same pattern as
 * deliveries.reminder_sent_at: a token is only ever alerted on once, even
 * across multiple cron runs on the same day.
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
  const now = new Date().toISOString();

  const { data: expired, error } = await admin
    .from("qa_reviewer_tokens")
    .select(
      "id, tier_order:qa_tier_orders(delivery:deliveries(contract:contracts(title))), reviewer:qa_reviewers(full_name, profile:profiles(full_name))",
    )
    .is("used_at", null)
    .is("admin_notified_at", null)
    .lt("expires_at", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notified: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  for (const row of expired ?? []) {
    const contractTitle = row.tier_order?.delivery?.contract?.title;
    const reviewerName = row.reviewer?.profile?.full_name ?? row.reviewer?.full_name;
    if (!contractTitle || !reviewerName) continue;

    const sent = await notifyReviewerTokenExpired({ contractTitle, reviewerName });

    if (!sent.ok) {
      // Same rule as remind-pending-review: do not mark admin_notified_at on
      // a failed send, so a transient mail failure gets picked up tomorrow
      // rather than silently never alerting anyone.
      failed.push({ id: row.id, reason: sent.reason });
      continue;
    }

    const { error: markError } = await admin
      .from("qa_reviewer_tokens")
      .update({ admin_notified_at: now })
      .eq("id", row.id);

    if (markError) {
      failed.push({ id: row.id, reason: markError.message });
      continue;
    }

    notified.push(row.id);
  }

  return NextResponse.json({
    checked: expired?.length ?? 0,
    notified: notified.length,
    failed,
  });
}
