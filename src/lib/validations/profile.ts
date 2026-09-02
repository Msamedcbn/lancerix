import { z } from "zod";

import { tcknSchema, trIbanSchema } from "@/lib/validations/identity";
import { servicesSchema } from "@/lib/validations/services";

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

/**
 * The public half of a profile: what a counterparty reads before deciding to
 * work with someone. Separate from profileSchema because these fields have a
 * different audience and a different risk -- getting an IBAN wrong stops a
 * payout, getting a bio wrong is just a bio.
 */
export const publicProfileSchema = z.object({
  headline: optionalText
    .nullable()
    .refine(
      (v) => v === null || (v.length >= 2 && v.length <= 120),
      "Başlık 2-120 karakter arasında olmalı.",
    ),
  bio: optionalText
    .nullable()
    .refine((v) => v === null || v.length <= 2000, "Bu tanıtım çok uzun."),
  location: optionalText
    .nullable()
    .refine((v) => v === null || v.length <= 120, "Konum çok uzun."),
  websiteUrl: optionalText
    .nullable()
    .refine(
      (v) => v === null || /^https?:\/\/\S+$/.test(v),
      "Adres http:// veya https:// ile başlamalı.",
    ),
  // Comma-separated in the form, an array in the column. Capped so the tag
  // list stays a summary rather than a keyword dump.
  skills: z
    .string()
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  // Structured, catalog-backed alternative to skills -- see services.ts.
  services: servicesSchema,
});

export type PublicProfileInput = z.infer<typeof publicProfileSchema>;

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
