import { z } from "zod";

/**
 * Acceptance criteria are now free-text descriptions.
 *
 * Every job is unique — constraining criteria to preset categories like
 * HTTP_STATUS or FORM_SUBMIT doesn't work for non-web projects (e.g.
 * social media management, graphic design, consulting).
 *
 * The freelancer writes what needs to be verified in plain language.
 * Both parties read and agree on these descriptions in the signed contract.
 *
 * When QA testing is purchased, the platform (Lancerix) decides how to
 * verify each criterion — the freelancer doesn't need to know the technical
 * method.
 */

export const criterionDraftSchema = z.object({
  description: z
    .string()
    .trim()
    .min(5, "Kriteri biraz daha somutlaştır.")
    .max(1000, "Bu kriter çok uzun."),
});

export type CriterionDraft = z.infer<typeof criterionDraftSchema>;

/**
 * Kept for backward compatibility with existing stored criteria.
 * New criteria always use check_type = 'MANUAL' and check_config = {}.
 */
export function toCheckConfig(_draft: CriterionDraft): Record<string, string> {
  return {};
}

/**
 * Describe a stored criterion for display. With free-text criteria,
 * the description IS the whole story.
 */
export function describeCheck(
  _checkType: string,
  _config: unknown,
): string | null {
  return null;
}
