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
/**
 * Resolves the Polar product ID for a given package/tier, and whether it is
 * that package's own dedicated product or the shared custom-price fallback
 * (POLAR_QA_PRODUCT_ID).
 *
 * The distinction matters at checkout: POLAR_QA_PRODUCT_ID has no price of
 * its own, so every checkout against it must set `amount` (see
 * createQaOrderCheckout/createStandaloneOrderCheckout below). A dedicated
 * product (2026-09-09: BASIC/PRO/FULL each got one, with TRY/USD/EUR fixed
 * prices, same regional-pricing shape as the monitoring subscription) has
 * its own price -- sending `amount` alongside it would override the price
 * Polar picked for the customer's region, the same reason
 * createMonitoringCheckout never sends one.
 */
function resolvePolarProductId(key: string): { productId: string | undefined; dedicated: boolean } {
  const dedicated: Record<string, string | undefined> = {
    BASIC: process.env.POLAR_PRODUCT_BASIC,
    PRO: process.env.POLAR_PRODUCT_PRO,
    FULL: process.env.POLAR_PRODUCT_FULL,
    TIER2: process.env.POLAR_PRODUCT_TIER2,
    TIER3: process.env.POLAR_PRODUCT_TIER3,
  };
  const productId = dedicated[key.toUpperCase()];
  if (productId) return { productId, dedicated: true };
  return { productId: process.env.POLAR_QA_PRODUCT_ID, dedicated: false };
}

export async function createQaOrderCheckout(
  qaOrderId: string,
  amountKurus: number,
  tierLabel: string,
  customerIpAddress?: string,
): Promise<string> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const { productId, dedicated } = resolvePolarProductId(tierLabel);
  if (!accessToken || !productId) {
    console.warn("Polar credentials missing. Generating mock checkout URL.");
    return `http://localhost:3000/mock-checkout?qaOrderId=${qaOrderId}&amount=${amountKurus}`;
  }

  const polar = new Polar({ accessToken });

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      ...(dedicated ? {} : { amount: amountKurus, currency: "try" }),
      metadata: { qa_tier_order_id: qaOrderId, tier_label: tierLabel },
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
 * redirect.
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

  redirect(checkoutUrl as Route);
}

/**
 * A Polar checkout for one standalone_qa_orders row's fee.
 * Resolves discrete product ID (BASIC / PRO / FULL) if available in env.
 */
export async function createStandaloneOrderCheckout(
  standaloneOrderId: string,
  amountKurus: number,
  packageOrCheckLabel: string,
  customerIpAddress?: string,
): Promise<string> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const { productId, dedicated } = resolvePolarProductId(packageOrCheckLabel);
  if (!accessToken || !productId) {
    console.warn("Polar credentials missing. Generating mock checkout URL.");
    return `http://localhost:3000/mock-checkout?standaloneOrderId=${standaloneOrderId}&amount=${amountKurus}`;
  }

  const polar = new Polar({ accessToken });

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      ...(dedicated ? {} : { amount: amountKurus, currency: "try" }),
      metadata: { standalone_order_id: standaloneOrderId, tier_label: packageOrCheckLabel },
      customerIpAddress,
    });
    return checkout.url;
  } catch (err) {
    console.error("Polar checkout error:", err);
    throw new Error("Ödeme linki oluşturulamadı.");
  }
}


/**
 * A Polar checkout for a monitoring subscription.
 *
 * Two things are deliberately different from the one-off checkouts above.
 *
 * First, no `amount` or `currency` override. The one-off products carry no
 * price of their own, so every checkout has to set one; a subscription product
 * does, and per-currency prices are exactly how regional pricing is meant to
 * work on a Merchant of Record (2026-09-08 decision: TRY, USD and EUR prices
 * are set on the Polar product, not converted from each other here). Sending an
 * amount would override the price Polar picked for the customer's region and
 * defeat the whole point.
 *
 * Second, there is no fallback product. POLAR_QA_PRODUCT_ID is a one-time
 * product: falling back to it would silently sell a monthly plan as a single
 * charge. A missing subscription product id is a configuration error, and this
 * fails loudly rather than charging the customer the wrong shape.
 */
function resolveMonitoringProductId(planId: string): string | undefined {
  switch (planId.toUpperCase()) {
    case "MONITORING":
      return process.env.POLAR_PRODUCT_MONITORING;
    case "AGENCY":
      return process.env.POLAR_PRODUCT_AGENCY;
    default:
      return undefined;
  }
}

export async function createMonitoringCheckout(
  subscriptionId: string,
  planId: string,
  customerIpAddress?: string,
): Promise<string> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const productId = resolveMonitoringProductId(planId);
  if (!accessToken || !productId) {
    console.warn("Polar subscription product missing. Generating mock checkout URL.");
    return `http://localhost:3000/mock-checkout?monitoringSubscriptionId=${subscriptionId}&plan=${planId}`;
  }

  const polar = new Polar({ accessToken });

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      metadata: { monitoring_subscription_id: subscriptionId, plan_id: planId },
      customerIpAddress,
    });
    return checkout.url;
  } catch (err) {
    console.error("Polar subscription checkout error:", err);
    throw new Error("Abonelik ödeme linki oluşturulamadı.");
  }
}
