import { z } from "zod";

import { tcknSchema, trIbanSchema } from "@/lib/validations/identity";

/**
 * An empty optional field arrives from a form as "", not as undefined, so each
 * one is normalised before validation. Without that a freelancer could never
 * clear an IBAN they had entered by mistake.
 */
const optionalText = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v === "" ? null : v));

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(160, "That name is too long."),
  // Required before a first payout, optional until then, so the account is
  // usable from the moment it is created.
  tckn: optionalText.nullable().refine(
    (v) => v === null || tcknSchema.safeParse(v).success,
    "Enter a valid 11-digit TCKN.",
  ),
  iban: optionalText.nullable().refine(
    (v) => v === null || trIbanSchema.safeParse(v.replace(/\s/g, "")).success,
    "Enter a valid Turkish IBAN (TR followed by 24 digits).",
  ),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/** What a freelancer still has to supply before money can be sent to them. */
export function payoutBlockers(profile: {
  tckn: string | null;
  iban: string | null;
}): string[] {
  const missing: string[] = [];
  if (!profile.tckn) missing.push("TCKN");
  if (!profile.iban) missing.push("IBAN");
  return missing;
}
