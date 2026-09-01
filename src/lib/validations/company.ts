import { z } from "zod";

import { vknSchema } from "@/lib/validations/identity";

/**
 * An empty optional field arrives from a form as "", not as undefined, so each
 * one is normalised before validation. Mirrors profileSchema's optionalText.
 */
const optionalText = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v === "" ? null : v));

/**
 * The legal entity a B2B invoice is billed to. legalName is required so a
 * company can be told apart in the counterparty picker; vkn/taxOffice/address
 * end up printed on an invoice, which is only issued once escrow/e-fatura
 * (Faz 2) is active, so they are optional until then.
 */
export const companySchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(2, "Enter the registered company name.")
    .max(255, "That name is too long."),
  vkn: optionalText.nullable().refine(
    (v) => v === null || vknSchema.safeParse(v).success,
    "Enter a valid 10-digit VKN.",
  ),
  taxOffice: optionalText.nullable(),
  address: optionalText.nullable(),
});

export type CompanyInput = z.infer<typeof companySchema>;

/** What a company still has to supply before an invoice can be issued against it. */
export function invoicingBlockers(company: {
  vkn: string | null;
  tax_office: string | null;
  address: string | null;
}): string[] {
  const missing: string[] = [];
  if (!company.vkn) missing.push("VKN");
  if (!company.tax_office) missing.push("Vergi dairesi");
  if (!company.address) missing.push("Fatura adresi");
  return missing;
}
