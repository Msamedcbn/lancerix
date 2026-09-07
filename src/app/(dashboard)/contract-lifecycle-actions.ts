"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { FAIL, OK, toUserMessage, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

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

  if (error) return FAIL(toUserMessage(error, "Sözleşme reddedilemedi."));

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

  if (error) return FAIL(toUserMessage(error, "Revizyon talebi gönderilemedi."));

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

  if (error) return FAIL(toUserMessage(error, "Başlangıç tarihi onaylanamadı."));

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

  if (error) return FAIL(toUserMessage(error, "Başlangıç tarihi kaydedilemedi."));

  revalidatePath(`/contracts/${contractId}`);
  return OK("Başlangıç tarihi belirlendi.");
}

/**
 * The other half of the start-date handshake: say no. Without this the only
 * moves were "set once" and "confirm", so a party who could not make the
 * proposed date had to settle it off-platform. An optional counter date turns
 * the objection into a proposal in the same submit; see
 * 20260905000000_reject_start_date.sql for why that pre-confirms the
 * proposer's own side.
 */
export async function rejectStartDate(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return FAIL("Sözleşme bulunamadı.");

  const counter = String(formData.get("counterDate") ?? "").trim();
  if (counter && Number.isNaN(Date.parse(counter))) {
    return FAIL("Geçerli bir tarih gir.");
  }

  const note = String(formData.get("note") ?? "").trim();
  if (note.length > 500) return FAIL("Gerekçe en fazla 500 karakter olabilir.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_start_date", {
    p_contract_id: contractId,
    ...(counter ? { p_counter_date: counter } : {}),
    ...(note ? { p_note: note } : {}),
  });

  if (error) return FAIL(toUserMessage(error, "Karşı teklif gönderilemedi."));

  revalidatePath(`/contracts/${contractId}`);
  return OK(
    counter
      ? "Yeni tarih önerildi, karşı tarafın onayı bekleniyor."
      : "Tarihe itiraz edildi, yeni bir tarih belirlenebilir.",
  );
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

  if (error) return FAIL(toUserMessage(error, "Sözleşme yeniden gönderilemedi."));

  revalidatePath(`/contracts/${contractId}`);
  return OK("Sözleşme yeniden gönderildi. Karşı taraf tekrar inceleyecek.");
}
