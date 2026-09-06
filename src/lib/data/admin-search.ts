import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminSearchResult =
  | { kind: "contract"; id: string; title: string; reference: string }
  | { kind: "profile"; id: string; fullName: string; email: string; publicId: string; role: string }
  | { kind: "request"; id: string; title: string; status: string };

/**
 * Global admin search: contracts.title + reference, profiles.email +
 * public_id, project_requests.title + brief. No new table, no new RLS beyond
 * 20260906000000 (which added the is_admin() branch project_requests was
 * missing) -- admins already have full SELECT on all three via is_admin()
 * (contracts_select_party, profiles_select_admin,
 * project_requests_select_party). Reads only, parameterized through the
 * Supabase query builder -- never raw SQL string concatenation.
 */
export async function searchAdmin(query: string): Promise<AdminSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const supabase = await createClient();
  const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
  const like = `%${escaped}%`;

  const [contractsRes, profilesRes, requestsRes] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, title, reference")
      .or(`title.ilike.${like},reference.ilike.${like}`)
      .limit(10),
    supabase
      .from("profiles")
      .select("id, full_name, email, public_id, role")
      .or(`email.ilike.${like},public_id.ilike.${like}`)
      .limit(10),
    supabase
      .from("project_requests")
      .select("id, title, status")
      .or(`title.ilike.${like},brief.ilike.${like}`)
      .limit(10),
  ]);

  if (contractsRes.error) throw contractsRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (requestsRes.error) throw requestsRes.error;

  const contracts: AdminSearchResult[] = (contractsRes.data ?? []).map((c) => ({
    kind: "contract",
    id: c.id,
    title: c.title,
    reference: c.reference,
  }));

  const profiles: AdminSearchResult[] = (profilesRes.data ?? []).map((p) => ({
    kind: "profile",
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    publicId: p.public_id,
    role: p.role,
  }));

  const requests: AdminSearchResult[] = (requestsRes.data ?? []).map((r) => ({
    kind: "request",
    id: r.id,
    title: r.title,
    status: r.status,
  }));

  return [...contracts, ...profiles, ...requests];
}
