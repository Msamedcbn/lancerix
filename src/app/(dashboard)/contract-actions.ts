"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { assertMilestoneGross, DEFAULT_PLATFORM_FEE_BPS } from "@/lib/escrow/money";
import type { AcceptanceCriterion, Contract } from "@/lib/data/contracts";
import { renderContractDocument } from "@/lib/contracts/document";
import { notifyContractInvite } from "@/lib/notify/email";
import { DEFAULT_STOPAJ_BPS } from "@/lib/tax/stopaj";
import { FAIL, firstIssue, toUserMessage, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { toCheckConfig } from "@/lib/validations/acceptance-criteria";
import {
  contractSchema,
  DEFAULT_OBJECTION_WINDOW_DAYS,
} from "@/lib/validations/contract";

import { readCriteria, readMilestones, readPhases } from "./contract-form-data";

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

// Faz 1 ships as a verification/reporting SaaS with no fund custody --
// QA_PLUS_ESCROW is Faz 2 design that contractSchema still parses (see the
// "(Faz 2, disabled)" comment on it in contract.ts) so document.ts and its
// tests can keep exercising that shape. contract-form.tsx never lets a
// freelancer select it (its useState has no setter), but that is a UI-only
// restriction -- a Server Action is POST-able directly regardless of what the
// rendered form allows, so the actual gate has to live here, at every entry
// point that reads productType from raw formData.
const PHASE_1_PRODUCT_TYPE_MESSAGE = "Bu sözleşme türü şu an seçilemiyor.";

export type PreviewResult = { error: string | null; document?: string };

export async function previewContract(
  _prev: PreviewResult,
  formData: FormData,
): Promise<PreviewResult> {
  const session = await requireRole("FREELANCER");

  const productType =
    formData.get("productType") === "QA_PLUS_ESCROW" ? "QA_PLUS_ESCROW" : "QA_ONLY";
  if (productType === "QA_PLUS_ESCROW") return FAIL(PHASE_1_PRODUCT_TYPE_MESSAGE);

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

/**
 * Mark the project request this contract came from as converted.
 *
 * Returns true when the link failed, so the caller can say so rather than
 * leaving the request sitting OPEN with no explanation -- the contract itself
 * is already created and valid either way, which is why this never throws.
 */
async function linkProjectRequest(
  formData: FormData,
  contractId: string,
): Promise<boolean> {
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) return false;

  const supabase = await createClient();
  const { error } = await supabase.rpc("convert_project_request", {
    p_request_id: requestId,
    p_contract_id: contractId,
  });

  return Boolean(error);
}

export async function createContract(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("FREELANCER");

  const productType = formData.get("productType") === "QA_PLUS_ESCROW"
    ? "QA_PLUS_ESCROW"
    : "QA_ONLY";
  if (productType === "QA_PLUS_ESCROW") return FAIL(PHASE_1_PRODUCT_TYPE_MESSAGE);

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

    if (lookupError) return FAIL(toUserMessage(lookupError, "Müşteri arama sırasında bir hata oluştu."));
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

  if (error) return FAIL(toUserMessage(error, "Sözleşme oluşturulamadı."));

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
    if (criteriaError) return FAIL(toUserMessage(criteriaError, "Kabul kriterleri kaydedilemedi."));

    // Insert workflow phases if any, then their checklist items -- items
    // reference the phase row's real id, so phases must be inserted (and the
    // ids read back) first.
    if (parsed.data.phases && parsed.data.phases.length > 0) {
      const { data: insertedPhases, error: phasesError } = await supabase
        .from("workflow_phases")
        .insert(
          parsed.data.phases.map((p, index) => ({
            contract_id: contract.id,
            sequence_no: index + 1,
            title: p.title,
            description: p.description || null,
            start_date: p.startDate,
            end_date: p.endDate,
          })),
        )
        .select("id, sequence_no");
      if (phasesError) return FAIL(toUserMessage(phasesError, "İş akışı fazları kaydedilemedi."));

      const idBySequence = new Map((insertedPhases ?? []).map((row) => [row.sequence_no, row.id]));
      const itemRows = parsed.data.phases.flatMap((phase, index) => {
        const phaseId = idBySequence.get(index + 1);
        if (!phaseId) return [];
        return phase.items.map((title, itemIndex) => ({
          phase_id: phaseId,
          sequence_no: itemIndex + 1,
          title,
        }));
      });
      if (itemRows.length > 0) {
        const { error: itemsError } = await supabase
          .from("workflow_phase_items")
          .insert(itemRows);
        if (itemsError) return FAIL(toUserMessage(itemsError, "Faz maddeleri kaydedilemedi."));
      }
    }

    // Link the client's project request to the contract it produced, when
    // this contract came from one. convert_project_request() re-checks that
    // the contract really belongs to this freelancer and this client, so a
    // forged requestId in the form cannot attach someone else's request.
    const requestLinkFailed = await linkProjectRequest(formData, contract.id);

    revalidatePath("/freelancer");
    revalidatePath("/freelancer/requests");

    const flags = [
      inviteMailFailed ? "inviteMailFailed=1" : "",
      requestLinkFailed ? "requestLinkFailed=1" : "",
    ].filter(Boolean);

    redirect(
      (flags.length > 0
        ? `/contracts/${contract.id}?${flags.join("&")}`
        : `/contracts/${contract.id}`) as Route,
    );
  }

  // QA_PLUS_ESCROW path (Faz 2) -- unreachable while PHASE_1_PRODUCT_TYPE_MESSAGE
  // gates productType above, kept so document.ts and this file's Faz 2 shape
  // stay exercised by contract.test.ts until Faz 2 actually starts.
  const { data: terms, error: termsError } = await supabase
    .from("contracts")
    .select("platform_fee_bps, stopaj_bps")
    .eq("id", contract.id)
    .single();

  if (termsError) return FAIL(toUserMessage(termsError, "Sözleşme koşulları okunamadı."));

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

  if (milestoneError) return FAIL(toUserMessage(milestoneError, "Aşamalar kaydedilemedi."));

  revalidatePath("/freelancer");
  redirect(`/contracts/${contract.id}`);
}
