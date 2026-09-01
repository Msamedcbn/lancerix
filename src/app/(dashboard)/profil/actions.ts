"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { FAIL, firstIssue, OK, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { publicProfileSchema } from "@/lib/validations/profile";

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
    })
    .eq("id", session.userId);

  if (error) return FAIL(error.message);

  revalidatePath("/profil");
  revalidatePath(`/profile/${session.publicId}`);
  return OK("Profilin güncellendi.");
}
