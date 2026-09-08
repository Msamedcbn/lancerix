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
 * Resolves the specific Polar product ID for a given package/tier or falls back
 * to POLAR_QA_PRODUCT_ID.
 */
function resolvePolarProductId(key: string): string | undefined {
  switch (key.toUpperCase()) {
    case "BASIC":
      return process.env.POLAR_PRODUCT_BASIC || process.env.POLAR_QA_PRODUCT_ID;
    case "PRO":
      return process.env.POLAR_PRODUCT_PRO || process.env.POLAR_QA_PRODUCT_ID;
    case "FULL":
      return process.env.POLAR_PRODUCT_FULL || process.env.POLAR_QA_PRODUCT_ID;
    case "TIER2":
      return process.env.POLAR_PRODUCT_TIER2 || process.env.POLAR_QA_PRODUCT_ID;
    case "TIER3":
      return process.env.POLAR_PRODUCT_TIER3 || process.env.POLAR_QA_PRODUCT_ID;
    default:
      return process.env.POLAR_QA_PRODUCT_ID;
  }
}

export async function createQaOrderCheckout(
  qaOrderId: string,
  amountKurus: number,
  tierLabel: string,
  customerIpAddress?: string,
): Promise<string> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const productId = resolvePolarProductId(tierLabel);
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
  const productId = resolvePolarProductId(packageOrCheckLabel);
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
      metadata: { standalone_order_id: standaloneOrderId, tier_label: packageOrCheckLabel },
      customerIpAddress,
    });
    return checkout.url;
  } catch (err) {
    console.error("Polar checkout error:", err);
    throw new Error("Ödeme linki oluşturulamadı.");
  }
}

