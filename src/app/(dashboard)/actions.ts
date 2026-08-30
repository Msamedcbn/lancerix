"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole, requireSession } from "@/lib/auth/session";
import { assertMilestoneGross } from "@/lib/escrow/money";
import type { EscrowStatus } from "@/lib/data/contracts";
import { createClient } from "@/lib/supabase/server";
import { companySchema } from "@/lib/validations/company";
import { contractSchema } from "@/lib/validations/contract";
import { profileSchema } from "@/lib/validations/profile";

export type FormState = { error: string | null; ok?: string };

const OK = (message: string): FormState => ({ error: null, ok: message });
const FAIL = (error: string): FormState => ({ error });

/** First issue only: a form shows one message at a time. */
function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function saveProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    tckn: formData.get("tckn") ?? "",
    iban: formData.get("iban") ?? "",
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      tckn: parsed.data.tckn,
      iban: parsed.data.iban?.replace(/\s/g, "") ?? null,
    })
    .eq("id", session.userId);

  // A duplicate TCKN is the one failure a user can cause and fix, so it is
  // named rather than surfaced as a database error string.
  if (error) {
    return FAIL(
      error.code === "23505"
        ? "That TCKN is already registered to another account."
        : error.message,
    );
  }

  revalidatePath("/", "layout");
  return OK("Profile saved.");
}

