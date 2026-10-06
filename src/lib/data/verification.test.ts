import { describe, expect, it } from "vitest";
import { SHOWCASE_KUYUMCU_DATA, getPublicVerificationRecord } from "./verification";

describe("Public Verification & 85K Showcase Record", () => {
  it("contains complete 85.000 TL jewelry dispute dataset with legal basis", () => {
    expect(SHOWCASE_KUYUMCU_DATA.reference).toBe("LCX-2026-85000-KUYUMCU");
    expect(SHOWCASE_KUYUMCU_DATA.projectAmountKurus).toBe(8500000);
    expect(SHOWCASE_KUYUMCU_DATA.status).toBe("ACCEPTED");
    expect(SHOWCASE_KUYUMCU_DATA.isTacitlyAccepted).toBe(true);
    expect(SHOWCASE_KUYUMCU_DATA.legalBasis).toContain("TBK m. 477");
    expect(SHOWCASE_KUYUMCU_DATA.legalBasis).toContain("HMK m. 193");
  });

  it("includes ProofGuard prober compliance metrics matching contract specs", () => {
    const { proofGuard } = SHOWCASE_KUYUMCU_DATA;
    expect(proofGuard.httpStatus).toBe(200);
    expect(proofGuard.latencyMs).toBeLessThanOrEqual(250);
    expect(proofGuard.tlsVersion).toContain("TLS 1.3");
    expect(proofGuard.uptimePassed).toBe(true);
  });

  it("contains all 4 acceptance criteria presets", () => {
    expect(SHOWCASE_KUYUMCU_DATA.criteria.length).toBe(4);
    const titles = SHOWCASE_KUYUMCU_DATA.criteria.map((c) => c.title);
    expect(titles.some((t) => t.includes("Altın & Döviz"))).toBe(true);
    expect(titles.some((t) => t.includes("MASAK"))).toBe(true);
  });

  it("resolves showcase record for both exact and alias references", async () => {
    const byRef = await getPublicVerificationRecord("LCX-2026-85000-KUYUMCU");
    expect(byRef).not.toBeNull();
    expect(byRef?.reference).toBe("LCX-2026-85000-KUYUMCU");

    const byAlias = await getPublicVerificationRecord("ornek-kuyumcu-85k");
    expect(byAlias).not.toBeNull();
    expect(byAlias?.projectAmountKurus).toBe(8500000);
  });
});
