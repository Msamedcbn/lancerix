import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Marks a QA tier order (or a standalone_qa_orders row) paid once Polar
 * confirms the order.
 *
 * Signature verification runs unconditionally, same reasoning as the
 * LemonSqueezy route this replaces: an env-gated check that only applies "in
 * production" does not apply on every preview deploy and every local run,
 * exactly where an attacker would rather send a forged order.paid.
 * POLAR_WEBHOOK_SECRET is required, not defaulted, so a missing secret fails
 * closed instead of silently verifying against a guessable placeholder.
 * validateEvent() (from @polar-sh/sdk/webhooks) does the actual Standard
 * Webhooks signature check -- not hand-rolled HMAC here, unlike the
 * LemonSqueezy route, because Polar's own SDK already ships a verifier.
 *
 * This never touches contracts.status. A QA tier order's payment has no
 * bearing on contract state -- that state machine is owned by
 * transition_delivery()/transition_milestone(), not by a webhook.
 *
 * Dispatches on which metadata key is present rather than trying both
 * tables blindly: qa_tier_order_id and standalone_order_id are two disjoint
 * UUID spaces (different tables), so only one lookup should ever run per
 * event -- matching by ID against the wrong table would just find nothing,
 * but there's no reason to pay for the extra round trip on every event.
 */
export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("POLAR_WEBHOOK_SECRET is not configured.");
    return new NextResponse("Webhook not configured", { status: 500 });
  }

  const text = await req.text();
  const headers = Object.fromEntries(req.headers);

  let event: Awaited<ReturnType<typeof validateEvent>>;
  try {
    event = validateEvent(text, headers, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return new NextResponse("Invalid signature", { status: 401 });
    }
    console.error("Polar webhook payload could not be parsed:", err);
    return new NextResponse("Invalid payload", { status: 400 });
  }

  if (event.type !== "order.paid") {
    return new NextResponse("Event ignored", { status: 200 });
  }

  const qaOrderId = event.data.metadata?.qa_tier_order_id;
  const standaloneOrderId = event.data.metadata?.standalone_order_id;
  const orderId = event.data.id;

  if (typeof qaOrderId !== "string" && typeof standaloneOrderId !== "string") {
    return new NextResponse("Missing qa_tier_order_id/standalone_order_id in metadata", {
      status: 400,
    });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const table = typeof qaOrderId === "string" ? "qa_tier_orders" : "standalone_qa_orders";
  const targetId = typeof qaOrderId === "string" ? qaOrderId : (standaloneOrderId as string);

  const { error } = await supabase
    .from(table)
    .update({
      payment_status: "PAID",
      provider_reference: orderId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", targetId)
    .eq("payment_status", "PENDING");

  if (error) {
    console.error(`Failed to mark ${table} row paid:`, error);
    return new NextResponse("Database error", { status: 500 });
  }

  return new NextResponse("Success", { status: 200 });
}
