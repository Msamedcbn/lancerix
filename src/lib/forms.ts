import "server-only";

/** The shared shape every useActionState-driven form action returns. */
export type FormState = { error: string | null; ok?: string };

export const OK = (message: string): FormState => ({ error: null, ok: message });
export const FAIL = (error: string): FormState => ({ error });

export function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Formu kontrol edip tekrar dene.";
}

/**
 * Turns a raw Supabase/Postgres error into a message safe to show a user.
 *
 * The real error (schema names, constraint text, RLS policy internals) is
 * logged server-side and never returned to the client -- `error.message` is
 * an implementation detail, not a UX string, and it was never translated.
 * `fallback` is the specific, Turkish, call-site-appropriate message shown
 * instead (e.g. "Sözleşme reddedilemedi.").
 */
export function toUserMessage(error: { message: string }, fallback: string): string {
  console.error("[FAIL]", error.message);
  return fallback;
}
