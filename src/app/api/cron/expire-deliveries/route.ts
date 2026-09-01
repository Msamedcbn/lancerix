import { NextResponse, type NextRequest } from "next/server";

import { notifyQaOutcome } from "@/lib/notify/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Accepts QA deliveries nobody answered inside the review window.
 *
 * Same shape as /api/cron/expire-objections, one table over: it never decides
 * a status itself, it finds AWAITING_CLIENT rows whose deadline passed and
 * calls process_expired_deliveries(), which drives every row through
 * transition_delivery() the same way a client's own click would. The service
 * role is what transition_delivery() recognises as SYSTEM.
 *
 * Vercel Hobby cron only runs once a day and can fire anywhere in the
 * scheduled hour, so an expired delivery may sit for up to ~1-2 days past its
 * deadline before this catches it. DEFAULT_OBJECTION_WINDOW_DAYS (5) is sized
 * to absorb that; do not read this route as sub-day-accurate.
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

  const { data: expired, error } = await admin
    .from("deliveries")
    .select("id, contract_id, contracts(id, title, freelancer_id, client_email)")
    .eq("status", "AWAITING_CLIENT")
    .not("client_review_deadline", "is", null)
    .lte("client_review_deadline", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const accepted: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  for (const delivery of expired ?? []) {
    const { error: transitionError } = await admin.rpc("transition_delivery", {
      p_delivery_id: delivery.id,
      p_to_status: "ACCEPTED",
      p_reason: "Müşteri kontrol süresi doldu (otomatik onay)",
    });

    if (transitionError) {
      // One delivery failing must not stop the rest: a stuck row would
      // otherwise hold up every other deadline that came due today.
      failed.push({ id: delivery.id, reason: transitionError.message });
      continue;
    }

    accepted.push(delivery.id);

    const contract = delivery.contracts;
    if (contract) {
      await notifyQaOutcome({
        toUserId: contract.freelancer_id,
        fallbackEmail: contract.client_email,
        contractId: contract.id,
        contractTitle: contract.title,
        accepted: true,
        note: null,
      });
    }
  }

  return NextResponse.json({
    checked: expired?.length ?? 0,
    accepted: accepted.length,
    failed,
  });
}
