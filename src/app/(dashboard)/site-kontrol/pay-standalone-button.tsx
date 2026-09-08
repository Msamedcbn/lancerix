"use client";

import { useActionState } from "react";

import { payStandaloneCheck, type FormState } from "@/app/(dashboard)/standalone-qa-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

export function PayStandaloneButton({ orderId }: Readonly<{ orderId: string }>) {
  const [state, action] = useActionState(payStandaloneCheck, INITIAL);

  return (
    <form action={action} className="flex flex-col items-start gap-1.5">
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton pendingLabel="Yönlendiriliyor..." className="text-xs">
        Öde
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
