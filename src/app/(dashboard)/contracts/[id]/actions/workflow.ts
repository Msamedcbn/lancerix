"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleWorkflowPhase(
  contractId: string,
  phaseId: string,
  isCompleted: boolean
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("workflow_phases")
    .update({ is_completed: isCompleted })
    .eq("id", phaseId)
    .eq("contract_id", contractId);

  if (error) {
    console.error("Error toggling workflow phase:", error);
    return { error: error.message };
  }

  revalidatePath(`/contracts/${contractId}`);
  return { success: true };
}

/**
 * The freelancer's note for a phase -- what happened, what's blocked, what the
 * client should know. workflow_phases_update_freelancer already covers this
 * column, so no new policy: only the contract's freelancer can write, both
 * parties can read.
 */
export async function updatePhaseNotes(
  contractId: string,
  phaseId: string,
  notes: string,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("workflow_phases")
    .update({ notes: notes.trim() === "" ? null : notes.trim() })
    .eq("id", phaseId)
    .eq("contract_id", contractId);

  if (error) {
    console.error("Error updating phase notes:", error);
    return { error: error.message };
  }

  revalidatePath(`/contracts/${contractId}`);
  return { success: true };
}
