import { z } from "zod";

import { criterionDraftSchema } from "@/lib/validations/acceptance-criteria";
import { projectCategorySchema } from "@/lib/validations/project-category";
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

/**
 * Mirrors the default on contracts.objection_window_days
 * (supabase/migrations/20260830210000_signing_and_objection_clock.sql).
 * Only used to render a preview before the row exists; once it does, the
 * value on the row is the one that counts.
 *
 * The Hobby-plan crons that close this window (expire-objections,
 * expire-deliveries) only run once a day and can fire anywhere in the
 * scheduled hour, so a window can run ~1-2 days over in the worst case.
 * A default this size safely absorbs that; do not drop it much below this
 * without also tightening the cron schedule (needs a Pro plan) or accepting
 * that a short window's real deadline is fuzzier than its label says.
 */
export const DEFAULT_OBJECTION_WINDOW_DAYS = 5;

/** Workflow phase draft — freelancer defines project phases during contract creation */
export const phaseDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Faz başlığı en az 3 karakter olmalı.")
    .max(255, "Bu başlık çok uzun."),
  description: z
    .string()
    .trim()
    .max(1000, "Açıklama çok uzun.")
    .optional()
    .default(""),
  estimatedDays: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .nullable()
    .refine(
      (v) => v === null || (Number.isInteger(v) && v > 0),
      "Geçerli bir gün sayısı gir.",
    ),
});

const baseContractFields = {
  projectCategory: projectCategorySchema,
  title: z
    .string()
    .trim()
    .min(3, "Projeye bir başlık ver.")
    .max(255, "Bu başlık çok uzun."),
  scopeOfWork: z
    .string()
    .trim()
    .min(20, "Ne teslim edileceğini en az bir cümleyle anlat."),
  projectAmount: amountKurus,
  /** Now uses public_id instead of email */
  clientPublicId: z
    .string()
    .trim()
    .min(1, "Müşterinin Lancerix ID'sini gir."),
  // Optional because a QA_ONLY contract is not invoiced, and because the client
  // may not have registered yet. Required in practice only once e-invoicing is live.
  companyId: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine(
      (v) => v === null || z.uuid().safeParse(v).success,
      "Fatura edilecek şirketi seç.",
    ),
  /** Planned start date — both parties must confirm before work begins */
  plannedStartDate: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine(
      (v) => v === null || !Number.isNaN(Date.parse(v)),
      "Geçerli bir tarih gir.",
    ),
};

/**
 * QA_ONLY: free-text criteria + optional workflow phases.
 * QA_PLUS_ESCROW: milestones (Faz 2, disabled).
 */
export const contractSchema = z.discriminatedUnion("productType", [
  z.object({
    productType: z.literal("QA_ONLY"),
    ...baseContractFields,
    // The freelancer no longer writes these -- the client fills them in
    // (addAcceptanceCriteria) before signing. See criteriaSubmissionSchema.
    criteria: z
      .array(criterionDraftSchema)
      .max(50, "Elli kriter sınırı var.")
      .optional()
      .default([]),
    phases: z
      .array(phaseDraftSchema)
      .max(30, "Otuz faz sınırı var.")
      .optional()
      .default([]),
  })
    // Extra keys are rejected rather than silently stripped: with criteria
    // now optional, a stray `milestones` payload would otherwise validate
    // fine as a QA_ONLY contract instead of surfacing as an error.
    .strict(),
  z
    .object({
      productType: z.literal("QA_PLUS_ESCROW"),
      ...baseContractFields,
      milestones: z
        .array(milestoneDraftSchema)
        .min(1, "Sözleşmede en az bir aşama olmalı.")
        .max(20, "Yirmi aşama sınırı var."),
    })
    .refine(
      (v) => v.companyId !== null,
      { message: "Fatura edilecek şirketi seç.", path: ["companyId"] },
    ),
]);

/**
 * The client's own submission: at least one criterion, since this is the
 * only place acceptance_criteria rows get written for a QA_ONLY contract now.
 */
export const criteriaSubmissionSchema = z
  .array(criterionDraftSchema)
  .min(1, "En az bir kabul kriteri gir.")
  .max(50, "Elli kriter sınırı var.");

export type ContractInput = z.infer<typeof contractSchema>;
export type MilestoneDraft = z.infer<typeof milestoneDraftSchema>;
export type PhaseDraft = z.infer<typeof phaseDraftSchema>;
