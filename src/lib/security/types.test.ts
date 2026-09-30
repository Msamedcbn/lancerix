import { describe, expect, it } from "vitest";
import { calculateHealthScore, getGradeFromScore } from "./types";

describe("Security Types & Grading", () => {
  it("calculates 100 health score when no vulnerabilities exist", () => {
    const score = calculateHealthScore([]);
    expect(score).toBe(100);
    expect(getGradeFromScore(score).grade).toBe("A+");
  });

  it("reduces health score appropriately for critical and high vulnerabilities", () => {
    const score = calculateHealthScore([
      { severity: "CRITICAL" }, // -35
      { severity: "HIGH" }, // -20
    ]);
    expect(score).toBe(45);
    expect(getGradeFromScore(score).grade).toBe("D");
  });

  it("clamps score to 0 when many critical vulnerabilities are detected", () => {
    const score = calculateHealthScore([
      { severity: "CRITICAL" },
      { severity: "CRITICAL" },
      { severity: "CRITICAL" },
      { severity: "CRITICAL" },
    ]);
    expect(score).toBe(0);
    expect(getGradeFromScore(score).grade).toBe("F");
  });

  it("grades correctly for standard B, C, and A tiers", () => {
    expect(getGradeFromScore(85).grade).toBe("A");
    expect(getGradeFromScore(75).grade).toBe("B");
    expect(getGradeFromScore(65).grade).toBe("C");
  });
});
