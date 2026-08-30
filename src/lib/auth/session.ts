import "server-only";

import type { Route } from "next";
import { redirect } from "next/navigation";

import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type UserRole = Enums<"user_role">;

export type Session = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
};

/** Where each role lands after signing in, and what /dashboard redirects to. */
export const HOME_FOR: Record<UserRole, Route> = {
  FREELANCER: "/freelancer",
  CLIENT: "/client",
  ADMIN: "/admin",
};

/**
 * The signed-in user together with their profile row.
 *
 * The role lives in `profiles`, not in the auth token, so that changing it is
 * an ordinary database write guarded by guard_profile_role() rather than
 * something that requires reissuing a session.
 */
export async function requireSession(): Promise<Session> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  // An auth user with no profile row means the handle_new_user trigger did not
  // run. Sending them to a half-rendered dashboard would hide that; the login
  // page names it instead.
  if (!profile) redirect("/login?error=profile_missing");

  return {
    userId: user.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  };
}

/**
 * Session plus a role check. Not a security boundary -- RLS is, and it is
 * enforced in the database for every query. This keeps someone from landing on
 * a page built for a role they do not have, which would otherwise render as a
 * confusing empty screen rather than an honest redirect.
 */
export async function requireRole(...allowed: UserRole[]): Promise<Session> {
  const session = await requireSession();
  if (!allowed.includes(session.role)) redirect(HOME_FOR[session.role]);
  return session;
}
