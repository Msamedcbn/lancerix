import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ContractMessage = Tables<"contract_messages">;

export type MessageRow = ContractMessage & {
  senderName: string;
  isMine: boolean;
};

/**
 * The thread on one contract, oldest first.
 *
 * RLS already scopes this to the caller through is_contract_party(), so
 * there is no user filter -- a contract the caller cannot see returns
 * nothing rather than someone else's conversation.
 *
 * Sender names come from one party_display_names() call rather than a join
 * per row: profiles is not readable by a counterparty directly (only self
 * and admin), which is why that security-definer function exists.
 */
export async function listMessages(
  contractId: string,
  viewerId: string,
): Promise<MessageRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contract_messages")
    .select("*")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const messages = data ?? [];
  if (messages.length === 0) return [];

  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const { data: names } = await supabase.rpc("party_display_names", {
    p_ids: senderIds,
  });

  const nameById = new Map(
    (names ?? []).map((n) => [n.id, n.full_name] as const),
  );

  return messages.map((m) => ({
    ...m,
    senderName: nameById.get(m.sender_id) ?? "Bilinmeyen",
    isMine: m.sender_id === viewerId,
  }));
}
