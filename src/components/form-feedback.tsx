"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import type { FormState } from "@/app/(dashboard)/actions";

/**
 * Both outcomes of a server action, in one place. An action that succeeded says
 * so: a form that silently resets leaves the user guessing whether it worked.
 */
export function FormFeedback({ state }: Readonly<{ state: FormState }>) {
  if (state.error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p className="text-sm text-emerald-700" role="status">
        {state.ok}
      </p>
    );
  }
  return null;
}

export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: Readonly<{ children: React.ReactNode; pendingLabel?: string }> &
  React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (pendingLabel ?? "Working...") : children}
    </Button>
  );
}
