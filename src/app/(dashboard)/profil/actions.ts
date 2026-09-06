"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { FAIL, firstIssue, OK, toUserMessage, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, publicProfileSchema } from "@/lib/validations/profile";

export type { FormState };

/**
 * Editing the public half of a profile.
 *
 * Scoped by id = session.userId rather than trusting a form field: the
 * profiles update policy already restricts to `id = auth.uid()`, so a forged
 * id would be rejected, but not accepting one at all is clearer. role stays
 * untouched here -- guard_profile_role() rejects that change anyway.
 */
export async function updatePublicProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const parsed = publicProfileSchema.safeParse({
    headline: formData.get("headline") ?? "",
    bio: formData.get("bio") ?? "",
    location: formData.get("location") ?? "",
    websiteUrl: formData.get("websiteUrl") ?? "",
    skills: formData.get("skills") ?? "",
    services: formData.get("services") ?? "",
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      location: parsed.data.location,
      website_url: parsed.data.websiteUrl,
      skills: parsed.data.skills,
      services: parsed.data.services,
    })
    .eq("id", session.userId);

  if (error) return FAIL(toUserMessage(error, "Profil güncellenemedi."));

  revalidatePath("/profil");
  revalidatePath(`/profile/${session.publicId}`);
  return OK("Profilin güncellendi.");
}

/**
 * The Faturalandırma tab: TCKN + IBAN, and the name a payout is made out to.
 *
 * Never shown to a counterparty -- profileSchema deliberately stays out of
 * public_profile()'s column list. Nothing pays out on this yet (that is Faz
 * 2), but a freelancer invoicing a client directly, or through Jobtogo,
 * needs this on file the same way Jobtogo's own onboarding collects it, and
 * payoutBlockers() reads it to say what is still missing.
 */
export async function updatePayoutInfo(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    tckn: formData.get("tckn") ?? "",
    iban: formData.get("iban") ?? "",
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      tckn: parsed.data.tckn,
      iban: parsed.data.iban,
    })
    .eq("id", session.userId);

  if (error) return FAIL(toUserMessage(error, "Faturalandırma bilgileri kaydedilemedi."));

  revalidatePath("/profil");
  return OK("Faturalandırma bilgilerin kaydedildi.");
}
