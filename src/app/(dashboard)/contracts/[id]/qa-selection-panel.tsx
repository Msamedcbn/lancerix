"use client";

import { useActionState, useState } from "react";

import { setQaSelection, type FormState } from "@/app/(dashboard)/qa-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { Money } from "@/components/money";
import { Panel } from "@/components/page-shell";
import type { QaReviewer } from "@/lib/data/deliveries";
import { LEVEL_LABEL, type ReviewerLevel } from "@/lib/labels";
import { QA_TIERS, QA_TIER_INFO, type QaTier } from "@/lib/validations/delivery";

const INITIAL: FormState = { error: null };

/**
 * The client picks how rigorously the work gets checked, before either
 * party signs -- not the freelancer after delivery. The party being graded
 * choosing their own grading rigor is a conflict of interest; the client is
 * the one buying assurance, so they decide what they're buying, the same
 * moment they set the acceptance criteria.
 *
 * Editable by the client for as long as neither party has signed
 * (set_qa_selection() refuses both directions once a signature exists).
 * Read-only otherwise -- to the freelancer always, and to the client too
 * once it is locked in.
 *
 * No tier needs a reviewer pick anymore (2026-09-08 restructure -- Tier3 is
 * now a fixed ₺3.500 the founder reviews personally, no roster selection).
 * `qaReviewer` is still read-only-displayed below for any contract that
 * already has one set from before this change.
 */
export function QaSelectionPanel({
  contractId,
  qaTier,
  qaReviewer,
  qaFeeKurus,
  side,
  anySigned,
}: Readonly<{
  contractId: string;
  qaTier: string | null;
  qaReviewer: QaReviewer | null;
  qaFeeKurus: number | null;
  side: "client" | "freelancer";
  anySigned: boolean;
}>) {
  const [state, action] = useActionState(setQaSelection, INITIAL);
  const [tier, setTier] = useState<QaTier>((qaTier as QaTier) ?? "TIER1");

  const editable = side === "client" && !anySigned;

  if (!editable) {
    return (
      <Panel title="QA Paketi">
        {!qaTier ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {side === "freelancer"
              ? "Müşteri henüz QA paketini seçmedi. İmza bu adımdan sonra açılır."
              : "Paket seçilmemiş."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                {QA_TIER_INFO[qaTier as QaTier].label}
              </span>
              <span className="tnum rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {/* qaFeeKurus can legitimately be 0 (Tier1 is permanently
                    free) -- that must still render as ₺0,00, not fall
                    through to the tier's static list price. Only a true
                    null (no fee ever computed, e.g. a legacy row from
                    before fee tracking) falls back to the static string. */}
                {qaFeeKurus !== null ? <Money kurus={qaFeeKurus} /> : QA_TIER_INFO[qaTier as QaTier].price}
              </span>
            </div>
            {qaReviewer ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                İnceleyecek: {LEVEL_LABEL[qaReviewer.level as ReviewerLevel] ?? qaReviewer.level} ·{" "}
                {qaReviewer.years_experience}+ yıl
              </p>
            ) : null}
          </div>
        )}
      </Panel>
    );
  }

  return (
    <Panel title="QA Paketi">
      <p className="-mt-1 mb-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        Teslimatın nasıl doğrulanacağını sen seçersin. İmzalamadan önce bir
        paket gerekir.
      </p>

      <form action={action} className="flex flex-col gap-6">
        <input type="hidden" name="contractId" value={contractId} />
        <input type="hidden" name="tier" value={tier} />

        <div className="grid gap-4 sm:grid-cols-2">
          {QA_TIERS.map((value) => {
            const info = QA_TIER_INFO[value];
            const isSelected = tier === value;

            return (
              <label
                key={value}
                htmlFor={`tier-${value}`}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  isSelected
                    ? "border-brand bg-brand/5 shadow-md shadow-brand/10 ring-2 ring-brand/20 dark:bg-brand/10"
                    : "border-zinc-200/80 bg-white/90 hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/80"
                } ${info.available ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <input
                        id={`tier-${value}`}
                        type="radio"
                        name="tierChoice"
                        value={value}
                        checked={isSelected}
                        disabled={!info.available}
                        onChange={() => setTier(value)}
                        className="accent-brand mt-0.5 size-4"
                      />
                      <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                        {info.label}
                      </span>
                    </div>
                    <span className="tnum rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {info.price}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {info.hint}
                  </p>
                  <ul className="mt-3 flex flex-col gap-1.5 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-800">
                    {info.details.map((detail, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-1.5 text-[0.75rem] text-zinc-500 dark:text-zinc-400"
                      >
                        <span className="text-brand font-bold">✓</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </label>
            );
          })}
        </div>

        <FormFeedback state={state} />
        <SubmitButton className="self-start" pendingLabel="Kaydediliyor...">
          QA paketini kaydet
        </SubmitButton>
      </form>
    </Panel>
  );
}
