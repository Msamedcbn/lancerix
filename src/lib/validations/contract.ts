import { z } from "zod";

import { MIN_MILESTONE_GROSS_KURUS, parseTryToKurus } from "@/lib/escrow/money";

/**
 * A milestone amount is typed by a human in Turkish notation ("12.500,00"), so
 * it is parsed to kurus here rather than anywhere downstream. The floor mirrors
 * the Postgres check on milestones.gross_amount_kurus.
 */
const amountKurus = z
  .string()
  .trim()
  .min(1, "Enter an amount.")
  .transform((value, ctx) => {
    try {
      return parseTryToKurus(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "Enter an amount like 12.500,00." });
      return z.NEVER;
    }
  })
  .refine(
    (kurus) => kurus >= MIN_MILESTONE_GROSS_KURUS,
    `A milestone must be at least ${MIN_MILESTONE_GROSS_KURUS / 100} TRY.`,
  );

export const milestoneDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Describe the milestone.")
    .max(255, "That title is too long."),
  amount: amountKurus,
  dueDate: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine(
      (v) => v === null || !Number.isNaN(Date.parse(v)),
      "Enter a valid date.",
    ),
});

export const contractSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give the project a title.")
    .max(255, "That title is too long."),
  scopeOfWork: z
    .string()
    .trim()
    .min(20, "Describe what is being delivered, in at least a sentence."),
  clientEmail: z.email("Enter the client's email address."),
  companyId: z.uuid("Choose the company to invoice."),
  milestones: z
    .array(milestoneDraftSchema)
    .min(1, "A contract needs at least one milestone.")
    .max(20, "Twenty milestones is the limit."),
});

export type ContractInput = z.infer<typeof contractSchema>;
export type MilestoneDraft = z.infer<typeof milestoneDraftSchema>;
