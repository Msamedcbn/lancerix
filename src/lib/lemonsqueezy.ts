import "server-only";

/**
 * A LemonSqueezy checkout for one QA tier order's fee.
 *
 * LemonSqueezy is a Merchant of Record: it can legally sell a fixed-price
 * digital service on Lancerix's behalf without Lancerix itself being a
 * registered company yet. That only holds for a single fixed amount charged
 * to one payer -- it is not a substitute for the PayTR/iyzico marketplace
 * leg a variable, split escrow payment needs, so this stays scoped to
 * qa_tier_orders.fee_kurus and must never be pointed at a contract's project
 * amount.
 *
 * amountKurus is passed as LemonSqueezy's custom_price, which the API takes
 * in the smallest unit of the store's configured currency. If the store is
 * configured in TRY, kurus is that unit and no conversion is needed; if it
 * is configured in USD, this value needs converting before calling here.
 * That configuration lives in the LemonSqueezy dashboard, not in code.
 */
export async function createQaOrderCheckout(
  qaOrderId: string,
  amountKurus: number,
  tierLabel: string,
): Promise<string> {
  if (!process.env.LEMONSQUEEZY_API_KEY || !process.env.LEMONSQUEEZY_STORE_ID) {
    console.warn("LemonSqueezy credentials missing. Generating mock checkout URL.");
    return `http://localhost:3000/mock-checkout?qaOrderId=${qaOrderId}&amount=${amountKurus}`;
  }

  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  if (!variantId) {
    throw new Error("LEMONSQUEEZY_VARIANT_ID is missing");
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              qa_tier_order_id: qaOrderId,
            },
          },
          custom_price: amountKurus,
          product_options: {
            name: `Lancerix QA — ${tierLabel}`,
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: process.env.LEMONSQUEEZY_STORE_ID,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LemonSqueezy error:", errorText);
    throw new Error("Ödeme linki oluşturulamadı.");
  }

  const result = await response.json();
  return result.data.attributes.url;
}
