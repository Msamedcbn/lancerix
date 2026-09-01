"use client";

import { MessageSquare } from "lucide-react";

import { MessageThread } from "@/app/(dashboard)/contracts/[id]/message-thread";
import type { MessageRow } from "@/lib/data/messages";

/**
 * The conversation about one phase, collapsed by default.
 *
 * A phase column is narrow and a plan is read as a whole, so an always-open
 * thread per phase would bury the flow it hangs off. <details> keeps the
 * count visible -- which is the part that matters at a glance, "is there
 * something to read here" -- and the reading itself one click away.
 *
 * This is the client's half of "revision notes per stage": the freelancer's
 * own note has its own field, but a client asking for a change had nowhere
 * to put it that stayed attached to the phase.
 */
export function PhaseThread({
  contractId,
  phaseId,
  messages,
}: Readonly<{
  contractId: string;
  phaseId: string;
  messages: MessageRow[];
}>) {
  return (
    <details className="group rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
        <MessageSquare className="size-3.5" aria-hidden />
        {messages.length > 0
          ? `${messages.length} not`
          : "Bu faza not ekle"}
        <span
          aria-hidden
          className="ml-auto text-[0.65rem] text-zinc-400 group-open:hidden"
        >
          aç
        </span>
      </summary>
      <div className="border-t border-zinc-200/80 p-2.5 dark:border-zinc-800/80">
        <MessageThread
          contractId={contractId}
          messages={messages}
          phaseId={phaseId}
          compact
        />
      </div>
    </details>
  );
}
