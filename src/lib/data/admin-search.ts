import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminSearchResult =
  | { kind: "contract"; id: string; title: string; reference: string }
  | { kind: "profile"; id: string; fullName: string; email: string; publicId: string; role: string };

/**
 * Global admin search: contracts.reference, profiles.email, profiles.public_id.
 * No new table, no new RLS -- admins already have full SELECT on both via
 * is_admin() (contracts_select_party, profiles_select_admin). Reads only,
 * parameterized through the Supabase query builder -- never raw SQL string
 * concatenation.
 */
export async function searchAdmin(query: string): Promise<AdminSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const supabase = await createClient();
  const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);

  const [contractsRes, profilesRes] = await Promise.all([
    supabase.from("contracts").select("id, title, reference").ilike("reference", `%${escaped}%`).limit(10),
    supabase
      .from("profiles")
      .select("id, full_name, email, public_id, role")
      .or(`email.ilike.%${escaped}%,public_id.ilike.%${escaped}%`)
      .limit(10),
  ]);

  if (contractsRes.error) throw contractsRes.error;
  if (profilesRes.error) throw profilesRes.error;

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

  return [...contracts, ...profiles];
}
