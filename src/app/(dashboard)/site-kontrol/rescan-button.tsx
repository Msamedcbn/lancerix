"use client";

import { useActionState } from "react";

import { rescanStandaloneCheck, type FormState } from "@/app/(dashboard)/standalone-qa-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

/** Shown only when a module the customer bought could not be run. The scan
 * is synchronous and can take a minute, hence the explicit pending label. */
export function RescanButton({ orderId }: Readonly<{ orderId: string }>) {
  const [state, action] = useActionState(rescanStandaloneCheck, INITIAL);

  return (
    <form action={action} className="flex flex-col items-start gap-1.5">
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton pendingLabel="Taranıyor..." className="text-xs">
        Eksik modülleri ücretsiz tekrar tara
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
