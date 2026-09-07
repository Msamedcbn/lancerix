import { NextResponse, type NextRequest } from "next/server";

import { processTier2Order } from "@/lib/qa/agent";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Safety net for TIER2 (Agentic QA) orders, one table over from
 * expire-objections/expire-deliveries.
 *
 * The primary trigger is immediate: chooseQaTier() schedules
 * processTier2Order() via next/server's after() the moment the order is
 * created, so most orders are done in seconds. This exists for what that
 * misses -- an invocation that crashed mid-run, a deploy that raced the
 * request -- so nothing sits stuck at agent_status QUEUED/RUNNING forever
 * with no human ever told. The 10-minute floor keeps this from racing an
 * after() call that is still legitimately in flight.
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
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: stuck, error } = await admin
    .from("qa_tier_orders")
    .select("id")
    .eq("tier", "TIER2")
    .or("agent_status.is.null,agent_status.eq.QUEUED,agent_status.eq.RUNNING")
    .lte("created_at", staleBefore);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const processed: string[] = [];
  for (const order of stuck ?? []) {
    // true: this query already pre-filtered to orders 10+ minutes old, so a
    // RUNNING one here can only be a prior invocation that died mid-run.
    await processTier2Order(order.id, true);
    processed.push(order.id);
  }

  return NextResponse.json({ found: stuck?.length ?? 0, processed });
}
