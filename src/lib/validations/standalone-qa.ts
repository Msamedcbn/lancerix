import { z } from "zod";

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
 * 9900 kurus (99,00 TRY): same figure and reasoning as Tier 1's
 * "doğrulama kaydı ücreti" (20260903000003_tier1_record_fee.sql) -- the top
 * of the pre-approved 49-99₺ range, chosen because Polar's flat-fee-plus-
 * percentage erodes a small charge much more than a larger one. Not a
 * revenue target, a willingness-to-pay test, same as Tier 1's was.
 *
 * Also hardcoded in standalone_qa_orders_insert's RLS check constraint
 * (20260908020000_standalone_qa_orders_fee_check.sql) -- change both
 * together, or the insert will be rejected by the database.
 */
export const STANDALONE_CHECK_FEE_KURUS = 9900;

/**
 * A rolling-24h cap per requester, not a calendar-day cap -- avoids the
 * "use 5 at 11:59pm, get 5 more at midnight" gaming a fixed reset would
 * allow. Exists because this codepath has no contract relationship gating
 * who can reach it (every other QA tier requires a signed contract first);
 * each check launches a real headless Chromium process, real compute cost
 * with no revenue guarantee before payment.
 */
export const STANDALONE_DAILY_LIMIT = 5;

export const standaloneCheckSchema = z.object({
  targetUrl: z
    .string()
    .trim()
    .regex(/^https?:\/\/\S+$/, "http:// veya https:// ile başlayan bir adres gir."),
  checkType: z.enum(STANDALONE_CHECK_TYPES),
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
