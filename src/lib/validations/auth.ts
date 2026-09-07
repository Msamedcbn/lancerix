import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

/**
 * Mirrors the CHECK constraint on profiles.referral_source
 * (20260907000000_signup_referral_source.sql) -- change one, change both.
 */
export const REFERRAL_SOURCES = [
  "GOOGLE",
  "SOCIAL_MEDIA",
  "FRIEND_REFERRAL",
  "ADVERTISEMENT",
  "OTHER",
] as const;
export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

export const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, "Enter your full name."),
  role: z.enum(["FREELANCER", "CLIENT"]),
  // Optional: the empty "prefer not to say" option in the form submits "",
  // which is normalized to null rather than rejected.
  referralSource: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .nullable()
    .refine(
      (v) => v === null || (REFERRAL_SOURCES as readonly string[]).includes(v),
      "Geçerli bir seçenek seç.",
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
