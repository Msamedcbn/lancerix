"use client";

import { useActionState } from "react";

import {
  raiseDispute,
  submitDelivery,
  transitionMilestone,
} from "@/app/(dashboard)/milestone-transition-actions";
import { TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import type { FormState } from "@/lib/forms";
import type { Enums } from "@/lib/supabase/database.types";

type EscrowStatus = Enums<"escrow_status">;

const INITIAL: FormState = { error: null };

/**
 * One button per legal move, decided on the server and passed in. This
 * component never works out what is allowed: the state machine does, in
 * Postgres, and an illegal edge is refused there whatever this renders.
 */
export function MilestoneActions({
  milestoneId,
  actions,
  canDispute,
  canDeliver,
}: Readonly<{
  milestoneId: string;
  actions: ReadonlyArray<{ to: EscrowStatus; label: string; tone?: "danger" }>;
  canDispute: boolean;
  canDeliver: boolean;
}>) {
  const [state, action] = useActionState(transitionMilestone, INITIAL);
  const [deliverState, deliverAction] = useActionState(submitDelivery, INITIAL);
  const [disputeState, disputeAction] = useActionState(raiseDispute, INITIAL);

  if (actions.length === 0 && !canDispute && !canDeliver) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        {/* Delivery has its own action rather than sharing the generic one:
            it starts the objection clock, and the client has to be told the
            deadline the database just wrote. */}
        {canDeliver ? (
          <form action={deliverAction}>
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <SubmitButton pendingLabel="Gönderiliyor...">
              Teslim ettim
            </SubmitButton>
          </form>
        ) : null}

        {actions.map(({ to, label, tone }) => (
          <form key={to} action={action}>
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <input type="hidden" name="toStatus" value={to} />
            <SubmitButton
              tone={tone ?? "secondary"}
              pendingLabel="İşleniyor..."
            >
              {label}
            </SubmitButton>
          </form>
        ))}
      </div>

      <FormFeedback state={state} />
      <FormFeedback state={deliverState} />

      {canDispute ? (
        <form action={disputeAction} className="flex flex-col gap-2">
          <input type="hidden" name="milestoneId" value={milestoneId} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <TextInput
              name="reason"
              placeholder="Teslimatta sorun nedir?"
              minLength={10}
              required
            />
            <SubmitButton tone="danger" pendingLabel="Açılıyor...">
              İtiraz et
            </SubmitButton>
          </div>
          <p className="max-w-[62ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            İtiraz süreyi durdurur. Yalnızca bir yönetici sonlandırabilir ve
            süreç ya serbest bırakmayla ya iptalle biter.
          </p>
          <FormFeedback state={disputeState} />
        </form>
      ) : null}
    </div>
  );
}
