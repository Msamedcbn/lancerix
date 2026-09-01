import "server-only";

import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type PublicProfile = {
  public_id: string;
  full_name: string;
  role: Enums<"user_role">;
  headline: string | null;
  bio: string | null;
  skills: string[];
  location: string | null;
  website_url: string | null;
  created_at: string;
  completed_contracts: number;
  companies: Array<{ id: string; legal_name: string }>;
};

/**
 * A profile as a stranger sees it.
 *
 * public_profile() is a security-definer function returning named columns, so
 * this route needs no service-role key and cannot accidentally widen to
 * email/tckn/iban -- the column list lives in the database, not here.
 * Callable by anon, because a public ID is meant to be pasteable to someone
 * who has not signed up yet.
 */
export async function getPublicProfile(
  publicId: string,
): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("public_profile", { p_public_id: publicId })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    completed_contracts: Number(data.completed_contracts ?? 0),
    skills: data.skills ?? [],
    companies: Array.isArray(data.companies)
      ? (data.companies as Array<{ id: string; legal_name: string }>)
      : [],
  };
}

/** The editable half, read as the owner. */
export async function getMyProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name, public_id, role, headline, bio, skills, location, website_url, tckn, iban, created_at",
    )
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}
