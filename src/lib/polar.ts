import "server-only";

import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Polar } from "@polar-sh/sdk";
import { FAIL, type FormState } from "@/lib/forms";

/**
 * A Polar checkout for one QA tier order's fee.
 *
 * Polar is a Merchant of Record (2026-09-07, replacing LemonSqueezy): it can
 * legally sell a fixed-price digital service on Lancerix's behalf without
 * Lancerix itself being a registered company yet -- confirmed against
 * Polar's own docs that Turkey is on Stripe Connect Express's payout country
 * list. That only holds for a single fixed amount charged to one payer -- it
 * is not a substitute for the PayTR/iyzico marketplace leg a variable, split
 * escrow payment needs, so this stays scoped to qa_tier_orders.fee_kurus and
 * must never be pointed at a contract's project amount.
 *
 * Every QA tier (1-4) reuses one custom-price, one-time product
 * (POLAR_QA_PRODUCT_ID, "QA Doğrulama Ücreti") rather than one product per
 * tier -- the product carries no fixed price of its own, `amount` below sets
 * the real charge per checkout. amountKurus is passed straight through:
 * because the product's price_currency is TRY, Polar's minor-unit convention
 * for that price is kuruş, the same unit qa_fee_kurus already uses, so no
 * conversion is needed (verified against the SDK's own price-creation
 * schema, not assumed).
 */
export async function createQaOrderCheckout(
  qaOrderId: string,
  amountKurus: number,
  tierLabel: string,
  customerIpAddress?: string,
): Promise<string> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const productId = process.env.POLAR_QA_PRODUCT_ID;
  if (!accessToken || !productId) {
    console.warn("Polar credentials missing. Generating mock checkout URL.");
    return `http://localhost:3000/mock-checkout?qaOrderId=${qaOrderId}&amount=${amountKurus}`;
  }

  const polar = new Polar({ accessToken });

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      amount: amountKurus,
      currency: "try",
      metadata: { qa_tier_order_id: qaOrderId, tier_label: tierLabel },
      // Checkout sessions are created from this server, not the customer's
      // browser -- without the real customer IP, Polar would geolocate the
      // request to wherever this app is hosted (likely a US/EU Vercel
      // region) and could show the wrong presentment currency. Undefined is
      // fine: Polar then falls back to the organization's own default (TRY).
      customerIpAddress,
    });
    return checkout.url;
  } catch (err) {
    console.error("Polar checkout error:", err);
    throw new Error("Ödeme linki oluşturulamadı.");
  }
}

/**
 * The redirect-to-checkout boilerplate shared by payQaOrder (qa-actions.ts)
 * and payStandaloneCheck (standalone-qa-actions.ts): extract the real
 * customer IP the same way both did independently, build a checkout via the
 * caller's own createQaOrderCheckout/createStandaloneOrderCheckout call, and
 * redirect. Only the two callers' checkout-creation calls differ (different
 * tables, different metadata key) -- that stays at the call site rather than
 * becoming a parameter here, so neither caller has to know the other's shape.
 *
 * Returns FormState on failure (createCheckout threw); on success it calls
 * redirect(), which throws internally and never actually returns.
 */
export async function payViaPolarCheckout(
  createCheckout: (customerIp?: string) => Promise<string>,
): Promise<FormState> {
  const h = await headers();
  const customerIp = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;

  let checkoutUrl: string;
  try {
    checkoutUrl = await createCheckout(customerIp);
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Ödeme linki oluşturulamadı.");
  }

  // An external Polar URL, not an app route -- typedRoutes only knows this
  // app's own routes, so it needs an explicit escape hatch here.
  redirect(checkoutUrl as Route);
}

/**
 * A Polar checkout for one standalone_qa_orders row's fee -- same product,
 * same one-time-custom-amount mechanism as createQaOrderCheckout above, but
 * metadata carries standalone_order_id instead of qa_tier_order_id so the
 * webhook (src/app/api/webhooks/polar/route.ts) can tell which table to
 * update. Kept as a separate function rather than a shared-key parameter so
 * neither call site has to know the other table's metadata shape exists.
 */
export async function createStandaloneOrderCheckout(
  standaloneOrderId: string,
  amountKurus: number,
  checkTypeLabel: string,
  customerIpAddress?: string,
): Promise<string> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const productId = process.env.POLAR_QA_PRODUCT_ID;
  if (!accessToken || !productId) {
    console.warn("Polar credentials missing. Generating mock checkout URL.");
    return `http://localhost:3000/mock-checkout?standaloneOrderId=${standaloneOrderId}&amount=${amountKurus}`;
  }

  const polar = new Polar({ accessToken });

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      amount: amountKurus,
      currency: "try",
      metadata: { standalone_order_id: standaloneOrderId, tier_label: checkTypeLabel },
      customerIpAddress,
    });
    return checkout.url;
  } catch (err) {
    console.error("Polar checkout error:", err);
    throw new Error("Ödeme linki oluşturulamadı.");
  }
}
