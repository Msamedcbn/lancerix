"use client";

import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOL, type SupportedCurrency } from "@/lib/validations/currency";

/**
 * Three small pills (₺ / $ / €) next to a currency-aware price display.
 *
 * The page picks a default from resolveVisitorCurrency() (IP country, best
 * effort), but that guess is wrong for a VPN, a traveler, or a Turk paying
 * from abroad -- this is the correction, not decoration. It only ever
 * changes what the page *shows*; the actual charge is still whatever Polar's
 * own IP lookup decides at checkout.
 */
export function CurrencySwitcher({
  currency,
  onChange,
  className = "",
}: Readonly<{
  currency: SupportedCurrency;
  onChange: (currency: SupportedCurrency) => void;
  className?: string;
}>) {
  return (
    <div
      role="group"
      aria-label="Para birimi"
      className={`inline-flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 ${className}`}
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={currency === c}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            currency === c
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {CURRENCY_SYMBOL[c]} {c}
        </button>
      ))}
    </div>
  );
}
