"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireRole, requireSession } from "@/lib/auth/session";
import {
  assertMilestoneGross,
  DEFAULT_PLATFORM_FEE_BPS,
} from "@/lib/escrow/money";
import type {
  AcceptanceCriterion,
  Contract,
  EscrowStatus,
} from "@/lib/data/contracts";
import { hashDocument, renderContractDocument } from "@/lib/contracts/document";
import { TERMS_VERSION } from "@/lib/contracts/terms";
import { getContract } from "@/lib/data/contracts";
import { notifyContractInvite } from "@/lib/notify/email";
import { DEFAULT_STOPAJ_BPS } from "@/lib/tax/stopaj";
import { FAIL, firstIssue, OK, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import {
  toCheckConfig,
  type CriterionDraft,
} from "@/lib/validations/acceptance-criteria";
import { companySchema } from "@/lib/validations/company";
import {
  contractSchema,
  criteriaSubmissionSchema,
  DEFAULT_OBJECTION_WINDOW_DAYS,
} from "@/lib/validations/contract";
import { profileSchema } from "@/lib/validations/profile";

export type { FormState };

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
      : await supabase.from("companies").insert({
          ...values,
          public_id: Math.random().toString(36).slice(2, 10).toUpperCase(),
        });

  if (error) return FAIL(error.message);

  revalidatePath("/client/company");
  return OK("Company saved.");
}

// ---------------------------------------------------------------------------
// Counterparty lookup — by public ID instead of email
// ---------------------------------------------------------------------------

export type CounterpartyResult = {
  error: string | null;
  resolved?: {
    publicId: string;
    id: string;
    fullName: string;
    companies: Array<{ id: string; legal_name: string; vkn: string | null; public_id: string }>;
  };
};

/**
 * Finds a contract counterparty by their Lancerix public ID.
 * Replaces the old email-based lookup.
 */
