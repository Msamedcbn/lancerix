"use client";

import { useActionState, useState } from "react";

import { submitReviewerReport, type FormState } from "@/app/reviewer-report/[token]/actions";
import { TextArea } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

const VERDICTS = [
  { value: "PASS", label: "Geçti", tone: "border-brand bg-brand-muted text-brand" },
  {
    value: "FAIL",
    label: "Kaldı",
    tone: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  },
  {
    value: "PARTIAL",
    label: "Kısmen",
    tone: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  },
] as const;

/** The reviewer's own report entry -- same fields as the admin's QaReportForm, no login required. */
export function ReviewerReportForm({ token }: Readonly<{ token: string }>) {
  const [state, action] = useActionState(submitReviewerReport, INITIAL);
  const [status, setStatus] = useState<(typeof VERDICTS)[number]["value"]>("PASS");

  if (state.ok) {
    return (
      <p className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="status" value={status} />

      <div className="flex flex-wrap gap-2">
        {VERDICTS.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => setStatus(v.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              status === v.value
                ? v.tone
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <TextArea
        name="findings"
        rows={5}
        placeholder="Kriterlerden hangisi karşılandı, hangisi karşılanmadı. Bu metin müşteriye gösterilen raporun özetidir."
        required
      />

      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Gönderiliyor...">
        Raporu gönder
      </SubmitButton>
    </form>
  );
}
