import { describe, expect, it } from "vitest";

import {
  applyBps,
  assertMilestoneGross,
  computeEscrowSplit,
  DEFAULT_PLATFORM_FEE_BPS,
  formatKurus,
  MAX_PLATFORM_FEE_BPS,
  MAX_SAFE_KURUS,
  MIN_MILESTONE_GROSS_KURUS,
  MoneyError,
  parseTryToKurus,
} from "@/lib/escrow/money";

describe("applyBps", () => {
  it("takes an exact percentage when it divides cleanly", () => {
    expect(applyBps(100_000, DEFAULT_PLATFORM_FEE_BPS)).toBe(10_000);
  });

  it("rounds half away from zero, matching Postgres round()", () => {
    // 5 kurus at 10% = 0.5 kurus -> 1 (half away from zero, not to even)
    expect(applyBps(5, 1000)).toBe(1);
    // 15 kurus at 10% = 1.5 kurus -> 2
    expect(applyBps(15, 1000)).toBe(2);
    // 25 kurus at 10% = 2.5 kurus -> 3
    expect(applyBps(25, 1000)).toBe(3);
    // 4 kurus at 10% = 0.4 kurus -> 0
    expect(applyBps(4, 1000)).toBe(0);
  });

  it("stays exact for amounts that would lose precision as a scaled double", () => {
    // 90 billion TRY in kurus; amount * bps overflows 2^53 if done in floats.
    const huge = 9_000_000_000_000;
    expect(applyBps(huge, 1000)).toBe(900_000_000_000);
  });

  it("rejects negative, fractional and out-of-range inputs", () => {
    expect(() => applyBps(-1, 1000)).toThrow(MoneyError);
    expect(() => applyBps(10.5, 1000)).toThrow(MoneyError);
    expect(() => applyBps(100, 10_001)).toThrow(MoneyError);
    expect(() => applyBps(100, -1)).toThrow(MoneyError);
  });
});

describe("computeEscrowSplit", () => {
  it("adds the fee on top of the gross at the default 10% rate", () => {
    // 10.000,00 TRY contract amount, 20% stopaj.
    const split = computeEscrowSplit({ grossKurus: 1_000_000, stopajBps: 2000 });

    expect(split).toEqual({
      grossKurus: 1_000_000,
      platformFeeKurus: 100_000,
      clientChargeKurus: 1_100_000,
      taxWithholdingKurus: 200_000,
      freelancerNetKurus: 800_000,
    });
  });

  it("leaves the freelancer's gross untouched by the platform fee", () => {
    const withFee = computeEscrowSplit({ grossKurus: 1_000_000, stopajBps: 2000 });
    const withoutFee = computeEscrowSplit({
      grossKurus: 1_000_000,
      platformFeeBps: 0,
      stopajBps: 2000,
    });

    // The fee changes what the client pays and nothing else.
    expect(withFee.freelancerNetKurus).toBe(withoutFee.freelancerNetKurus);
    expect(withFee.taxWithholdingKurus).toBe(withoutFee.taxWithholdingKurus);
    expect(withFee.clientChargeKurus).toBeGreaterThan(withoutFee.clientChargeKurus);
  });

  it("withholds stopaj from the full contract amount, not from gross minus fee", () => {
    const split = computeEscrowSplit({ grossKurus: 1_000_000, stopajBps: 2000 });
    // 20% of 1.000.000, which is the figure the SMM is issued for.
    expect(split.taxWithholdingKurus).toBe(200_000);
    // What the old fee-out-of-gross model would have withheld: 20% of 900.000.
    expect(split.taxWithholdingKurus).not.toBe(180_000);
  });

  it("honours a coupon-reduced fee rate", () => {
    const split = computeEscrowSplit({
      grossKurus: 1_000_000,
      platformFeeBps: 300,
      stopajBps: 2000,
    });
    expect(split.platformFeeKurus).toBe(30_000);
    expect(split.clientChargeKurus).toBe(1_030_000);
    // A cheaper rate discounts the client, never the freelancer.
    expect(split.freelancerNetKurus).toBe(800_000);
  });

  it("never creates or loses a kurus, across the whole rounding space", () => {
    for (let gross = 1; gross <= 5_000; gross += 1) {
      const split = computeEscrowSplit({ grossKurus: gross, stopajBps: 2000 });

      expect(split.clientChargeKurus - split.platformFeeKurus).toBe(gross);
      expect(split.taxWithholdingKurus + split.freelancerNetKurus).toBe(gross);
      expect(split.freelancerNetKurus).toBeGreaterThanOrEqual(0);
      expect(split.clientChargeKurus).toBeGreaterThanOrEqual(gross);
    }
  });

  it("holds the identity across every legal fee rate at a fixed amount", () => {
    for (let bps = 0; bps <= MAX_PLATFORM_FEE_BPS; bps += 1) {
      const split = computeEscrowSplit({
        grossKurus: 1_234_567,
        platformFeeBps: bps,
        stopajBps: 2000,
      });
      expect(split.clientChargeKurus - split.platformFeeKurus).toBe(1_234_567);
      expect(split.taxWithholdingKurus + split.freelancerNetKurus).toBe(1_234_567);
    }
  });

  it("holds the identity at a 0% fee and a 0% stopaj", () => {
    const split = computeEscrowSplit({
      grossKurus: 12_345,
      platformFeeBps: 0,
      stopajBps: 0,
    });
    expect(split.platformFeeKurus).toBe(0);
    expect(split.clientChargeKurus).toBe(12_345);
    expect(split.freelancerNetKurus).toBe(12_345);
  });

  it("rejects a zero or negative contract amount", () => {
    expect(() => computeEscrowSplit({ grossKurus: 0, stopajBps: 2000 })).toThrow(MoneyError);
    expect(() => computeEscrowSplit({ grossKurus: -100, stopajBps: 2000 })).toThrow(MoneyError);
  });

  it("refuses to overflow when the fee pushes the total past the safe range", () => {
    // applyBps itself still fits; it is the addition that does not.
    expect(() =>
      computeEscrowSplit({ grossKurus: MAX_SAFE_KURUS, platformFeeBps: 1000, stopajBps: 2000 }),
    ).toThrow(MoneyError);
  });
});

