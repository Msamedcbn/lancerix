"use server";

import { revalidatePath } from "next/cache";

import { requireRole, requireSession } from "@/lib/auth/session";
import type { EscrowStatus } from "@/lib/data/contracts";
import { getContract } from "@/lib/data/contracts";
import { FAIL, OK, toUserMessage, type FormState } from "@/lib/forms";
import { STATUS_LABEL } from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";

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

  if (!milestoneId || !to) return FAIL("Aşama veya hedef durum eksik.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_milestone", {
    p_milestone_id: milestoneId,
    p_to_status: to,
    p_reason: reason,
  });

  if (error) return FAIL(toUserMessage(error, "Aşama durumu güncellenemedi."));

  revalidatePath("/", "layout");
  return OK(`Aşama durumu güncellendi: ${STATUS_LABEL[to] ?? to}.`);
}

export async function raiseDispute(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const milestoneId = String(formData.get("milestoneId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (reason.length < 10) {
    return FAIL("İtirazını en az on karakterle açıkla.");
  }

  const supabase = await createClient();
  const { error: disputeError } = await supabase.from("disputes").insert({
    milestone_id: milestoneId,
    raised_by: session.userId,
    reason,
  });
  if (disputeError) return FAIL(toUserMessage(disputeError, "İtiraz kaydı oluşturulamadı."));

  const { error } = await supabase.rpc("transition_milestone", {
    p_milestone_id: milestoneId,
    p_to_status: "DISPUTED",
    p_reason: reason,
  });
  if (error) return FAIL(toUserMessage(error, "İtiraz işlenemedi."));

  revalidatePath("/", "layout");
  return OK("İtiraz açıldı. Bir yönetici inceleyecek.");
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
  if (!milestoneId) return FAIL("Aşama eksik.");

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

  if (error) return FAIL(toUserMessage(error, "Teslim gönderilemedi."));

  revalidatePath("/", "layout");
  return OK("Teslim edildi.");
}
