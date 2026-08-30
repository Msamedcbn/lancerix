import "server-only";

import type { Enums, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type EscrowStatus = Enums<"escrow_status">;
export type Milestone = Tables<"milestones">;
export type Contract = Tables<"contracts">;

/**
 * Statuses whose money is already held by the gateway. Mirrors FUNDED_STATUSES
 * in the state machine, and drives what "locked" means on the earnings page.
 */
const FUNDED: readonly EscrowStatus[] = [
  "IN_PROGRESS",
  "SUBMITTED",
  "COMPLETED",
  "DISPUTED",
];

export type Signature = Tables<"contract_signatures">;

export type ContractRow = Contract & {
  milestones: Milestone[];
  counterpartyName: string;
};

/**
 * Contracts the caller is a party to. RLS already scopes the rows to the
 * caller, so the role filter here is about which side of the contract they are
 * on, not about access.
 */
export async function listContracts(
  side: "freelancer" | "client" | "all",
  userId: string,
): Promise<ContractRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("contracts")
    .select("*, milestones(*)")
    .order("created_at", { ascending: false });

  if (side === "freelancer") query = query.eq("freelancer_id", userId);
  if (side === "client") query = query.eq("client_id", userId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const names = await displayNames(
    rows.flatMap((c) => [c.client_id, c.freelancer_id]),
  );

  return rows.map((c) => ({
    ...c,
    milestones: sortMilestones(c.milestones),
    counterpartyName:
      names.get(c.freelancer_id === userId ? c.client_id : c.freelancer_id) ??
      "Unknown",
  }));
}

export async function getContract(
  contractId: string,
  userId: string,
): Promise<
  | (ContractRow & {
      signatures: Signature[];
      company: {
        legal_name: string;
        vkn: string;
        tax_office: string;
        address: string;
      } | null;
    })
  | null
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select("*, milestones(*), contract_signatures(*)")
    .eq("id", contractId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [names, { data: company }] = await Promise.all([
    displayNames([data.client_id, data.freelancer_id]),
    supabase.rpc("contract_company", { p_contract_id: contractId }).maybeSingle(),
  ]);

  return {
    ...data,
    milestones: sortMilestones(data.milestones),
    signatures: data.contract_signatures,
    counterpartyName:
      names.get(data.freelancer_id === userId ? data.client_id : data.freelancer_id) ??
      "Unknown",
    company: company
      ? {
          legal_name: company.legal_name,
          vkn: company.vkn,
          tax_office: company.tax_office,
          address: company.address,
        }
      : null,
  };
}

/** Milestones across the caller's contracts, filtered by status. */
export async function listMilestones(
  statuses: readonly EscrowStatus[],
  side: "freelancer" | "client",
  userId: string,
): Promise<Array<Milestone & { contract: Contract; counterpartyName: string }>> {
  const supabase = await createClient();

  const column = side === "freelancer" ? "freelancer_id" : "client_id";
  const { data, error } = await supabase
    .from("milestones")
    .select("*, contract:contracts!inner(*)")
    .in("status", [...statuses])
    .eq(`contract.${column}`, userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];
  const names = await displayNames(
    rows.flatMap((m) => [m.contract.client_id, m.contract.freelancer_id]),
  );

  return rows.map((m) => ({
    ...m,
    counterpartyName:
      names.get(
        m.contract.freelancer_id === userId
          ? m.contract.client_id
          : m.contract.freelancer_id,
      ) ?? "Unknown",
  }));
}

export type EarningsSummary = {
  releasedKurus: number;
  lockedKurus: number;
  withheldKurus: number;
  released: Array<Milestone & { contract: Contract }>;
};

/**
 * Everything the earnings page states, computed from the generated columns
 * rather than recalculated here -- the split is decided in one place and this
 * only ever adds figures up.
 */
export async function earningsSummary(userId: string): Promise<EarningsSummary> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestones")
    .select("*, contract:contracts!inner(*)")
    .eq("contract.freelancer_id", userId);

  if (error) throw error;
  const rows = data ?? [];

  const released = rows.filter((m) => m.status === "RELEASED");
  const locked = rows.filter((m) => FUNDED.includes(m.status));

  return {
    releasedKurus: sum(released.map((m) => kurus(m.freelancer_net_kurus, "freelancer_net_kurus"))),
    lockedKurus: sum(locked.map((m) => kurus(m.freelancer_net_kurus, "freelancer_net_kurus"))),
    withheldKurus: sum(released.map((m) => kurus(m.tax_withholding_kurus, "tax_withholding_kurus"))),
    released: released.sort(byReleasedAt),
  };
}

/** Ledger rows for the audit log, newest first. */
export async function listLedger(limit = 100) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("escrow_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function listDisputes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("disputes")
    .select("*, milestone:milestones(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Names for a set of profile ids, through the definer function that returns
 * only id and full_name. Selecting the profiles table directly would be
 * refused for a counterparty, and widening that policy would expose their TCKN.
 */
async function displayNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("party_display_names", {
    p_ids: unique,
  });
  if (error) throw error;

  return new Map((data ?? []).map((p) => [p.id, p.full_name]));
}

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

/**
 * A generated money column arrives typed as `number | null`, because Postgres
 * reports generated columns as nullable through the API even though every row
 * computes one. Defaulting a null to zero would turn a schema change into a
 * quietly wrong total, which is the exact failure the ledger exists to prevent.
 */
export function kurus(value: number | null, column: string): number {
  if (value === null) {
    throw new Error(
      `${column} came back null; a generated money column cannot be null, so the schema no longer matches this code`,
    );
  }
  return value;
}

const sortMilestones = (milestones: Milestone[]) =>
  [...milestones].sort((a, b) => a.sequence_no - b.sequence_no);

const byReleasedAt = (a: Milestone, b: Milestone) =>
  (b.released_at ?? "").localeCompare(a.released_at ?? "");
