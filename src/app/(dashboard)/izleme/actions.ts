"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { FAIL, firstIssue, OK, toUserMessage, type FormState } from "@/lib/forms";
import { createMonitoringCheckout, payViaPolarCheckout } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";
import {
  MONITORING_PLANS,
  monitoredSiteSchema,
  startMonitoringSchema,
  type SupportedCurrency,
} from "@/lib/validations/monitoring";

export type { FormState };

/**
 * Which currency a subscriber is billed in.
 *
 * Recorded here for our own reporting only -- Polar decides what the customer
 * actually pays, from the per-currency prices on the product and the buyer's
 * region (2026-09-08 regional pricing decision). Deriving it from a header is
 * a hint, not a source of truth, which is why the amount stored alongside it
 * is corrected from the webhook if Polar priced it differently.
 */
function currencyFromLocaleHint(hint: string | null): SupportedCurrency {
  if (!hint) return "TRY";
  const lower = hint.toLowerCase();
  if (lower.startsWith("tr")) return "TRY";
  if (/^(de|fr|es|it|nl|pt|fi|el|et|lv|lt|sk|sl|ga|mt)/.test(lower)) return "EUR";
  return "USD";
}

/**
 * Starts a monitoring subscription: writes the row, then hands off to Polar.
 *
 * Same pay-first shape as the one-off checks -- the row exists before payment
 * so the webhook has something to attach the Polar subscription to, and it
 * starts CANCELED-equivalent in effect: status only becomes meaningful once
 * subscription.active arrives. Until then no scan runs, because both
 * dueSiteIds() and runMonitoringScan() require ACTIVE.
 */
export async function startMonitoring(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();

  const parsed = startMonitoringSchema.safeParse({ planId: formData.get("planId") });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const plan = MONITORING_PLANS[parsed.data.planId];
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("monitoring_subscriptions")
    .select("id")
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();
  if (existing) return FAIL("Zaten aktif bir izleme aboneliğin var.");

  const { headers } = await import("next/headers");
  const h = await headers();
  const currency = currencyFromLocaleHint(h.get("accept-language"));

  const { data: subscription, error } = await supabase
    .from("monitoring_subscriptions")
    .insert({
      subscriber_id: session.userId,
      plan_id: parsed.data.planId,
      cadence: plan.cadence,
      currency,
      price_minor: plan.priceMinor[currency],
      site_limit: plan.siteLimit,
      status: "PAST_DUE",
    })
    .select("id")
    .single();

  if (error || !subscription) {
    return FAIL(toUserMessage(error ?? { message: "insert failed" }, "Abonelik başlatılamadı."));
  }

  revalidatePath("/izleme");

  return payViaPolarCheckout((customerIp) =>
    createMonitoringCheckout(subscription.id, parsed.data.planId, customerIp),
  );
}

/**
 * Registers a URL to watch.
 *
 * The plan's site limit and the subscription's ACTIVE status are both enforced
 * by the monitored_sites_insert policy, not here: this action is one caller,
 * the policy is the boundary. A rejected insert surfaces as a generic failure
 * rather than leaking which rule stopped it.
 */
export async function addMonitoredSite(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();

  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  if (!subscriptionId) return FAIL("Abonelik eksik.");

  const parsed = monitoredSiteSchema.safeParse({ targetUrl: formData.get("targetUrl") });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.from("monitored_sites").insert({
    subscription_id: subscriptionId,
    target_url: parsed.data.targetUrl,
  });

  if (error) {
    return FAIL(toUserMessage(error, "Site eklenemedi. Plan limitini doldurmuş olabilirsin."));
  }

  revalidatePath("/izleme");
  return OK("Site eklendi. İlk tarama en geç yarın çalışır.");
}

/** Soft-removes a site: its scan history stays readable, and it stops being
 * picked up by the scheduler. */
export async function removeMonitoredSite(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();

  const siteId = String(formData.get("siteId") ?? "");
  if (!siteId) return FAIL("Site eksik.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("monitored_sites")
    .update({ removed_at: new Date().toISOString() })
    .eq("id", siteId);

  if (error) return FAIL(toUserMessage(error, "Site kaldırılamadı."));

  revalidatePath("/izleme");
  return OK("Site izlemeden çıkarıldı.");
}
