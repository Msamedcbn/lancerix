import { z } from "zod";

import { STANDALONE_CHECK_TYPES } from "@/lib/validations/standalone-qa";

/**
 * Continuous monitoring: the same deterministic engine as a standalone check,
 * run on a schedule against sites the customer registered, with the customer
 * notified when a result CHANGES between runs.
 *
 * The change detection is the product, not the repetition. A subscription that
 * mails "still 2 violations" every week is unsubscribed by the third week; one
 * that mails "last night's deploy pushed LCP from 1.8s to 4.2s" is the reason
 * anyone pays monthly (2026-09-08 pricing discussion).
 */

/** How often a subscription's sites are re-scanned. Stored per subscription
 * rather than hardcoded so a plan's cadence is a data change, not a deploy. */
export const SCAN_CADENCES = ["WEEKLY", "MONTHLY"] as const;
export type ScanCadence = (typeof SCAN_CADENCES)[number];

export const CADENCE_DAYS: Record<ScanCadence, number> = {
  WEEKLY: 7,
  MONTHLY: 30,
};

export const MONITORING_PLAN_IDS = ["MONITORING", "AGENCY"] as const;
export type MonitoringPlanId = (typeof MONITORING_PLAN_IDS)[number];

/**
 * Prices are per currency, NOT converted from one another. Regional pricing is
 * a willingness-to-pay decision, and TRY is volatile enough that pegging the
 * others to it would move the foreign prices every month (2026-09-08).
 *
 * Amounts are integers in each currency's minor unit (kuruş, cent), the same
 * convention as standalone_qa_orders -- see CLAUDE.md on money. Note this is
 * the one place the codebase holds non-TRY amounts: the escrow rules in
 * CLAUDE.md ("every amount is an integer of kuruş") describe Faz 2's escrow
 * ledger, which is TRY-only and unaffected.
 */
export const SUPPORTED_CURRENCIES = ["TRY", "USD", "EUR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export type MonitoringPlan = {
  readonly label: string;
  /** How many sites the subscriber may register. */
  readonly siteLimit: number;
  readonly cadence: ScanCadence;
  /** Which checks run on every scheduled scan. Both plans run everything the
   * engine has: metering by module would make "what am I paying for" harder to
   * answer than metering by site count. */
  readonly modules: readonly (typeof STANDALONE_CHECK_TYPES)[number][];
  /** White-label reports + API access -- the agency plan's actual value, since
   * it does not buy more scanning per site than the tier below it. */
  readonly whiteLabel: boolean;
  readonly priceMinor: Record<SupportedCurrency, number>;
};

export const MONITORING_PLANS: Record<MonitoringPlanId, MonitoringPlan> = {
  MONITORING: {
    label: "İzleme",
    siteLimit: 3,
    cadence: "WEEKLY",
    modules: [...STANDALONE_CHECK_TYPES],
    whiteLabel: false,
    priceMinor: { TRY: 79900, USD: 7900, EUR: 7900 },
  },
  AGENCY: {
    label: "Ajans",
    siteLimit: 5,
    cadence: "WEEKLY",
    modules: [...STANDALONE_CHECK_TYPES],
    whiteLabel: true,
    priceMinor: { TRY: 350000, USD: 34900, EUR: 34900 },
  },
} as const;

export function monitoringPriceMinor(
  planId: MonitoringPlanId,
  currency: SupportedCurrency,
): number {
  return MONITORING_PLANS[planId].priceMinor[currency];
}

/** A subscription is only allowed to scan while it is ACTIVE. CANCELED keeps
 * the row (and its history) but stops every scheduled run -- the customer's
 * authorization to scan their sites ends with their subscription. */
export const SUBSCRIPTION_STATUSES = ["ACTIVE", "PAST_DUE", "CANCELED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const monitoredSiteSchema = z.object({
  targetUrl: z
    .string()
    .trim()
    .regex(/^https?:\/\/\S+$/, "http:// veya https:// ile başlayan bir adres gir."),
});

export type MonitoredSiteInput = z.infer<typeof monitoredSiteSchema>;

export const startMonitoringSchema = z.object({
  planId: z.enum(MONITORING_PLAN_IDS),
});

export type StartMonitoringInput = z.infer<typeof startMonitoringSchema>;
