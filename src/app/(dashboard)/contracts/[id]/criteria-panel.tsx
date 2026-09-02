"use client";

import { useActionState, useState } from "react";

import { addAcceptanceCriteria, type FormState } from "@/app/(dashboard)/actions";
import { TextArea } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { Panel } from "@/components/page-shell";
import type { AcceptanceCriterion } from "@/lib/data/contracts";
import { PROJECT_CATEGORY_INFO, type ProjectCategory } from "@/lib/validations/project-category";

const INITIAL: FormState = { error: null };

type Row = { id: number; description: string };
const blank = (id: number): Row => ({ id, description: "" });

/**
 * What "done" means for this contract -- set by the client, not the
 * freelancer, since the client is the one a green QA result binds.
 *
 * Editable by the client for as long as neither party has signed
 * (addAcceptanceCriteria replaces the whole set; RLS refuses both the
 * insert and the delete once a signature exists). Read-only otherwise --
 * to the freelancer always, and to the client too once it is locked in.
 */
export function CriteriaPanel({
  contractId,
  criteria,
  side,
  projectCategory,
  anySigned,
}: Readonly<{
  contractId: string;
  criteria: AcceptanceCriterion[];
  side: "client" | "freelancer";
  projectCategory: ProjectCategory;
  anySigned: boolean;
}>) {
  const [state, action] = useActionState(addAcceptanceCriteria, INITIAL);
  const [rows, setRows] = useState<Row[]>(
    criteria.length > 0
      ? criteria.map((c) => ({ id: c.sequence_no, description: c.description }))
      : [blank(0)],
  );

  const editable = side === "client" && !anySigned;

  if (!editable) {
    return (
      <Panel title="Kabul Kriterleri">
        {criteria.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {side === "freelancer"
              ? "Müşteri henüz kabul kriterlerini girmedi. İmza bu adımdan sonra açılır."
              : "Kriter eklenmemiş."}
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {criteria.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800/60 dark:bg-zinc-900/40"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-extrabold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                  {c.sequence_no}
                </span>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {c.description}
                </p>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-5 border-t border-zinc-200 pt-3 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Teslim edildiğinde her kriter bu listeye göre doğrulanır.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Kabul Kriterleri">
      <p className="-mt-1 mb-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        İş tamamlandığında neye bakılarak &quot;iş tamam&quot; denileceğini
        sen tanımlarsın. İmzalamadan önce en az bir kriter gerekir.
      </p>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="contractId" value={contractId} />

        {rows.map((row, index) => (
          <div key={row.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Kriter #{index + 1}
              </span>
              <button
                type="button"
                disabled={rows.length === 1}
                onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
                className="text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg px-2 py-1 transition-colors disabled:opacity-30 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                Kaldır
              </button>
            </div>
            <TextArea
              id={`crit-${row.id}`}
              name={`criteria[${index}][description]`}
              aria-label={`Kriter ${index + 1} tanımı`}
              value={row.description}
              onChange={(e) =>
                setRows((r) =>
                  r.map((x) => (x.id === row.id ? { ...x, description: e.target.value } : x)),
                )
              }
              rows={2}
              placeholder={PROJECT_CATEGORY_INFO[projectCategory].criterionPlaceholder}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setRows((r) => [...r, blank((r.at(-1)?.id ?? 0) + 1)])}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-3.5 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900 transition-colors"
        >
          + Yeni Kriter Ekle
        </button>

        <FormFeedback state={state} />
        <SubmitButton className="self-start" pendingLabel="Kaydediliyor...">
          Kabul kriterlerini kaydet
        </SubmitButton>
      </form>
    </Panel>
  );
}
