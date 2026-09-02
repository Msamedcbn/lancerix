"use client";

import { useActionState, useState } from "react";

import { setQaSelection, type FormState } from "@/app/(dashboard)/qa-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { Money } from "@/components/money";
import { Panel } from "@/components/page-shell";
import type { QaReviewer } from "@/lib/data/deliveries";
import { QA_TIERS, QA_TIER_INFO, type QaTier } from "@/lib/validations/delivery";

const INITIAL: FormState = { error: null };

const LEVEL_LABEL: Record<string, string> = {
  PRINCIPAL: "Principal / Lead",
  SENIOR: "Senior",
};

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
 */
export function QaSelectionPanel({
  contractId,
  qaTier,
  qaReviewer,
  qaFeeKurus,
  reviewers,
  side,
  anySigned,
}: Readonly<{
  contractId: string;
  qaTier: string | null;
  qaReviewer: QaReviewer | null;
  qaFeeKurus: number | null;
  reviewers: QaReviewer[];
  side: "client" | "freelancer";
  anySigned: boolean;
}>) {
  const [state, action] = useActionState(setQaSelection, INITIAL);
  const [tier, setTier] = useState<QaTier>((qaTier as QaTier) ?? "TIER1");
  const [reviewerId, setReviewerId] = useState(qaReviewer?.id ?? "");

  const editable = side === "client" && !anySigned;
  const needsReviewer = QA_TIER_INFO[tier].needsReviewer;

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
                {qaFeeKurus ? <Money kurus={qaFeeKurus} /> : QA_TIER_INFO[qaTier as QaTier].price}
              </span>
            </div>
            {qaReviewer ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                İnceleyecek: {LEVEL_LABEL[qaReviewer.level] ?? qaReviewer.level} ·{" "}
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
        <input type="hidden" name="reviewerId" value={reviewerId} />

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

        {needsReviewer ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              İncelemeyi kim yapsın?
            </legend>

            {reviewers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Şu an müsait mühendis yok. Temel paketle devam edebilirsin
                veya sonra tekrar bakabilirsin.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {reviewers.map((r) => {
                  const unrated = r.rate_kurus == null;
                  return (
                    <label
                      key={r.id}
                      htmlFor={`reviewer-${r.id}`}
                      className={`has-checked:border-brand has-checked:bg-brand-muted flex flex-col gap-1 rounded-lg border border-zinc-200 px-3 py-3 dark:border-zinc-800 ${
                        unrated
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        <input
                          id={`reviewer-${r.id}`}
                          type="radio"
                          name="reviewerChoice"
                          value={r.id}
                          checked={reviewerId === r.id}
                          disabled={unrated}
                          onChange={() => setReviewerId(r.id)}
                          className="accent-brand mt-1"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
                            {LEVEL_LABEL[r.level] ?? r.level}
                          </span>
                          <span className="tnum block text-xs text-zinc-500 dark:text-zinc-400">
                            {r.years_experience}+ yıl
                            {unrated ? " · ücret belirlenmedi" : null}
                          </span>
                          {r.rate_kurus != null ? (
                            <span className="tnum block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              <Money kurus={r.rate_kurus} />
                            </span>
                          ) : null}
                        </span>
                      </span>

                      {r.specialties.length > 0 ? (
                        <span className="flex flex-wrap gap-1 pl-6">
                          {r.specialties.map((s) => (
                            <span
                              key={s}
                              className="rounded bg-zinc-100 px-1.5 py-0.5 text-[0.7rem] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                            >
                              {s}
                            </span>
                          ))}
                        </span>
                      ) : null}

                      {r.bio ? (
                        <span className="block pl-6 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {r.bio}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
        ) : null}

        <FormFeedback state={state} />
        <SubmitButton
          className="self-start"
          pendingLabel="Kaydediliyor..."
          disabled={needsReviewer && reviewerId === ""}
        >
          QA paketini kaydet
        </SubmitButton>
      </form>
    </Panel>
  );
}
