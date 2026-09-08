import { z } from "zod";

import type { SupportedCurrency } from "@/lib/validations/currency";

/**
 * A contract-free check: just a URL, no acceptance_criteria, no
 * counterparty. Seven check types as of 2026-09-08
 * (20260908050000_standalone_qa_orders_add_modules.sql), every one
 * deterministic and zero-LLM-cost -- see src/lib/qa/standalone.ts for the
 * actual scan implementations. INTERACTION_SCAN is a generic
 * fill-forms/click-buttons/watch-console-errors smoke test, deliberately
 * NOT called "Agentic QA" anywhere in copy -- it reads nothing about a
 * project's specific acceptance criteria (there are none, this is the
 * contract-free side), unlike the real LLM-driven Tier2.
 */
export const STANDALONE_CHECK_TYPES = [
  "ACCESSIBILITY",
  "PERFORMANCE",
  "SEO_META",
  "VISUAL_OVERFLOW",
  "DEAD_LINKS",
  "FORM_VALIDATION",
  "INTERACTION_SCAN",
] as const;
export type StandaloneCheckType = (typeof STANDALONE_CHECK_TYPES)[number];

/**
 * Three curated packages, each a bundle of the check types above.
 *
 * BASIC  → the three checks with the highest standalone signal-to-noise:
 *           Accessibility (WCAG compliance is a legal/contractual concern),
 *           SEO & Meta (first thing a client notices in Google results), and
 *           Dead Links (broken links are an objective, embarrassing defect).
 *
 * PRO    → BASIC plus the two checks a professional delivery should pass:
 *           Performance (Core Web Vitals) and Visual Overflow (responsive
 *           breakpoints).
 *
 * FULL   → every check the platform can run -- adds the two interaction-
 *           level checks (Form Validation + Interaction Scan) that need a
 *           real headless browser clicking through the page.
 *
 * Fee is in kuruş, same minor-unit convention every other money column in
 * this codebase uses (see qa_tier_orders.fee_kurus, CLAUDE.md).
 *
 * Also hardcoded in standalone_qa_orders_insert's RLS check constraint
 * (20260908060000_standalone_packages.sql) -- change both together, or the
 * insert will be rejected by the database.
 */
export const STANDALONE_PACKAGE_IDS = ["BASIC", "PRO", "FULL"] as const;
export type StandalonePackageId = (typeof STANDALONE_PACKAGE_IDS)[number];

export const STANDALONE_PACKAGES: Record<
  StandalonePackageId,
  {
    readonly modules: readonly StandaloneCheckType[];
    /** The TRY price, in kuruş -- what standalone_qa_orders.fee_kurus stores
     * for this package regardless of which currency Polar actually billed
     * the customer in. Always equal to priceMinor.TRY; kept as its own field
     * because every existing caller (packageFeeKurus, the RLS fee_check
     * policy) reads it, not priceMinor. */
    readonly feeKurus: number;
    readonly label: string;
    /** TRY/USD/EUR prices, matching the fixed prices set on this package's
     * own Polar product (POLAR_PRODUCT_BASIC/PRO/FULL, 2026-09-09) exactly --
     * this is what a visitor sees on the site, so it must never drift from
     * what checkout actually charges. */
    readonly priceMinor: Record<SupportedCurrency, number>;
  }
> = {
  BASIC: {
    modules: ["ACCESSIBILITY", "SEO_META", "DEAD_LINKS"],
    feeKurus: 19900,
    label: "Temel Kontrol",
    priceMinor: { TRY: 19900, USD: 1900, EUR: 1900 },
  },
  PRO: {
    modules: ["ACCESSIBILITY", "SEO_META", "DEAD_LINKS", "PERFORMANCE", "VISUAL_OVERFLOW"],
    feeKurus: 34900,
    label: "Profesyonel",
    priceMinor: { TRY: 34900, USD: 2900, EUR: 2900 },
  },
  FULL: {
    modules: [...STANDALONE_CHECK_TYPES],
    feeKurus: 44900,
    label: "Tam Tarama",
    priceMinor: { TRY: 44900, USD: 3900, EUR: 3900 },
  },
} as const;

/** Resolve the fee for a given package -- single source of truth. */
export function packageFeeKurus(packageId: StandalonePackageId): number {
  return STANDALONE_PACKAGES[packageId].feeKurus;
}

/**
 * A rolling-24h cap per requester, not a calendar-day cap -- avoids the
 * "use 5 at 11:59pm, get 5 more at midnight" gaming a fixed reset would
 * allow. Exists because this codepath has no contract relationship gating
 * who can reach it (every other QA tier requires a signed contract first);
 * each check launches a real headless Chromium process, real compute cost
 * with no revenue guarantee before payment.
 */
export const STANDALONE_DAILY_LIMIT = 5;

/**
 * How many times one module may be run for a single order, first attempt
 * included. A module whose latest row is ERROR earns the customer a free
 * re-scan (2026-09-08 pricing decision: a scan that could not run is not
 * billed as delivered, and the remedy is re-running it, not a refund) --
 * but the retry launches a real headless Chromium against the same URL at
 * our cost, with no new revenue, so it cannot be unbounded. Three attempts
 * separates a transient failure (a timeout, a slow origin) from a target
 * this engine simply cannot scan, which no amount of retrying fixes.
 */
export const STANDALONE_MODULE_MAX_ATTEMPTS = 3;

export const standaloneCheckSchema = z.object({
  targetUrl: z
    .string()
    .trim()
    .regex(/^https?:\/\/\S+$/, "http:// veya https:// ile başlayan bir adres gir."),
  packageId: z.enum(STANDALONE_PACKAGE_IDS),
});

export type StandaloneCheckInput = z.infer<typeof standaloneCheckSchema>;

/**
 * The homepage self-serve form (marketing-actions.ts): pay for a check
 * without an existing account -- email+password create the account in the
 * same request, same password rule as registerSchema
 * (src/lib/validations/auth.ts). Kept as its own schema rather than
 * `standaloneCheckSchema.extend(...)` so this file doesn't have to import
 * from auth.ts for one shared rule.
 */
export const standaloneMarketingPurchaseSchema = standaloneCheckSchema.extend({
  email: z.email(),
  password: z.string().min(8, "Parola en az 8 karakter olmalı."),
});

export type StandaloneMarketingPurchaseInput = z.infer<typeof standaloneMarketingPurchaseSchema>;
