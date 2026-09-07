"use client";

import { useFormStatus } from "react-dom";

import type { FormState } from "@/lib/forms";

/**
 * Both outcomes of a server action, in one place. An action that succeeded says
 * so: a form that silently resets leaves the user guessing whether it worked.
 */
export function FormFeedback({ state }: Readonly<{ state: FormState }>) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
      >
        {state.error}
      </p>
    );
  }

  if (state.ok) {
    return (
      <p
        role="status"
        className="border-brand/20 bg-brand-muted text-brand rounded-lg border px-3 py-2 text-sm"
      >
        {state.ok}
      </p>
    );
  }

  return null;
}

type ButtonTone = "primary" | "secondary" | "danger";

const TONE: Record<ButtonTone, string> = {
  primary:
    "bg-brand text-brand-foreground hover:opacity-90 disabled:opacity-50",
  secondary:
    "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
  danger:
    "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:bg-zinc-950 dark:text-rose-300 dark:hover:bg-rose-950/40",
};

/**
 * The pressed state moves the button a pixel rather than changing its colour.
 * Colour says "different"; movement says "received", which is what a click
 * needs to confirm.
 */
export function SubmitButton({
  children,
  pendingLabel,
  tone = "primary",
  className = "",
  disabled = false,
}: Readonly<{
  children: React.ReactNode;
  pendingLabel?: string;
  tone?: ButtonTone;
  className?: string;
  /** For a form that is incomplete in a way only the caller can judge. */
  disabled?: boolean;
}>) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap active:scale-[0.98] disabled:cursor-not-allowed ${TONE[tone]} ${className}`}
    >
      {pending ? (pendingLabel ?? "Gönderiliyor...") : children}
    </button>
  );
}
