"use client";

import { useActionState } from "react";

import { signContract, type FormState } from "@/app/(dashboard)/actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

/**
 * Signing is a single button on purpose: what is being agreed to is the
 * document above it, not a checkbox. The hash of that exact text is what gets
 * stored, so the record can prove which words were on screen.
 */
export function SignContract({
  contractId,
  alreadySigned,
  otherPartySigned,
}: Readonly<{
  contractId: string;
  alreadySigned: boolean;
  otherPartySigned: boolean;
}>) {
  const [state, action] = useActionState(signContract, INITIAL);

  if (alreadySigned) {
    return (
      <p className="text-sm text-emerald-700" role="status">
        You have signed.{" "}
        {otherPartySigned
          ? "Both parties have signed and the contract is active."
          : "Waiting for the other party."}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="contractId" value={contractId} />
      <p className="text-muted-foreground text-sm">
        Signing records your name, the time, your IP address and a fingerprint
        of the exact text above. If the terms are edited afterwards, that
        fingerprint stops matching and the change is visible on the record.
      </p>
      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Signing...">
        Sign this contract
      </SubmitButton>
    </form>
  );
}
