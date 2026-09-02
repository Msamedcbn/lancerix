import { describe, expect, it } from "vitest";

import { contractSchema } from "@/lib/validations/contract";

const base = {
  projectCategory: "SOFTWARE",
  title: "Landing page redesign",
  scopeOfWork: "Redesign the marketing landing page and ship it.",
  projectAmount: "50.000,00",
  clientPublicId: "A3K9F2B1",
  companyId: "550e8400-e29b-41d4-a716-446655440000",
  plannedStartDate: "2026-09-05",
};

const criterion = {
  description: "Ana sayfa acilir ve hata vermez.",
};

describe("contractSchema (QA_ONLY)", () => {
  it("accepts a contract with at least one criterion and no milestones", () => {
    const result = contractSchema.safeParse({
      ...base,
      productType: "QA_ONLY",
      criteria: [criterion],
    });
    expect(result.success).toBe(true);
  });

  it("does not require a company, because a QA contract is not invoiced", () => {
    const result = contractSchema.safeParse({
      ...base,
      companyId: "",
      productType: "QA_ONLY",
      criteria: [criterion],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.companyId).toBeNull();
  });

  it("rejects a project category that is not one of the known kinds", () => {
    const result = contractSchema.safeParse({
      ...base,
      projectCategory: "ASTROLOGY",
      productType: "QA_ONLY",
      criteria: [criterion],
    });
    expect(result.success).toBe(false);
  });

  it("requires a project category -- it decides what delivery asks for", () => {
    const { projectCategory: _omitted, ...withoutCategory } = base;
    const result = contractSchema.safeParse({
      ...withoutCategory,
      productType: "QA_ONLY",
      criteria: [criterion],
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty criteria list -- the client fills these in, not the freelancer", () => {
    const result = contractSchema.safeParse({
      ...base,
      productType: "QA_ONLY",
      criteria: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a milestones field on a QA_ONLY contract", () => {
    const result = contractSchema.safeParse({
      ...base,
      productType: "QA_ONLY",
      milestones: [{ title: "Milestone 1", amount: "10.000,00", dueDate: "" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("contractSchema (QA_PLUS_ESCROW)", () => {
  it("accepts a contract with at least one milestone", () => {
    const result = contractSchema.safeParse({
      ...base,
      productType: "QA_PLUS_ESCROW",
      milestones: [{ title: "Milestone 1", amount: "10.000,00", dueDate: "" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty milestones list", () => {
    const result = contractSchema.safeParse({
      ...base,
      productType: "QA_PLUS_ESCROW",
      milestones: [],
    });
    expect(result.success).toBe(false);
  });

  it("does require a company, because escrow money is invoiced", () => {
    const result = contractSchema.safeParse({
      ...base,
      companyId: "",
      productType: "QA_PLUS_ESCROW",
      milestones: [{ title: "Milestone 1", amount: "10.000,00", dueDate: "" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("contractSchema (product type)", () => {
  it("rejects an unknown product type", () => {
    const result = contractSchema.safeParse({
      ...base,
      productType: "SOMETHING_ELSE",
      criteria: [criterion],
    });
    expect(result.success).toBe(false);
  });
});
