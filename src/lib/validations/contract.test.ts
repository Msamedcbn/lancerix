import { describe, expect, it } from "vitest";

import { contractSchema, phaseDraftSchema } from "@/lib/validations/contract";

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

describe("contractSchema (client identifier -- F-3 invite path)", () => {
  it("accepts an email invite in place of a public ID", () => {
    const { clientPublicId: _omitted, ...withoutId } = base;
    const result = contractSchema.safeParse({
      ...withoutId,
      clientEmail: "musteri@ornek.com",
      productType: "QA_ONLY",
      criteria: [criterion],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clientPublicId).toBe("");
      expect(result.data.clientEmail).toBe("musteri@ornek.com");
    }
  });

  it("lowercases the invite email so lookup/matching is case-insensitive at the source", () => {
    const { clientPublicId: _omitted, ...withoutId } = base;
    const result = contractSchema.safeParse({
      ...withoutId,
      clientEmail: "Musteri@Ornek.COM",
      productType: "QA_ONLY",
      criteria: [criterion],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.clientEmail).toBe("musteri@ornek.com");
  });

  it("rejects a malformed invite email", () => {
    const { clientPublicId: _omitted, ...withoutId } = base;
    const result = contractSchema.safeParse({
      ...withoutId,
      clientEmail: "not-an-email",
      productType: "QA_ONLY",
      criteria: [criterion],
    });
    expect(result.success).toBe(false);
  });

  it("rejects neither a public ID nor an email -- no way to address the client", () => {
    const { clientPublicId: _omitted, ...withoutId } = base;
    const result = contractSchema.safeParse({
      ...withoutId,
      productType: "QA_ONLY",
      criteria: [criterion],
    });
    expect(result.success).toBe(false);
  });

  it("rejects both a public ID and an email -- ambiguous which path to take", () => {
    const result = contractSchema.safeParse({
      ...base,
      clientEmail: "musteri@ornek.com",
      productType: "QA_ONLY",
      criteria: [criterion],
    });
    expect(result.success).toBe(false);
  });
});

describe("phaseDraftSchema (milestone dates + checklist items)", () => {
  const phase = {
    title: "Tasarım Onayı",
    description: "",
    startDate: "",
    endDate: "",
    items: [],
  };

  it("accepts a phase with no dates and no items -- both are optional", () => {
    const result = phaseDraftSchema.safeParse(phase);
    expect(result.success).toBe(true);
  });

  it("accepts a phase with a start and end date in order", () => {
    const result = phaseDraftSchema.safeParse({
      ...phase,
      startDate: "2026-09-05",
      endDate: "2026-09-12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = phaseDraftSchema.safeParse({
      ...phase,
      startDate: "2026-09-12",
      endDate: "2026-09-05",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an end date with no start date -- the pair check only fires when both are set", () => {
    const result = phaseDraftSchema.safeParse({
      ...phase,
      endDate: "2026-09-12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid date string", () => {
    const result = phaseDraftSchema.safeParse({
      ...phase,
      startDate: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("carries a checklist of item titles through", () => {
    const result = phaseDraftSchema.safeParse({
      ...phase,
      items: ["Renk paleti onayı", "Font seçimi"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.items).toEqual(["Renk paleti onayı", "Font seçimi"]);
  });

  it("rejects more than fifty items", () => {
    const result = phaseDraftSchema.safeParse({
      ...phase,
      items: Array.from({ length: 51 }, (_, i) => `Madde ${i}`),
    });
    expect(result.success).toBe(false);
  });
});
