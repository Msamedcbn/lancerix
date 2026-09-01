"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { FAIL, firstIssue, OK, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

export type { FormState };

const messageSchema = z.object({
  contractId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Boş mesaj gönderilemez.")
    .max(4000, "Bu mesaj çok uzun."),
  phaseId: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

/**
 * Posting to the contract thread.
 *
 * sender_id is taken from the session, never from the form: the insert
 * policy requires sender_id = auth.uid(), so a forged value would be
 * rejected by Postgres anyway, but not sending it at all is the clearer
 * contract. phaseId, when set, is what makes "revision notes per stage" a
 * conversation attached to a phase rather than a free-floating comment.
 */
export async function postMessage(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const parsed = messageSchema.safeParse({
    contractId: formData.get("contractId"),
    body: formData.get("body"),
    phaseId: formData.get("phaseId") ?? "",
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.from("contract_messages").insert({
    contract_id: parsed.data.contractId,
    sender_id: session.userId,
    body: parsed.data.body,
    phase_id: parsed.data.phaseId,
  });

  if (error) return FAIL(error.message);

  revalidatePath(`/contracts/${parsed.data.contractId}`);
  return OK("Gönderildi.");
}