export async function saveCompany(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const parsed = companySchema.safeParse({
    legalName: formData.get("legalName"),
    vkn: formData.get("vkn"),
    taxOffice: formData.get("taxOffice"),
    address: formData.get("address"),
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const companyId = formData.get("companyId");

  const values = {
    owner_id: session.userId,
    legal_name: parsed.data.legalName,
    vkn: parsed.data.vkn,
    tax_office: parsed.data.taxOffice,
    address: parsed.data.address,
  };

  const { error } =
    typeof companyId === "string" && companyId !== ""
      ? await supabase.from("companies").update(values).eq("id", companyId)
      : await supabase.from("companies").insert(values);

  if (error) return FAIL(error.message);

  revalidatePath("/client/company");
  return OK("Company saved.");
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export type CounterpartyResult = {
  error: string | null;
  client?: {
    id: string;
    fullName: string;
    companies: Array<{ id: string; legal_name: string; vkn: string }>;
  };
};

/**
 * Resolves the client side of a contract from an exact email address. The
 * freelancer cannot read profiles or companies directly -- RLS forbids it --
 * so this goes through find_counterparty(), which returns only what has to
 * appear on the contract.
 */
export async function findCounterparty(
  _prev: CounterpartyResult,
  formData: FormData,
): Promise<CounterpartyResult> {
  await requireRole("FREELANCER");

  const email = String(formData.get("clientEmail") ?? "").trim();
  if (!email) return { error: "Enter the client's email address." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("find_counterparty", { p_email: email })
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) {
    return {
      error:
        "No account uses that address yet. Ask the client to register first, then try again.",
    };
  }
  if (data.role !== "CLIENT") {
    return { error: "That account is not registered as a client." };
  }

  const companies = Array.isArray(data.companies)
    ? (data.companies as Array<{ id: string; legal_name: string; vkn: string }>)
    : [];

  if (companies.length === 0) {
    return {
      error:
        "That client has not added a company yet. A contract has to be billed to one.",
    };
  }

  return {
    error: null,
    client: { id: data.id, fullName: data.full_name, companies },
  };
}

export async function createContract(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("FREELANCER");

  const milestones = readMilestones(formData);
  const parsed = contractSchema.safeParse({
    title: formData.get("title"),
    scopeOfWork: formData.get("scopeOfWork"),
    clientEmail: formData.get("clientEmail"),
    companyId: formData.get("companyId"),
    milestones,
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const { data: client, error: lookupError } = await supabase
    .rpc("find_counterparty", { p_email: parsed.data.clientEmail })
    .maybeSingle();

  if (lookupError) return FAIL(lookupError.message);
  if (!client) return FAIL("No account uses that email address.");
  if (client.role !== "CLIENT") return FAIL("That account is not a client.");

  // The reference is what both parties quote to each other, so it is short and
  // readable rather than a UUID.
  const reference = `LX-${Date.now().toString(36).toUpperCase()}`;

  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      reference,
      title: parsed.data.title,
      scope_of_work: parsed.data.scopeOfWork,
      client_id: client.id,
      freelancer_id: session.userId,
      company_id: parsed.data.companyId,
    })
    .select("id")
    .single();

  if (error) return FAIL(error.message);

  // The rates are read back from the row the database just wrote rather than
  // assumed from the defaults, and copied onto every milestone. That is what
  // freezes the terms: a later change to the platform fee cannot reach a
  // contract that is already signed.
  const { data: terms, error: termsError } = await supabase
    .from("contracts")
    .select("platform_fee_bps, stopaj_bps")
    .eq("id", contract.id)
    .single();

  if (termsError) return FAIL(termsError.message);

  for (const m of parsed.data.milestones) assertMilestoneGross(m.amount);

  const { error: milestoneError } = await supabase.from("milestones").insert(
    parsed.data.milestones.map((m, index) => ({
      contract_id: contract.id,
      sequence_no: index + 1,
      title: m.title,
      gross_amount_kurus: m.amount,
      due_date: m.dueDate,
      platform_fee_bps: terms.platform_fee_bps,
      stopaj_bps: terms.stopaj_bps,
    })),
  );

  if (milestoneError) return FAIL(milestoneError.message);

  revalidatePath("/freelancer");
  redirect(`/contracts/${contract.id}`);
}

/** Milestone rows arrive as milestones[0][title] style keys. */
function readMilestones(formData: FormData) {
  const byIndex = new Map<number, { title: string; amount: string; dueDate: string }>();

  for (const [key, value] of formData.entries()) {
    const match = /^milestones\[(\d+)]\[(title|amount|dueDate)]$/.exec(key);
    if (!match) continue;

    const index = Number(match[1]);
    const field = match[2] as "title" | "amount" | "dueDate";
    const row = byIndex.get(index) ?? { title: "", amount: "", dueDate: "" };
    row[field] = String(value);
    byIndex.set(index, row);
  }

  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => row.title !== "" || row.amount !== "");
}

// ---------------------------------------------------------------------------
// Milestone transitions
// ---------------------------------------------------------------------------

/**
 * Every status change goes through transition_milestone(), which writes the
 * ledger row in the same transaction. Nothing here updates a status directly --
 * a trigger would reject it if it tried.
 */
export async function transitionMilestone(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const milestoneId = String(formData.get("milestoneId") ?? "");
  const to = String(formData.get("toStatus") ?? "") as EscrowStatus;
  // The RPC takes an optional reason; an empty box means "no reason given",
  // which is undefined rather than a null the database would have to store.
  const reason = String(formData.get("reason") ?? "").trim() || undefined;

  if (!milestoneId || !to) return FAIL("Missing milestone or target status.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_milestone", {
    p_milestone_id: milestoneId,
    p_to_status: to,
    p_reason: reason,
  });

  if (error) return FAIL(error.message);

  revalidatePath("/", "layout");
  return OK(`Milestone moved to ${to.toLowerCase().replace("_", " ")}.`);
}

export async function raiseDispute(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const milestoneId = String(formData.get("milestoneId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (reason.length < 10) {
    return FAIL("Explain the dispute in at least ten characters.");
  }

  const supabase = await createClient();
  const { error: disputeError } = await supabase.from("disputes").insert({
    milestone_id: milestoneId,
    raised_by: session.userId,
    reason,
  });
  if (disputeError) return FAIL(disputeError.message);

  // The dispute row is the record; the milestone still has to move, and only
  // transition_milestone() may move it.
  const { error } = await supabase.rpc("transition_milestone", {
    p_milestone_id: milestoneId,
    p_to_status: "DISPUTED",
    p_reason: reason,
  });
  if (error) return FAIL(error.message);

  revalidatePath("/", "layout");
  return OK("Dispute opened. An administrator will review it.");
}
