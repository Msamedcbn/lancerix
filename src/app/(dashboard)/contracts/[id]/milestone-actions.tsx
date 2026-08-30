"use client";

import { useActionState } from "react";

import {
  raiseDispute,
  submitDelivery,
  transitionMilestone,
  type FormState,
} from "@/app/(dashboard)/actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { Input } from "@/components/ui/input";
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
  actions: ReadonlyArray<{ to: EscrowStatus; label: string }>;
  canDispute: boolean;
  canDeliver: boolean;
}>) {
  const [state, action] = useActionState(transitionMilestone, INITIAL);
  const [deliverState, deliverAction] = useActionState(submitDelivery, INITIAL);
  const [disputeState, disputeAction] = useActionState(raiseDispute, INITIAL);

  if (actions.length === 0 && !canDispute && !canDeliver) return null;

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Delivery has its own action rather than sharing the generic one:
            it starts the objection clock, and the client has to be told the
            deadline the database just wrote. */}
        {canDeliver ? (
          <form action={deliverAction}>
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <SubmitButton size="sm" pendingLabel="Delivering...">
              Mark delivered
            </SubmitButton>
          </form>
        ) : null}
        {actions.map(({ to, label }) => (
          <form key={to} action={action}>
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <input type="hidden" name="toStatus" value={to} />
            <SubmitButton size="sm" pendingLabel="Working...">
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
          <div className="flex gap-2">
            <Input
              name="reason"
              placeholder="What is wrong with this delivery?"
              minLength={10}
              required
            />
            <SubmitButton
              size="sm"
              variant="destructive"
              pendingLabel="Opening..."
            >
              Dispute
            </SubmitButton>
          </div>
          <p className="text-muted-foreground text-xs">
            A dispute stops the clock. Only an administrator can end it, and it
            can only end in a release or a cancellation.
          </p>
          <FormFeedback state={disputeState} />
        </form>
      ) : null}
    </div>
  );
}