export async function findCounterparty(
  _prev: CounterpartyResult,
  formData: FormData,
): Promise<CounterpartyResult> {
  await requireRole("FREELANCER");

  const publicId = String(formData.get("clientPublicId") ?? "").trim();
  if (!publicId) return { error: "Müşterinin Lancerix ID'sini gir." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("find_by_public_id", { p_public_id: publicId })
    .maybeSingle();

  if (error) return { error: error.message };

  if (!data) {
    return { error: "Bu ID ile kayıtlı kullanıcı bulunamadı." };
  }

  if (data.role !== "CLIENT") {
    return { error: "Bu hesap işveren (firma) olarak kayıtlı değil." };
  }

  const companies = Array.isArray(data.companies)
    ? (data.companies as Array<{ id: string; legal_name: string; vkn: string | null; public_id: string }>)
    : [];

  return {
    error: null,
    resolved: {
      publicId: data.public_id,
      id: data.id,
      fullName: data.full_name,
      companies,
    },
  };
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export type PreviewResult = { error: string | null; document?: string };

export async function previewContract(
  _prev: PreviewResult,
  formData: FormData,
): Promise<PreviewResult> {
  const session = await requireRole("FREELANCER");

  const productType =
    formData.get("productType") === "QA_PLUS_ESCROW" ? "QA_PLUS_ESCROW" : "QA_ONLY";

  const shared = {
    productType,
    projectCategory: formData.get("projectCategory"),
    title: formData.get("title"),
    scopeOfWork: formData.get("scopeOfWork"),
    clientPublicId: formData.get("clientPublicId"),
    clientEmail: formData.get("clientEmail"),
    companyId: formData.get("companyId"),
    plannedStartDate: formData.get("plannedStartDate"),
    projectAmount: formData.get("projectAmount"),
  };

  const parsed =
    productType === "QA_ONLY"
      ? contractSchema.safeParse({
          ...shared,
          criteria: readCriteria(formData),
          phases: readPhases(formData),
        })
      : contractSchema.safeParse({ ...shared, milestones: readMilestones(formData) });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data: company } = parsed.data.companyId
    ? await supabase
        .from("companies")
        .select("legal_name, vkn, tax_office, address")
        .eq("id", parsed.data.companyId)
        .maybeSingle()
    : { data: null };

  // Same lookup createContract() does -- the preview should show the name
  // a freelancer actually recognises, not the raw ID they typed. Falls back
  // to the ID itself if the lookup fails, same as showing nothing better.
  // Invite path (clientEmail set instead) has no account yet to look up.
  const { data: client } = parsed.data.clientPublicId
    ? await supabase
        .rpc("find_by_public_id", { p_public_id: parsed.data.clientPublicId })
        .maybeSingle()
    : { data: null };

  const draftContract = {
    reference: "(kaydedildiğinde atanır)",
    title: parsed.data.title,
    scope_of_work: parsed.data.scopeOfWork,
    product_type: parsed.data.productType,
    objection_window_days: DEFAULT_OBJECTION_WINDOW_DAYS,
    platform_fee_bps: DEFAULT_PLATFORM_FEE_BPS,
    stopaj_bps: DEFAULT_STOPAJ_BPS,
  } as Contract;

  const criteria =
    parsed.data.productType === "QA_ONLY"
      ? parsed.data.criteria.map((c, index) => ({
          sequence_no: index + 1,
          description: c.description,
          check_type: "MANUAL",
          check_config: toCheckConfig(c),
        }))
      : [];

  return {
    error: null,
    document: renderContractDocument(
      draftContract,
      [],
      {
        freelancerName: session.fullName,
        clientName:
          client?.full_name ?? (parsed.data.clientPublicId || parsed.data.clientEmail) ?? "",
        company,
      },
      criteria as AcceptanceCriterion[],
    ),
  };
}

export async function createContract(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("FREELANCER");

  const productType = formData.get("productType") === "QA_PLUS_ESCROW"
    ? "QA_PLUS_ESCROW"
    : "QA_ONLY";

  const shared = {
    productType,
    projectCategory: formData.get("projectCategory"),
    title: formData.get("title"),
    scopeOfWork: formData.get("scopeOfWork"),
    clientPublicId: formData.get("clientPublicId"),
    clientEmail: formData.get("clientEmail"),
    companyId: formData.get("companyId"),
    plannedStartDate: formData.get("plannedStartDate"),
    projectAmount: formData.get("projectAmount"),
  };

  const parsed =
    productType === "QA_ONLY"
      ? contractSchema.safeParse({
          ...shared,
          criteria: readCriteria(formData),
          phases: readPhases(formData),
        })
      : contractSchema.safeParse({ ...shared, milestones: readMilestones(formData) });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();

  // Two ways to address the client: an existing account by public ID, or a
  // not-yet-registered one by email invite (F-3, 2026-09-03). contractSchema
  // guarantees exactly one of the two is set.
  let clientId: string | null = null;
  let clientEmail = "";

  if (parsed.data.clientPublicId) {
    const { data: client, error: lookupError } = await supabase
      .rpc("find_by_public_id", { p_public_id: parsed.data.clientPublicId })
      .maybeSingle();

    if (lookupError) return FAIL(lookupError.message);
    if (!client) return FAIL("Bu ID ile kayıtlı kullanıcı bulunamadı.");
    if (client.role !== "CLIENT") {
      return FAIL("Bu hesap işveren olarak kayıtlı değil.");
    }
    clientId = client.id;
  } else if (parsed.data.clientEmail) {
    // Invite path: no account exists under this ID (or the freelancer never
    // asked for one). claim_invited_contract() attaches client_id once this
    // address is behind a confirmed, active session -- whether that's a
    // brand-new signup or an account that already existed under this email.
    clientEmail = parsed.data.clientEmail;
  }

  const reference = `LX-${Date.now().toString(36).toUpperCase()}`;

  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      reference,
      title: parsed.data.title,
      scope_of_work: parsed.data.scopeOfWork,
      client_id: clientId,
      client_email: clientEmail,
      freelancer_id: session.userId,
      company_id: parsed.data.companyId,
      product_type: parsed.data.productType,
      project_category: parsed.data.projectCategory,
      planned_start_date: parsed.data.plannedStartDate ?? null,
      project_amount_kurus: parsed.data.projectAmount,
    })
    .select("id")
    .single();

  if (error) return FAIL(error.message);

  let inviteMailFailed = false;
  if (clientEmail) {
    // Best-effort -- a failed invite email shouldn't fail contract creation,
    // but it also shouldn't fail silently (F-1's class of bug). The
    // freelancer sees the notice on the contract page and can resend by
    // other means; the contract itself is unaffected either way.
    const sent = await notifyContractInvite({
      to: clientEmail,
      contractId: contract.id,
      contractTitle: parsed.data.title,
      freelancerName: session.fullName,
      // Simplification: the invite path is for addresses find_by_public_id
      // didn't resolve, so this is false in the overwhelming majority of real
      // cases. If the freelancer invites someone who does already have a
      // Lancerix account under this address, they still get claimed correctly
      // by claim_invited_contract() on login -- this only affects which
      // closing sentence the invite email uses.
      hasAccount: false,
    });
    inviteMailFailed = !sent.ok;
  }

  if (parsed.data.productType === "QA_ONLY") {
    // Insert criteria
    const { error: criteriaError } = await supabase.from("acceptance_criteria").insert(
      parsed.data.criteria.map((c, index) => ({
        contract_id: contract.id,
        sequence_no: index + 1,
        description: c.description,
        check_type: "MANUAL",
        check_config: toCheckConfig(c),
      })),
    );
    if (criteriaError) return FAIL(criteriaError.message);

    // Insert workflow phases if any
    if (parsed.data.phases && parsed.data.phases.length > 0) {
      const { error: phasesError } = await supabase.from("workflow_phases").insert(
        parsed.data.phases.map((p, index) => ({
          contract_id: contract.id,
          sequence_no: index + 1,
          title: p.title,
          description: p.description || null,
          estimated_days: p.estimatedDays,
        })),
      );
      if (phasesError) return FAIL(phasesError.message);
    }

    revalidatePath("/freelancer");
    redirect(
      (inviteMailFailed
        ? `/contracts/${contract.id}?inviteMailFailed=1`
        : `/contracts/${contract.id}`) as Route,
    );
  }

  // QA_PLUS_ESCROW path (Faz 2)
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

