import "server-only";

import type { SupportedCurrency } from "@/lib/validations/currency";

/** ISO 3166-1 alpha-2 codes of the EU's 27 members -- the set that prices in
 * euros regardless of the visitor's language. */
const EURO_ZONE_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

/**
 * Guesses a visitor's currency from Accept-Language when there is no IP
 * geolocation to go on (local dev, or a host that does not set Vercel's geo
 * headers). A language tag is a weaker signal than a country -- "tr" could be
 * a Turkish speaker anywhere -- so this is the fallback, not the primary
 * check in resolveVisitorCurrency() below.
 */
function currencyFromAcceptLanguage(acceptLanguage: string | null): SupportedCurrency {
  if (!acceptLanguage) return "TRY";
  const lower = acceptLanguage.toLowerCase();
  if (lower.startsWith("tr")) return "TRY";
  if (/^(de|fr|es|it|nl|pt|fi|el|et|lv|lt|sk|sl|ga|mt)/.test(lower)) return "EUR";
  return "USD";
}

/**
 * A visitor's likely billing/display currency, best-effort.
 *
 * `x-vercel-ip-country` (set by Vercel's edge network on every request in
 * production and preview; absent in local dev) is the primary signal --
 * an IP-derived country is a much stronger indicator than the language the
 * browser happens to be configured in. Accept-Language is the fallback for
 * local dev and any host that does not set the geo header.
 *
 * This is a display default, never a charge: Polar decides what the
 * customer actually pays from its own IP lookup at checkout
 * (customerIpAddress, passed separately) and the per-currency prices on the
 * product. A wrong guess here only shows the wrong symbol before checkout,
 * which is why every caller pairs this with a visible way to correct it
 * (CurrencySwitcher) rather than trusting the guess silently.
 */
export function resolveVisitorCurrency(headers: Headers): SupportedCurrency {
  const country = headers.get("x-vercel-ip-country");
  if (country) {
    if (country === "TR") return "TRY";
    if (EURO_ZONE_COUNTRIES.has(country)) return "EUR";
    return "USD";
  }
  return currencyFromAcceptLanguage(headers.get("accept-language"));
}
