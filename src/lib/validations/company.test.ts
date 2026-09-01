import { describe, expect, it } from "vitest";

import { companySchema, invoicingBlockers } from "@/lib/validations/company";

describe("companySchema", () => {
  it("accepts a company with only a legal name (Faz 1: no invoicing yet)", () => {
    const result = companySchema.safeParse({
      legalName: "Test Ticaret A.Ş.",
      vkn: "",
      taxOffice: "",
      address: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vkn).toBeNull();
      expect(result.data.taxOffice).toBeNull();
      expect(result.data.address).toBeNull();
    }
  });

  it("rejects a missing legal name", () => {
    const result = companySchema.safeParse({
      legalName: "",
      vkn: "",
      taxOffice: "",
      address: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a supplied VKN that fails the checksum", () => {
    const result = companySchema.safeParse({
      legalName: "Test Ticaret A.Ş.",
      vkn: "0810019243",
      taxOffice: "",
      address: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a fully-formed company (Faz 2: invoicing-ready)", () => {
    const result = companySchema.safeParse({
      legalName: "Test Ticaret A.Ş.",
      vkn: "0810019242",
      taxOffice: "Kadıköy",
      address: "İstanbul",
    });
    expect(result.success).toBe(true);
  });
});

describe("invoicingBlockers", () => {
  it("lists every missing invoicing field", () => {
    expect(
      invoicingBlockers({ vkn: null, tax_office: null, address: null }),
    ).toEqual(["VKN", "Vergi dairesi", "Fatura adresi"]);
  });

  it("is empty once all three are on file", () => {
    expect(
      invoicingBlockers({
        vkn: "0810019242",
        tax_office: "Kadıköy",
        address: "İstanbul",
      }),
    ).toEqual([]);
  });
});
