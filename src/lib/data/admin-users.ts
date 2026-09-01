import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type Profile = Tables<"profiles">;
export type Company = Tables<"companies">;
export type Contract = Tables<"contracts">;
export type QaReviewer = Tables<"qa_reviewers">;

export type ProfileCard = Profile & { contractCount: number };

/**
 * Every profile of one role, newest first, with how many contracts they are a
 * party to. The count comes from one contracts query rather than one per
 * profile -- N+1 here would mean N+1 round trips to list a page of cards.
 */
export async function listProfilesByRole(
  role: "FREELANCER" | "CLIENT",
): Promise<ProfileCard[]> {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", role)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const column = role === "FREELANCER" ? "freelancer_id" : "client_id";
  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select(column);
  if (contractsError) throw contractsError;

  const counts = new Map<string, number>();
  for (const row of contracts ?? []) {
    const id = (row as Record<string, string | null>)[column];
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return (profiles ?? []).map((p) => ({
    ...p,
    contractCount: counts.get(p.id) ?? 0,
  }));
}

export type ReviewerCard = QaReviewer & { profile: Pick<Profile, "full_name" | "email" | "public_id"> };

/** Every QA reviewer, newest first, with the profile identity behind the card. */
export async function listReviewersWithProfile(): Promise<ReviewerCard[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qa_reviewers")
    .select("*, profile:profiles(full_name, email, public_id)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .filter((r) => r.profile)
    .map((r) => ({ ...r, profile: r.profile as ReviewerCard["profile"] }));
}

export type ProfileDetail = Profile & {
  companies: Company[];
  contractsAsFreelancer: Pick<Contract, "id" | "title" | "created_at">[];
  contractsAsClient: Pick<Contract, "id" | "title" | "created_at">[];
  reviewer: QaReviewer | null;
};

/** One profile's full picture -- who they are, what they own, what they are party to. */
export async function getProfileDetail(profileId: string): Promise<ProfileDetail | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const [companiesRes, asFreelancerRes, asClientRes, reviewerRes] = await Promise.all([
    supabase.from("companies").select("*").eq("owner_id", profileId),
    supabase
      .from("contracts")
      .select("id, title, created_at")
      .eq("freelancer_id", profileId)
      .order("created_at", { ascending: false }),
    supabase
      .from("contracts")
      .select("id, title, created_at")
      .eq("client_id", profileId)
      .order("created_at", { ascending: false }),
    supabase.from("qa_reviewers").select("*").eq("profile_id", profileId).maybeSingle(),
  ]);

  if (companiesRes.error) throw companiesRes.error;
  if (asFreelancerRes.error) throw asFreelancerRes.error;
  if (asClientRes.error) throw asClientRes.error;
  if (reviewerRes.error) throw reviewerRes.error;

  return {
    ...profile,
    companies: companiesRes.data ?? [],
    contractsAsFreelancer: asFreelancerRes.data ?? [],
    contractsAsClient: asClientRes.data ?? [],
    reviewer: reviewerRes.data,
  };
}
