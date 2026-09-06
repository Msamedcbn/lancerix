import "server-only";

import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type UserRole = Enums<"user_role">;

export type Session = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  /** The 8-character code the other side needs to find this account. */
  publicId: string;
};

/** Where each role lands after signing in, and what /dashboard redirects to. */
export const HOME_FOR: Record<UserRole, Route> = {
  FREELANCER: "/freelancer",
  CLIENT: "/client",
  ADMIN: "/admin",
};

/**
 * Validates a `next` redirect target from a query param or form field.
 *
 * Only a same-origin relative path is accepted -- `//evil.example` and
 * `https://evil.example` are both rejected, since either would otherwise
 * carry a signed-in user's session cookies off-site on a post-auth redirect.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

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

  if (!user) {
    // Middleware already redirects logged-out visits with ?next=<path> (see
    // updateSession() in supabase/middleware.ts) -- this branch is the rarer
    // backstop (e.g. a session that expired between the middleware check and
    // this render), so it carries the same x-pathname header the root layout
    // reads, to land back on the same page after signing in.
    const pathname = (await headers()).get("x-pathname");
    redirect(pathname ? `/login?next=${encodeURIComponent(pathname)}` : "/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, public_id")
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
    publicId: profile.public_id,
  };
}

/**
 * The session if there is one, null if there is not. Never redirects.
 *
 * For pages that are public but should not pretend a signed-in visitor is a
 * stranger -- the public profile page offering "Giriş Yap" to someone who is
 * already signed in is exactly the seam this exists to close.
 */
export async function optionalSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, public_id")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    publicId: profile.public_id,
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