/** Free-text criteria: only description field. */
function readCriteria(formData: FormData): CriterionDraft[] {
  const byIndex = new Map<number, { description: string }>();

  for (const [key, value] of formData.entries()) {
    const match = /^criteria\[(\d+)]\[description]$/.exec(key);
    if (!match) continue;

    const index = Number(match[1]);
    byIndex.set(index, { description: String(value) });
  }

  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => row.description.trim() !== "");
}

/** Workflow phases: title, description, estimatedDays */
function readPhases(formData: FormData) {
  const byIndex = new Map<number, { title: string; description: string; estimatedDays: string }>();

  for (const [key, value] of formData.entries()) {
    const match = /^phases\[(\d+)]\[(title|description|estimatedDays)]$/.exec(key);
    if (!match) continue;

    const index = Number(match[1]);
    const field = match[2] as "title" | "description" | "estimatedDays";
    const row = byIndex.get(index) ?? { title: "", description: "", estimatedDays: "" };
    row[field] = String(value);
    byIndex.set(index, row);
  }

  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => row.title.trim() !== "");
}

// ---------------------------------------------------------------------------
// Contract lifecycle: reject, request revision, confirm start date
// ---------------------------------------------------------------------------

export async function rejectContract(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const contractId = String(formData.get("contractId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!contractId) return FAIL("Sözleşme bulunamadı.");
  if (reason.length < 5) return FAIL("Red gerekçesini en az 5 karakter olarak yaz.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_contract", {
    p_contract_id: contractId,
    p_reason: reason,
  });

  if (error) return FAIL(error.message);

  revalidatePath(`/contracts/${contractId}`);
  return OK("Sözleşme reddedildi.");
}

export async function requestRevision(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const contractId = String(formData.get("contractId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!contractId) return FAIL("Sözleşme bulunamadı.");
  if (note.length < 5) return FAIL("Revizyon notunu en az 5 karakter olarak yaz.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_revision", {
    p_contract_id: contractId,
    p_note: note,
  });

  if (error) return FAIL(error.message);

  revalidatePath(`/contracts/${contractId}`);
  return OK("Revizyon talebi gönderildi.");
}

export async function confirmStartDate(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return FAIL("Sözleşme bulunamadı.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_start_date", {
    p_contract_id: contractId,
  });

  if (error) return FAIL(error.message);

  revalidatePath(`/contracts/${contractId}`);
  return OK("Başlangıç tarihi onaylandı.");
}

/**
 * Backfill a start date on a contract that was signed with none -- the field
 * is optional at creation, but confirm_start_date() (and therefore delivery,
 * see submitQaDelivery in qa-actions.ts) requires one. Either party can set
 * it exactly once; after that the normal mutual-confirmation flow applies.
 */
export async function setPlannedStartDate(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return FAIL("Sözleşme bulunamadı.");

  const date = String(formData.get("plannedStartDate") ?? "").trim();
  if (!date || Number.isNaN(Date.parse(date))) return FAIL("Geçerli bir tarih gir.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_planned_start_date", {
    p_contract_id: contractId,
    p_date: date,
  });

  if (error) return FAIL(error.message);

  revalidatePath(`/contracts/${contractId}`);
  return OK("Başlangıç tarihi belirlendi.");
}

/**
 * The freelancer's answer to a revision request: send it back for another
 * look. Closes the REVISION_REQUESTED dead end -- resubmit_contract() moves
 * the contract to PENDING_REVIEW, which sign_contract() also accepts, so the
 * client can sign directly from there without a second resubmit step.
 */
export async function resubmitContract(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return FAIL("Sözleşme bulunamadı.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("resubmit_contract", {
    p_contract_id: contractId,
  });

  if (error) return FAIL(error.message);

  revalidatePath(`/contracts/${contractId}`);
  return OK("Sözleşme yeniden gönderildi. Karşı taraf tekrar inceleyecek.");
}

// ---------------------------------------------------------------------------
// Milestone transitions
// ---------------------------------------------------------------------------

export async function transitionMilestone(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const milestoneId = String(formData.get("milestoneId") ?? "");
  const to = String(formData.get("toStatus") ?? "") as EscrowStatus;
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

  const { error } = await supabase.rpc("transition_milestone", {
    p_milestone_id: milestoneId,
    p_to_status: "DISPUTED",
    p_reason: reason,
  });
  if (error) return FAIL(error.message);

  revalidatePath("/", "layout");
  return OK("Dispute opened. An administrator will review it.");
}

// ---------------------------------------------------------------------------
// Acceptance criteria (client-owned)
// ---------------------------------------------------------------------------

/**
 * The client sets what "done" means for a QA_ONLY contract.
 *
 * Replaces the whole set rather than patching individual rows: the RLS
 * insert/delete policies both refuse once either party has signed, so this
 * can only run pre-signature anyway, and a full replace means the form's
 * local add/remove state and the stored rows can never drift out of sync
 * with each other.
 */
export async function addAcceptanceCriteria(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("CLIENT");

  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return FAIL("Sözleşme eksik.");

  const parsed = criteriaSubmissionSchema.safeParse(readCriteria(formData));
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const contract = await getContract(contractId, session.userId);
  if (!contract) return FAIL("Sözleşme bulunamadı.");
  if (!["DRAFT", "PENDING_REVIEW", "REVISION_REQUESTED"].includes(contract.status)) {
    return FAIL("Sözleşme imzalandığı veya imza sürecinde olduğu için kriterler değiştirilemez.");
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("acceptance_criteria")
    .delete()
    .eq("contract_id", contractId);
  if (deleteError) return FAIL(deleteError.message);

  const { error: insertError } = await supabase.from("acceptance_criteria").insert(
    parsed.data.map((c, index) => ({
      contract_id: contractId,
      sequence_no: index + 1,
      description: c.description,
      check_type: "MANUAL",
      check_config: toCheckConfig(c),
    })),
  );
  if (insertError) return FAIL(insertError.message);

  revalidatePath(`/contracts/${contractId}`);
  return OK("Kabul kriterleri kaydedildi.");
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

async function requestOrigin(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || h.get("x-real-ip") || "0.0.0.0",
    userAgent: h.get("user-agent") ?? "unknown",
  };
}

export async function signContract(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return FAIL("Missing contract.");

  // The terms box is a real gate, not decoration: without it the signature
  // row would record a document hash but no evidence the party accepted
  // Lancerix's own terms, which is the half that covers the platform.
  if (formData.get("acceptTerms") !== "on") {
    return FAIL("Devam etmek için hizmet koşullarını kabul etmelisin.");
  }

  const contract = await getContract(contractId, session.userId);
  if (!contract) return FAIL("Contract not found.");
  if (contract.freelancer_id !== session.userId && contract.client_id !== session.userId) {
    return FAIL("Bu sözleşmeyi imzalama yetkiniz yok.");
  }

  const document = renderContractDocument(
    contract,
    contract.milestones,
    {
      freelancerName:
        contract.freelancer_id === session.userId
          ? session.fullName
          : contract.counterpartyName,
      clientName:
        contract.client_id === session.userId
          ? session.fullName
          : contract.counterpartyName,
      company: contract.company,
    },
    contract.criteria,
  );

  const { ip, userAgent } = await requestOrigin();
  const supabase = await createClient();

  const { error } = await supabase.rpc("sign_contract", {
    p_contract_id: contractId,
    p_document_sha256: hashDocument(document),
    p_ip: ip,
    p_user_agent: userAgent,
    p_terms_version: TERMS_VERSION,
  });

  if (error) return FAIL(error.message);

  revalidatePath(`/contracts/${contractId}`);
  return OK("İmzalandı.");
}

/**
 * Marking a delivery is the one transition that starts a clock.
 */
export async function submitDelivery(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("FREELANCER");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  if (!milestoneId) return FAIL("Missing milestone.");

  const supabase = await createClient();

  const { data: milestone, error: milestoneError } = await supabase
    .from("milestones")
    .select("contract_id")
    .eq("id", milestoneId)
    .single();

  if (milestoneError || !milestone) return FAIL("Milestone bulunamadı.");

  const contract = await getContract(milestone.contract_id, session.userId);
  if (!contract || contract.status !== "ACTIVE" || !contract.work_started_at) {
    return FAIL("Teslimat yapabilmek için işin resmi olarak başlamış olması gerekir.");
  }

  const { error } = await supabase.rpc("transition_milestone", {
    p_milestone_id: milestoneId,
    p_to_status: "SUBMITTED",
  });

  if (error) return FAIL(error.message);

  revalidatePath("/", "layout");
  return OK("Teslim edildi.");
}
