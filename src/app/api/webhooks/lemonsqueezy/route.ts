import crypto from "crypto";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Marks a QA tier order paid once LemonSqueezy confirms the checkout.
 *
 * HMAC verification runs unconditionally -- an env-gated check that only
 * applies "in production" is a check that does not apply on every preview
 * deploy and every local run, which is exactly where an attacker would
 * rather send a forged order_created. LEMONSQUEEZY_WEBHOOK_SECRET is
 * required, not defaulted, so a missing secret fails closed instead of
 * silently verifying against a guessable placeholder.
 *
 * This never touches contracts.status. A QA tier order's payment has no
 * bearing on contract state -- that state machine is owned by
 * transition_delivery()/transition_milestone(), not by a webhook.
 */
export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured.");
    return new NextResponse("Webhook not configured", { status: 500 });
  }

  const text = await req.text();
  const digest = Buffer.from(
    crypto.createHmac("sha256", secret).update(text).digest("hex"),
    "utf8",
  );
  const signature = Buffer.from(req.headers.get("x-signature") ?? "", "utf8");

  if (digest.length !== signature.length || !crypto.timingSafeEqual(digest, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: { qa_tier_order_id?: string } };
    data?: { id?: string };
  };
  try {
    payload = JSON.parse(text);
  } catch {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const qaOrderId = payload.meta?.custom_data?.qa_tier_order_id;
  const orderId = payload.data?.id;

  if (eventName !== "order_created") {
    return new NextResponse("Event ignored", { status: 200 });
  }
  if (!qaOrderId || !orderId) {
    return new NextResponse("Missing qa_tier_order_id in custom_data", { status: 400 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase
    .from("qa_tier_orders")
    .update({
      payment_status: "PAID",
      provider_reference: orderId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", qaOrderId)
    .eq("payment_status", "PENDING");

  if (error) {
    console.error("Failed to mark QA order paid:", error);
    return new NextResponse("Database error", { status: 500 });
  }

  return new NextResponse("Success", { status: 200 });
}
