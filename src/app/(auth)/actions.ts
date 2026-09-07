"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appUrl } from "@/lib/env.server";
import { safeNextPath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export type AuthFormState = { error: string | null };

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const next = safeNextPath(formData.get("next")?.toString());
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect((next ?? "/dashboard") as Route);
}

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    referralSource: formData.get("referralSource"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const next = safeNextPath(formData.get("next")?.toString());
  const { email, password, fullName, role, referralSource } = parsed.data;
  const supabase = await createClient();
  const callbackUrl = new URL(`${appUrl()}/auth/callback`);
  if (next) callbackUrl.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      // Consumed by the handle_new_user trigger to seed the profile row.
      data: { full_name: fullName, role, referral_source: referralSource },
    },
  });
  if (error) return { error: error.message };

  // Supabase returns a session here only when email confirmation is switched
  // off for the project. Branching on it means the app is correct under both
  // settings: straight into the dashboard when nothing has to be confirmed,
  // and a clear pending state when it does. Reading the setting itself is not
  // possible from the client, and assuming it is what stranded new accounts on
  // a bare sign-in form.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect((next ?? "/dashboard") as Route);
  }

  redirect(
    (next
      ? `/login?checkEmail=1&next=${encodeURIComponent(next)}`
      : "/login?checkEmail=1") as Route,
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
