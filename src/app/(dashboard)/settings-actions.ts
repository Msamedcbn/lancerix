"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { FAIL, firstIssue, OK, toUserMessage, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { companySchema } from "@/lib/validations/company";
import { profileSchema } from "@/lib/validations/profile";

export async function saveProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
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
      iban: parsed.data.iban?.replace(/\s/g, "") ?? null,
    })
    .eq("id", session.userId);

  if (error) {
    return FAIL(
      error.code === "23505"
        ? "Bu TCKN başka bir hesaba kayıtlı."
        : error.message,
    );
  }

  revalidatePath("/", "layout");
  return OK("Profil kaydedildi.");
}

export async function saveCompany(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const parsed = companySchema.safeParse({
    legalName: formData.get("legalName"),
    vkn: formData.get("vkn"),
    taxOffice: formData.get("taxOffice"),
    address: formData.get("address"),
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const companyId = formData.get("companyId");

  const values = {
    owner_id: session.userId,
    legal_name: parsed.data.legalName,
    vkn: parsed.data.vkn,
    tax_office: parsed.data.taxOffice,
    address: parsed.data.address,
  };

  const { error } =
    typeof companyId === "string" && companyId !== ""
      ? await supabase.from("companies").update(values).eq("id", companyId)
      : await supabase.from("companies").insert({
          ...values,
          public_id: Math.random().toString(36).slice(2, 10).toUpperCase(),
        });

  if (error) return FAIL(toUserMessage(error, "Şirket bilgileri kaydedilemedi."));

  revalidatePath("/client/company");
  return OK("Şirket bilgileri kaydedildi.");
}
