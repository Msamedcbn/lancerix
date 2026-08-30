import { NextResponse, type NextRequest } from "next/server";

import { notifyAutoAccepted } from "@/lib/notify/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Accepts deliveries nobody objected to.
 *
 * This is the mechanism the product is built around: an unanswered delivery
 * becomes accepted when its window closes, and the acceptance is recorded like
 * any other transition. It runs with the service role because that is what
 * transition_milestone() recognises as SYSTEM -- the one actor allowed to
 * complete a milestone without a client clicking anything.
 *
 * It never decides a status itself. It finds expired rows and asks the same
 * function every other transition goes through, so the ledger row is written
 * in the same transaction and the state machine still refuses an illegal edge.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set; refusing to run unauthenticated" },
      { status: 500 },
    );
  }

  // Vercel Cron sends the secret as a bearer token.
  const authorised =
    request.headers.get("authorization") === `Bearer ${secret}` ||
    request.nextUrl.searchParams.get("secret") === secret;

  if (!authorised) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: expired, error } = await admin
    .from("milestones")
    .select("id, title, contract_id, auto_accept_at, contracts(client_id, freelancer_id)")
    .eq("status", "SUBMITTED")
    .not("auto_accept_at", "is", null)
    .lte("auto_accept_at", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const accepted: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  for (const milestone of expired ?? []) {
    const { error: transitionError } = await admin.rpc("transition_milestone", {
      p_milestone_id: milestone.id,
      p_to_status: "COMPLETED",
      p_reason: "Objection window closed with no objection",
    });

    if (transitionError) {
      // One milestone failing must not stop the rest: a stuck row would
      // otherwise hold up every other deadline that came due today.
      failed.push({ id: milestone.id, reason: transitionError.message });
      continue;
    }

    accepted.push(milestone.id);

    const freelancerId = milestone.contracts?.freelancer_id;
    if (freelancerId) {
      await notifyAutoAccepted({
        toUserId: freelancerId,
        contractId: milestone.contract_id,
        milestoneTitle: milestone.title,
      });
    }
  }

  return NextResponse.json({
    checked: expired?.length ?? 0,
    accepted: accepted.length,
    failed,
  });
}
