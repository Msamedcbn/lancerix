import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ProjectRequest = Tables<"project_requests">;

/** A request plus the display name of whoever is on the other end of it. */
export type ProjectRequestRow = ProjectRequest & {
  counterpartyName: string;
  counterpartyPublicId: string | null;
};

/**
 * Requests addressed to this freelancer, newest first.
 *
 * RLS already limits the rows to the two parties (project_requests_select_party),
 * so the filter here is about which side of the request the caller is on, not
 * about access.
 */
export async function listIncomingRequests(
  freelancerId: string,
): Promise<ProjectRequestRow[]> {
  return withNames("freelancer_id", freelancerId, "client_id");
}

/** Requests this client has sent, newest first. */
export async function listOutgoingRequests(
  clientId: string,
): Promise<ProjectRequestRow[]> {
  return withNames("client_id", clientId, "freelancer_id");
}

async function withNames(
  mineColumn: "client_id" | "freelancer_id",
  userId: string,
  otherColumn: "client_id" | "freelancer_id",
): Promise<ProjectRequestRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_requests")
    .select("*")
    .eq(mineColumn, userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const otherIds = [
    ...new Set(
      rows
        .map((r) => r[otherColumn])
        .filter((id): id is string => id !== null),
    ),
  ];

  const names = new Map<string, { name: string; publicId: string }>();
  if (otherIds.length > 0) {
    const { data: profiles, error: nameError } = await supabase.rpc(
      "party_display_names",
      { p_ids: otherIds },
    );
    if (nameError) throw nameError;
    for (const p of profiles ?? []) {
      names.set(p.id, { name: p.full_name, publicId: p.public_id });
    }
  }

  return rows.map((r) => {
    const otherId = r[otherColumn];
    const profile = otherId ? names.get(otherId) : undefined;
    return {
      ...r,
      // An unclaimed email invite has no account behind it yet, so the address
      // is the only name there is. Falling back to it -- rather than to
      // "Bilinmiyor" -- is what lets the client see who they actually wrote to.
      counterpartyName:
        profile?.name ?? (r.freelancer_email || "Hesap oluşturulmadı"),
      counterpartyPublicId: profile?.publicId ?? null,
    };
  });
}

/** One request, for the detail and convert-to-contract paths. */
export async function getProjectRequest(
  id: string,
): Promise<ProjectRequest | null> {
  const supabase = await createClient();
  const { data: first, error } = await supabase
    .from("project_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // 22P02 = invalid_text_representation -- a malformed id (not a real
  // UUID) is a not-found, not a server error. See the identical fix and
  // full rationale in getContract() (src/lib/data/contracts.ts).
  if (error) {
    if (error.code === "22P02") return null;
    throw error;
  }
  if (!first) return null;

  // An email invite has freelancer_id NULL until the invited address opens it.
  // Idempotent and safe on every load: claim_invited_request() is the only
  // authority on whether the caller actually matches the address, so the
  // client viewing their own request fails this harmlessly.
  if (first.freelancer_id === null) {
    const { data: claimed } = await supabase.rpc("claim_invited_request", {
      p_request_id: id,
    });
    if (claimed?.freelancer_id) return claimed;
  }

  return first;
}
