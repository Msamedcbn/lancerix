import "server-only";

import type { Enums, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type EscrowStatus = Enums<"escrow_status">;
export type Milestone = Tables<"milestones">;
export type Contract = Tables<"contracts">;
export type AcceptanceCriterion = Tables<"acceptance_criteria">;

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

export type PhaseItem = Tables<"workflow_phase_items">;
export type Phase = Tables<"workflow_phases"> & { items: PhaseItem[] };

export type ContractRow = Contract & {
  milestones: Milestone[];
  criteria: AcceptanceCriterion[];
  phases: Phase[];
  counterpartyName: string;
  counterpartyPublicId: string | null;
};

/** Sorts phases by sequence, and each phase's checklist items by sequence. */
function sortPhases(
  rows: (Tables<"workflow_phases"> & { workflow_phase_items?: PhaseItem[] | null })[] | null,
): Phase[] {
  return [...(rows ?? [])]
    .sort((a, b) => a.sequence_no - b.sequence_no)
    .map((row) => ({
      ...row,
      items: [...(row.workflow_phase_items ?? [])].sort((a, b) => a.sequence_no - b.sequence_no),
    }));
}

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
    .select("*, milestones(*), acceptance_criteria(*), workflow_phases(*, workflow_phase_items(*))")
    .order("created_at", { ascending: false });

  if (side === "freelancer") query = query.eq("freelancer_id", userId);
  if (side === "client") query = query.eq("client_id", userId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const names = await displayNames(
    rows.flatMap((c) => [c.client_id, c.freelancer_id]),
  );

  return rows.map((c) => {
    const counterparty = counterpartyName(c, userId, names);
    return {
      ...c,
      milestones: sortMilestones(c.milestones),
      criteria: [...(c.acceptance_criteria ?? [])].sort((a, b) => a.sequence_no - b.sequence_no),
      phases: sortPhases(c.workflow_phases),
      counterpartyName: counterparty.name,
      counterpartyPublicId: counterparty.publicId,
    };
  });
}

/**
 * Who the other side is, by name if they have an account and by address if
 * they do not. An invited client has no profile row yet -- the contract was
 * drafted against their email -- so the address IS their identity until they
 * register, and showing "Unknown" would hide who the contract is even with.
 */
function counterpartyName(
  contract: Pick<Contract, "client_id" | "freelancer_id" | "client_email">,
  userId: string,
  names: Map<string, { name: string; publicId: string }>,
): { name: string; publicId: string | null } {
  if (contract.freelancer_id === userId) {
    const client = contract.client_id ? names.get(contract.client_id) : null;
    return client
      ? { name: client.name, publicId: client.publicId }
      : { name: contract.client_email, publicId: null };
  }
  const freelancer = names.get(contract.freelancer_id);
  return freelancer
    ? { name: freelancer.name, publicId: freelancer.publicId }
    : { name: "Bilinmiyor", publicId: null };
}

export async function getContract(
  contractId: string,
  userId: string,
): Promise<
  | (ContractRow & {
      signatures: Signature[];
      criteria: AcceptanceCriterion[];
      qaReviewer: Tables<"qa_reviewers"> | null;
      company: {
        legal_name: string;
        vkn: string | null;
        tax_office: string | null;
        address: string | null;
      } | null;
    })
  | null
> {
  const supabase = await createClient();

  const select =
    "*, milestones(*), contract_signatures(*), acceptance_criteria(*), workflow_phases(*, workflow_phase_items(*)), qa_reviewers(*)";

  const { data: first, error: firstError } = await supabase
    .from("contracts")
    .select(select)
    .eq("id", contractId)
    .maybeSingle();

  if (firstError) throw firstError;
  if (!first) return null;

  // Unclaimed invite (F-3, 2026-09-03): attach client_id the moment its
  // matching, confirmed address looks at the contract. Idempotent and safe
  // to call on every load -- claim_invited_contract() itself is the only
  // authority on whether the caller actually matches; a freelancer viewing
  // their own draft or an admin viewing someone else's unclaimed invite both
  // fail this harmlessly (not a real error, just "not for you to claim").
  let data = first;
  if (first.client_id === null) {
    const { data: claimed } = await supabase.rpc("claim_invited_contract", {
      p_contract_id: contractId,
    });
    if (claimed?.client_id) {
      const { data: refetched, error: refetchError } = await supabase
        .from("contracts")
        .select(select)
        .eq("id", contractId)
        .maybeSingle();
      if (refetchError) throw refetchError;
      if (refetched) data = refetched;
    }
  }

  const [names, { data: company }] = await Promise.all([
    displayNames([data.client_id, data.freelancer_id]),
    supabase.rpc("contract_company", { p_contract_id: contractId }).maybeSingle(),
  ]);

  const counterparty = counterpartyName(data, userId, names);

  return {
    ...data,
    milestones: sortMilestones(data.milestones),
    signatures: data.contract_signatures,
    criteria: [...data.acceptance_criteria].sort((a, b) => a.sequence_no - b.sequence_no),
    qaReviewer: data.qa_reviewers,
    phases: sortPhases(data.workflow_phases),
    counterpartyName: counterparty.name,
    counterpartyPublicId: counterparty.publicId,
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
): Promise<Array<Milestone & { contract: Contract; counterpartyName: string; counterpartyPublicId: string | null }>> {
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

  return rows.map((m) => {
    const counterparty = counterpartyName(m.contract, userId, names);
    return {
      ...m,
      counterpartyName: counterparty.name,
      counterpartyPublicId: counterparty.publicId,
    };
  });
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
 * Names and public IDs for a set of profile ids, through the definer function that returns
 * only id, full_name, and public_id. Selecting the profiles table directly would be
 * refused for a counterparty, and widening that policy would expose their TCKN.
 */
async function displayNames(
  ids: Array<string | null>,
): Promise<Map<string, { name: string; publicId: string }>> {
  // An unclaimed contract has a null client_id, which is not a lookup key.
  const unique = [...new Set(ids.filter((id): id is string => id !== null))];
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("party_display_names", {
    p_ids: unique,
  });
  if (error) throw error;

  return new Map((data ?? []).map((p) => [p.id, { name: p.full_name, publicId: p.public_id }]));
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

export type ClientPlatformInvoiceRow = Tables<"platform_invoices"> & {
  contract: Pick<Contract, "id" | "title" | "reference"> | null;
};

/** Lancerix service invoices issued to a specific client. */
export async function listClientPlatformInvoices(clientId: string): Promise<ClientPlatformInvoiceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_invoices")
    .select("*, contract:contracts(id, title, reference)")
    .eq("client_id", clientId)
    .order("issued_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClientPlatformInvoiceRow[];
}

/**
 * Whether picking Tier 1/2 on this contract would land on the freelancer's
 * first-contract fee waiver (Faz E #4). Routed through a security-definer
 * RPC because the viewer here is the client, pre-signature -- RLS correctly
 * does not let them see the freelancer's other contracts to check this
 * themselves.
 */
export async function isFreelancersFirstPaidTier(
  freelancerId: string,
  excludeContractId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("freelancer_has_paid_qa_before", {
    p_freelancer_id: freelancerId,
    p_exclude_contract_id: excludeContractId,
  });

  if (error) throw error;
  return data === false;
}
