import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import {
  listIncomingRequests,
  listOutgoingRequests,
  type ProjectRequestRow,
} from "@/lib/data/project-requests";
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

export type ReviewerCard = QaReviewer & {
  profile: Pick<Profile, "full_name" | "email" | "public_id"> | null;
  /** profile's name when there is one, else the reviewer's own full_name (2026-09-06: reviewers no longer need a Lancerix account). */
  displayName: string;
  displayEmail: string;
  hasAccount: boolean;
};

/** Every QA reviewer, newest first, with the profile identity behind the card. */
export async function listReviewersWithProfile(): Promise<ReviewerCard[]> {
  const supabase = await createClient();

  // Active first, grouped by level, most experienced first within a level --
  // the ordering a human managing the roster actually wants. Mirrors the
  // sort the standalone reviewers page used before it switched to this query
  // (2026-09-06 review: that page duplicated this query without the profile
  // join, which is why it could never show a name).
  const { data, error } = await supabase
    .from("qa_reviewers")
    .select("*, profile:profiles(full_name, email, public_id)")
    .order("active", { ascending: false })
    .order("level", { ascending: true })
    .order("years_experience", { ascending: false });
  if (error) throw error;

  // profile is null for a reviewer added by email with no Lancerix account
  // yet (2026-09-06 four-role audit, Finding 1) -- these used to be silently
  // dropped here (.filter((r) => r.profile)) because the standalone page
  // could not show a name for them; qa_reviewers.full_name/email now cover
  // that case instead of hiding the row.
  return (data ?? []).map((r) => {
    const profile = r.profile as ReviewerCard["profile"];
    return {
      ...r,
      profile,
      displayName: profile?.full_name ?? r.full_name ?? "İsimsiz",
      displayEmail: profile?.email ?? r.email ?? "",
      hasAccount: profile !== null,
    };
  });
}

export type AdminUserNote = Tables<"admin_user_notes"> & {
  author: Pick<Profile, "full_name"> | null;
};

export type ProfileDetail = Profile & {
  companies: Company[];
  contractsAsFreelancer: Pick<Contract, "id" | "title" | "created_at">[];
  contractsAsClient: Pick<Contract, "id" | "title" | "created_at">[];
  requestsAsFreelancer: ProjectRequestRow[];
  requestsAsClient: ProjectRequestRow[];
  reviewer: QaReviewer | null;
  notes: AdminUserNote[];
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

  // requestsAsFreelancer/requestsAsClient reuse the same queries the
  // freelancer- and client-facing /requests pages call on themselves
  // (src/lib/data/project-requests.ts) rather than a third copy of the
  // project_requests query -- 2026-09-06 review flagged the admin surface as
  // simply not knowing this table existed yet, not needing its own version
  // of it. RLS's admin branch (20260906000000) is what lets these two calls
  // see rows belonging to profileId instead of the admin's own auth.uid().
  const [
    companiesRes,
    asFreelancerRes,
    asClientRes,
    reviewerRes,
    notesRes,
    requestsAsFreelancer,
    requestsAsClient,
  ] = await Promise.all([
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
    supabase
      .from("admin_user_notes")
      .select("*, author:profiles!admin_user_notes_author_id_fkey(full_name)")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false }),
    listIncomingRequests(profileId),
    listOutgoingRequests(profileId),
  ]);

  if (companiesRes.error) throw companiesRes.error;
  if (asFreelancerRes.error) throw asFreelancerRes.error;
  if (asClientRes.error) throw asClientRes.error;
  if (reviewerRes.error) throw reviewerRes.error;
  if (notesRes.error) throw notesRes.error;

  return {
    ...profile,
    companies: companiesRes.data ?? [],
    contractsAsFreelancer: asFreelancerRes.data ?? [],
    contractsAsClient: asClientRes.data ?? [],
    requestsAsFreelancer,
    requestsAsClient,
    reviewer: reviewerRes.data,
    notes: (notesRes.data ?? []) as AdminUserNote[],
  };
}