describe("assertMilestoneGross", () => {
  it("accepts the minimum and anything above it", () => {
    expect(() => assertMilestoneGross(MIN_MILESTONE_GROSS_KURUS)).not.toThrow();
    expect(() => assertMilestoneGross(1_000_000)).not.toThrow();
  });

  it("rejects amounts below the minimum, including the zero-fee range", () => {
    expect(() => assertMilestoneGross(MIN_MILESTONE_GROSS_KURUS - 1)).toThrow(MoneyError);
    // 4 kurus at 10% rounds to a zero fee -- exactly what the minimum prevents.
    expect(() => assertMilestoneGross(4)).toThrow(MoneyError);
    expect(() => assertMilestoneGross(0)).toThrow(MoneyError);
  });

  it("rejects fractional and negative amounts", () => {
    expect(() => assertMilestoneGross(50_000.5)).toThrow(MoneyError);
    expect(() => assertMilestoneGross(-1)).toThrow(MoneyError);
  });
});

describe("parseTryToKurus", () => {
  it("parses Turkish thousands separators and decimal commas", () => {
    expect(parseTryToKurus("1.234,56")).toBe(123_456);
    expect(parseTryToKurus("10.000")).toBe(1_000_000);
    expect(parseTryToKurus("0,05")).toBe(5);
    expect(parseTryToKurus("7,5")).toBe(750);
  });

  it("rejects anything with sub-kurus precision or stray characters", () => {
    expect(() => parseTryToKurus("1,234")).toThrow(MoneyError);
    expect(() => parseTryToKurus("abc")).toThrow(MoneyError);
    expect(() => parseTryToKurus("")).toThrow(MoneyError);
  });
});

describe("formatKurus", () => {
  it("renders kurus back as a TRY string", () => {
    // Normalise the non-breaking spaces Intl inserts.
    expect(formatKurus(123_456).replace(/ /g, " ")).toContain("1.234,56");
  });
});
