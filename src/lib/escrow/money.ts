/**
 * Integer money. Every amount in this codebase is a whole number of kurus
 * (1/100 TRY) and every rate is basis points (1000 = 10.00%). Nothing here
 * touches a float, so the split is bit-identical to the Postgres generated
 * columns in supabase/migrations.
 *
 * The platform fee is charged to the CLIENT, on top of the freelancer's
 * contract amount -- it is not withheld from what the freelancer earns. See
 * docs/designs/pricing-client-pays-model.md for why.
 */

/**
 * 10.00% -- the standard platform fee, charged to the client on top of gross.
 * Matches the rate the incumbent Turkish invoicing rail charges for the same
 * client-pays structure, so it is a price the market is known to pay.
 */
export const DEFAULT_PLATFORM_FEE_BPS = 1000;

/**
 * The fee ceiling. A contract or a coupon may set a lower rate, never a higher
 * one. Mirrors the `check (platform_fee_bps between 0 and 1000)` constraints in
 * supabase/migrations.
 */
export const MAX_PLATFORM_FEE_BPS = 1000;

/**
 * 500,00 TRY. Below this a milestone is not worth an escrow cycle: the fee
 * rounds toward zero while the payment provider's cost per transaction does
 * not. Enforced at the input boundary by assertMilestoneGross() and in
 * Postgres by `check (gross_amount_kurus >= 50000)`.
 */
export const MIN_MILESTONE_GROSS_KURUS = 50_000;

export const BPS_DIVISOR = 10_000;

/**
 * ~90 trillion TRY. Above this, kurus values stop being exactly representable
 * as a JS number and must not round-trip through one.
 */
export const MAX_SAFE_KURUS = Number.MAX_SAFE_INTEGER;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

function assertKurus(amount: number, label: string): void {
  if (!Number.isSafeInteger(amount)) {
    throw new MoneyError(`${label} must be a safe integer kurus value, got ${amount}`);
  }
  if (amount < 0) {
    throw new MoneyError(`${label} must not be negative, got ${amount}`);
  }
}

function assertBps(bps: number, label: string): void {
  if (!Number.isInteger(bps) || bps < 0 || bps > BPS_DIVISOR) {
    throw new MoneyError(`${label} must be an integer between 0 and ${BPS_DIVISOR}, got ${bps}`);
  }
}

/**
 * Basis-point share of an amount, rounded half-up.
 *
 * The multiply happens in BigInt so it stays exact for amounts that would
 * overflow a double once scaled by the rate. Matches Postgres
 * `round(amount::numeric * bps / 10000)` exactly for non-negative amounts,
 * which is the only range this function accepts.
 */
export function applyBps(amount: number, bps: number): number {
  assertKurus(amount, "amount");
  assertBps(bps, "bps");

  const product = BigInt(amount) * BigInt(bps);
  const quotient = product / BigInt(BPS_DIVISOR);
  const remainder = product % BigInt(BPS_DIVISOR);
  // Half-up: promote when the remainder is at least half a unit.
  const rounded = remainder * 2n >= BigInt(BPS_DIVISOR) ? quotient + 1n : quotient;

  if (rounded > BigInt(MAX_SAFE_KURUS)) {
    throw new MoneyError(`result ${rounded} exceeds the safe integer range`);
  }
  return Number(rounded);
}

/**
 * Input-boundary guard for a milestone amount, mirroring the Postgres check.
 *
 * Kept out of computeEscrowSplit so the split stays pure arithmetic that can be
 * property-tested across the whole rounding space, including amounts far below
 * the commercial minimum.
 */
export function assertMilestoneGross(grossKurus: number): void {
  assertKurus(grossKurus, "grossKurus");
  if (grossKurus < MIN_MILESTONE_GROSS_KURUS) {
    throw new MoneyError(
      `a milestone must be at least ${MIN_MILESTONE_GROSS_KURUS} kurus, got ${grossKurus}`,
    );
  }
}

export type EscrowSplitInput = {
  grossKurus: number;
  platformFeeBps?: number;
  stopajBps: number;
};

export type EscrowSplit = {
  /**
   * The freelancer's contract amount, and the figure their SMM is issued for.
   * Nothing is deducted from it on the platform's behalf.
   */
  grossKurus: number;
  /** Platform service fee, added on top and invoiced to the client. */
  platformFeeKurus: number;
  /** Gross + fee. What the client actually funds into escrow. */
  clientChargeKurus: number;
  /** Stopaj withheld from the freelancer's gross and remitted to the tax office. */
  taxWithholdingKurus: number;
  /** What actually lands in the freelancer's bank account. */
  freelancerNetKurus: number;
};

/**
 * The single source of truth for how one milestone's money divides.
 *
 * The fee is added to the gross rather than taken out of it, and the net is
 * derived by subtraction rather than by a second percentage, so
 * `clientCharge - fee === gross` and `withholding + net === gross` hold
 * exactly -- no kurus is ever created or lost by rounding.
 */
export function computeEscrowSplit({
  grossKurus,
  platformFeeBps = DEFAULT_PLATFORM_FEE_BPS,
  stopajBps,
}: EscrowSplitInput): EscrowSplit {
  assertKurus(grossKurus, "grossKurus");
  if (grossKurus === 0) throw new MoneyError("grossKurus must be greater than zero");

  const platformFeeKurus = applyBps(grossKurus, platformFeeBps);

  // The one place this model adds rather than subtracts, so it is the one place
  // a total can grow past the safe range. Postgres raises on bigint overflow;
  // without this check JS would silently lose precision instead.
  const clientChargeKurus = grossKurus + platformFeeKurus;
  if (clientChargeKurus > MAX_SAFE_KURUS) {
    throw new MoneyError(
      `client charge ${grossKurus} + ${platformFeeKurus} exceeds the safe integer range`,
    );
  }

  const taxWithholdingKurus = applyBps(grossKurus, stopajBps);
  const freelancerNetKurus = grossKurus - taxWithholdingKurus;

  return {
    grossKurus,
    platformFeeKurus,
    clientChargeKurus,
    taxWithholdingKurus,
    freelancerNetKurus,
  };
}

/** Parses a Turkish-formatted amount ("1.234,56") into kurus. */
export function parseTryToKurus(input: string): number {
  const normalised = input.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalised)) {
    throw new MoneyError(`cannot parse "${input}" as a TRY amount`);
  }
  const [whole = "0", fraction = ""] = normalised.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function formatKurus(
  amountKurus: number,
  { currency = "TRY", locale = "tr-TR" } = {},
): string {
  assertKurus(amountKurus, "amountKurus");
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountKurus / 100);
}
