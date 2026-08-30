import { z } from "zod";

import { vknSchema } from "@/lib/validations/identity";

/**
 * The legal entity a B2B invoice is billed to. Every field here ends up printed
 * on that invoice, which is why none of them are optional.
 */
export const companySchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(2, "Enter the registered company name.")
    .max(255, "That name is too long."),
  vkn: vknSchema,
  taxOffice: z.string().trim().min(2, "Enter the tax office."),
  address: z.string().trim().min(10, "Enter the full billing address."),
});

export type CompanyInput = z.infer<typeof companySchema>;
