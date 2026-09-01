"use client";

import { useActionState, useState } from "react";

import { submitQaReport, type FormState } from "@/app/(dashboard)/admin/actions";
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

/** The QA desk's report form -- one verdict, one write-up, both go into the append-only report row. */
export function QaReportForm({
  deliveryId,
  contractId,
}: Readonly<{ deliveryId: string; contractId: string }>) {
  const [state, action] = useActionState(submitQaReport, INITIAL);
  const [status, setStatus] = useState<(typeof VERDICTS)[number]["value"]>("PASS");

  return (
    <form action={action} className="flex flex-col gap-3 border-t border-dashed border-zinc-200 pt-4 dark:border-zinc-800">
      <input type="hidden" name="deliveryId" value={deliveryId} />
      <input type="hidden" name="contractId" value={contractId} />
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
        rows={3}
        placeholder="Kriterlerden hangisi karşılandı, hangisi karşılanmadı. Bu metin müşteriye gösterilen raporun özetidir."
        required
      />

      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Kaydediliyor...">
        Raporu gönder
      </SubmitButton>
    </form>
  );
}
