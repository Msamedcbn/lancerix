import { z } from "zod";

import { parseTryToKurus } from "@/lib/escrow/money";

/**
 * A budget bound, in kurus. Optional at both ends: a client who does not want
 * to name a number should not be forced to invent one, and a client who only
 * has a ceiling should not have to invent a floor.
 *
 * MIN_MILESTONE_GROSS_KURUS deliberately does not apply here. That floor
 * exists because a milestone below it costs more to process than it earns; a
 * budget hint processes nothing. The real amount is set later, by the
 * freelancer, in the contract wizard, where the floor does apply.
 */
const optionalBudget = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return null;
    try {
      return parseTryToKurus(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "Tutarı 12.500,00 gibi yaz." });
      return z.NEVER;
    }
  })
  .nullable();

export const projectRequestSchema = z
  .object({
    /** Exactly one of these addresses the freelancer -- see the refine below. */
    freelancerPublicId: z.string().trim().toUpperCase().default(""),
    freelancerEmail: z
      .string()
      .trim()
      .toLowerCase()
      .default("")
      .refine(
        (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        "Geçerli bir e-posta adresi gir.",
      ),
    title: z
      .string()
      .trim()
      .min(3, "Projeye bir başlık ver.")
      .max(200, "Bu başlık çok uzun."),
    brief: z
      .string()
      .trim()
      .min(20, "Ne yaptırmak istediğini en az bir cümleyle anlat.")
      .max(4000, "Bu açıklama çok uzun."),
    budgetMin: optionalBudget,
    budgetMax: optionalBudget,
  })
  .refine(
    (v) => (v.freelancerPublicId === "") !== (v.freelancerEmail === ""),
    {
      message: "Geliştiriciyi ya Lancerix ID ile ya e-posta ile çağır, ikisini birden değil.",
      path: ["freelancerPublicId"],
    },
  )
  .refine(
    (v) => v.budgetMin === null || v.budgetMax === null || v.budgetMin <= v.budgetMax,
    { message: "Alt sınır üst sınırdan büyük olamaz.", path: ["budgetMax"] },
  );

export type ProjectRequestInput = z.infer<typeof projectRequestSchema>;
