/**
 * The three currencies Lancerix prices in, shared between standalone
 * packages and monitoring plans (moved here 2026-09-09 so both modules
 * import one definition instead of each declaring their own -- exactly the
 * "second copy of the same numbers drifts out of sync" trap CLAUDE.md warns
 * about for QA_TIER_INFO).
 *
 * Prices are set per currency, NOT converted from one another -- regional
 * pricing is a willingness-to-pay decision, and TRY is volatile enough that
 * pegging the others to it would move the foreign prices every month
 * (2026-09-08 decision, src/lib/validations/monitoring.ts).
 *
 * Amounts everywhere they're paired with a SupportedCurrency are integers in
 * that currency's minor unit (kuruş, cent) -- the same convention
 * CLAUDE.md's money rules use for TRY, extended to the other two. This is
 * the one place the codebase holds non-TRY amounts: CLAUDE.md's "every
 * amount is an integer of kuruş" describes Faz 2's escrow ledger, which is
 * TRY-only and unaffected.
 */
export const SUPPORTED_CURRENCIES = ["TRY", "USD", "EUR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOL: Record<SupportedCurrency, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

/** Every price on the site is a whole number of major units today (₺199,
 * $19, ...) -- formats without decimals rather than rounding a genuinely
 * fractional amount, which this codebase has none of yet. */
export function formatMoney(minor: number, currency: SupportedCurrency): string {
  const major = minor / 100;
  return `${CURRENCY_SYMBOL[currency]}${major.toFixed(0)}`;
}
