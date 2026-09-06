"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { FAIL, firstIssue, OK, toUserMessage, type FormState } from "@/lib/forms";
import { notifyNewMessage } from "@/lib/notify/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type { FormState };

/**
 * How the new-message email is rationed.
 *
 * QUIET_MINUTES: at most one email per contract per recipient in this window,
 * so a rapid back-and-forth is one notification instead of ten. The failure
 * mode being avoided is not annoyance for its own sake -- it is the user
 * muting the sender, after which the feature may as well not exist.
 *
 * ACTIVE_MINUTES: if the recipient posted in this thread that recently, they
 * are reading it right now. Emailing someone about a conversation they are
 * currently having is the clearest way to teach them the emails are noise.
 */
const QUIET_MINUTES = 30;
const ACTIVE_MINUTES = 15;

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const PREVIEW_CHARS = 140;

/**
 * Email the other party, unless the thread says not to. Never throws and never
 * blocks the post: a message that was recorded is recorded whether or not the
 * mail went out, same rule the rest of notify/email.ts follows.
 *
 * Runs with the admin client because it needs the counterparty's address and
 * writes debounce state in a table with no RLS policies -- neither is
 * something the sender's own session should be able to reach.
 */
async function notifyCounterparty(
  contractId: string,
  senderId: string,
  senderName: string,
  body: string,
): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: contract } = await admin
      .from("contracts")
      .select("title, freelancer_id, client_id, client_email")
      .eq("id", contractId)
      .maybeSingle();
    if (!contract) return;

    const recipientId =
      contract.freelancer_id === senderId ? contract.client_id : contract.freelancer_id;

    // An invited-but-unclaimed contract has no client_id yet. The invite email
    // already carries the contract link, and there is no account to notify.
    if (!recipientId) return;

    const [{ data: notice }, { data: recentReply }] = await Promise.all([
      admin
        .from("contract_message_notices")
        .select("notified_at")
        .eq("contract_id", contractId)
        .eq("recipient_id", recipientId)
        .maybeSingle(),
      admin
        .from("contract_messages")
        .select("id")
        .eq("contract_id", contractId)
        .eq("sender_id", recipientId)
        .gte("created_at", minutesAgo(ACTIVE_MINUTES))
        .limit(1)
        .maybeSingle(),
    ]);

    if (recentReply) return;
    if (notice && notice.notified_at > minutesAgo(QUIET_MINUTES)) return;

    const sent = await notifyNewMessage({
      toUserId: recipientId,
      fallbackEmail: contract.client_email ?? "",
      contractId,
      contractTitle: contract.title,
      senderName,
      preview:
        body.length > PREVIEW_CHARS ? `${body.slice(0, PREVIEW_CHARS)}...` : body,
    });

    // Only stamp the debounce on a send that actually happened, so a transient
    // mail failure does not silence the next half hour of notifications too.
    if (!sent.ok) return;

    await admin
      .from("contract_message_notices")
      .upsert(
        { contract_id: contractId, recipient_id: recipientId, notified_at: new Date().toISOString() },
        { onConflict: "contract_id,recipient_id" },
      );
  } catch {
    // Notification is best-effort by design; the message is already recorded.
  }
}

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

  if (error) return FAIL(toUserMessage(error, "Mesaj gönderilemedi."));

  await notifyCounterparty(
    parsed.data.contractId,
    session.userId,
    session.fullName,
    parsed.data.body,
  );

  revalidatePath(`/contracts/${parsed.data.contractId}`);
  return OK("Gönderildi.");
}
