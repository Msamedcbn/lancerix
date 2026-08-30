/**
 * Turkish withholding (stopaj) and VAT (KDV) arithmetic.
 *
 * The rates below are the ones that normally apply to serbest meslek
 * (self-employed professional) income, but they are policy inputs, not
 * constants of the system: a contract snapshots the rate in force when it is
 * drawn up and keeps using it. Confirm current rates with an accountant before
 * going live -- this module only guarantees the arithmetic.
 */
import { applyBps } from "@/lib/escrow/money";

/** 20.00% income tax withheld at source by the paying company. */
export const DEFAULT_STOPAJ_BPS = 2000;

/** 20.00% KDV. Charged on top of the invoice, not withheld from it. */
export const DEFAULT_VAT_BPS = 2000;

export type WithholdingBreakdown = {
  /** The amount the freelancer invoices, before withholding. */
  grossKurus: number;
  /** Withheld by the client and remitted to the tax office on the freelancer's behalf. */
  withholdingKurus: number;
  /** Paid to the freelancer. */
  netKurus: number;
};

/**
 * Stopaj is withheld from the freelancer's contract amount -- the figure the
 * SMM is issued for. The platform fee sits on top of that amount and is
 * charged to the client, so it never enters this base.
 */
export function computeWithholding(
  grossKurus: number,
  stopajBps: number = DEFAULT_STOPAJ_BPS,
): WithholdingBreakdown {
  const withholdingKurus = applyBps(grossKurus, stopajBps);
  return {
    grossKurus,
    withholdingKurus,
    netKurus: grossKurus - withholdingKurus,
  };
}

export type VatBreakdown = {
  netKurus: number;
  vatKurus: number;
  totalKurus: number;
};

/** KDV added on top of a net invoice line. */
export function addVat(
  netKurus: number,
  vatBps: number = DEFAULT_VAT_BPS,
): VatBreakdown {
  const vatKurus = applyBps(netKurus, vatBps);
  return { netKurus, vatKurus, totalKurus: netKurus + vatKurus };
}

/**
 * Splits a VAT-inclusive total back out. The net is derived by subtraction so
 * `net + vat === total` always holds, even where the reverse percentage would
 * round to a different kurus.
 */
export function extractVat(
  totalKurus: number,
  vatBps: number = DEFAULT_VAT_BPS,
): VatBreakdown {
  const netKurus = applyBps(totalKurus, Math.round((10_000 * 10_000) / (10_000 + vatBps)));
  return { netKurus, vatKurus: totalKurus - netKurus, totalKurus };
}
