"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  postMessage,
  type FormState,
} from "@/app/(dashboard)/contracts/[id]/actions/messages";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import type { MessageRow } from "@/lib/data/messages";

const INITIAL: FormState = { error: null };

const when = (value: string) => value.slice(0, 16).replace("T", " ");

/**
 * The conversation between the two parties on one contract.
 *
 * Deliberately not realtime: a message lands on submit and the page
 * revalidates. A websocket would be a second infrastructure pattern for
 * something both parties check on the same cadence they check the delivery
 * itself. When that stops being true, this is the component to swap.
 *
 * Messages are append-only in the database, so there is no edit or delete
 * affordance here -- the thread is part of the contract's record.
 */
export function MessageThread({
  contractId,
  messages,
  phaseId = null,
  compact = false,
}: Readonly<{
  contractId: string;
  messages: MessageRow[];
  phaseId?: string | null;
  compact?: boolean;
}>) {
  const [state, action] = useActionState(postMessage, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Clear the textarea after a successful post. useActionState keeps the
  // previous value otherwise, which reads as "it didn't send".
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [state.ok]);

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Henüz mesaj yok. Sorular ve düzeltme notları burada kalır, kayda
          geçer.
        </p>
      ) : (
        <ol
          className={`flex flex-col gap-3 overflow-y-auto pr-1 ${
            compact ? "max-h-64" : "max-h-96"
          }`}
        >
          {messages.map((m) => (
            <li
              key={m.id}
              className={`flex flex-col gap-1 ${m.isMine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  m.isMine
                    ? "bg-brand text-brand-foreground"
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {m.body}
                </p>
              </div>
              <p className="tnum px-1 text-[0.7rem] text-zinc-400">
                {m.isMine ? "Sen" : m.senderName} · {when(m.created_at)}
              </p>
            </li>
          ))}
          <div ref={endRef} />
        </ol>
      )}

      <form ref={formRef} action={action} className="flex flex-col gap-2">
        <input type="hidden" name="contractId" value={contractId} />
        {phaseId ? <input type="hidden" name="phaseId" value={phaseId} /> : null}
        <textarea
          name="body"
          rows={compact ? 2 : 3}
          required
          maxLength={4000}
          placeholder={
            phaseId
              ? "Bu faz hakkında bir not veya soru yaz..."
              : "Bir soru sor veya düzeltme notu yaz..."
          }
          className="focus:border-brand focus:ring-brand/20 w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm text-zinc-950 shadow-xs focus:ring-2 focus:outline-none dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <FormFeedback state={state} />
        <SubmitButton className="self-end" pendingLabel="Gönderiliyor...">
          Gönder
        </SubmitButton>
      </form>
    </div>
  );
}
