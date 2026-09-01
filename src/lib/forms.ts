import "server-only";

/** The shared shape every useActionState-driven form action returns. */
export type FormState = { error: string | null; ok?: string };

export const OK = (message: string): FormState => ({ error: null, ok: message });
export const FAIL = (error: string): FormState => ({ error });

export function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Formu kontrol edip tekrar dene.";
}
