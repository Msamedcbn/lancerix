"use client";

import { useActionState, useState } from "react";

import {
  chooseQaTier,
  decideDelivery,
  submitQaDelivery,
  type FormState,
} from "@/app/(dashboard)/qa-actions";
import { Field, TextArea, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import type { QaReviewer } from "@/lib/data/deliveries";
import {
  QA_TIERS,
  QA_TIER_INFO,
  type QaTier,
} from "@/lib/validations/delivery";
import {
  PROJECT_CATEGORY_INFO,
  type ProjectCategory,
} from "@/lib/validations/project-category";

const INITIAL: FormState = { error: null };

const LEVEL_LABEL: Record<string, string> = {
  PRINCIPAL: "Principal / Lead",
  SENIOR: "Senior",
};

/**
 * The freelancer hands the work over.
 *
 * The two URL fields are the same columns for every contract; only what they
 * are CALLED changes with the project category. Asking a video editor for a
 * "staging address" is the kind of detail that tells a user the product was
 * not built for them.
 */
export function DeliveryForm({
  contractId,
  projectCategory,
}: Readonly<{ contractId: string; projectCategory: ProjectCategory }>) {
  const [state, action] = useActionState(submitQaDelivery, INITIAL);
  const info = PROJECT_CATEGORY_INFO[projectCategory];

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="contractId" value={contractId} />

      <Field label={info.deliveryLabel} htmlFor="stagingUrl" hint={info.deliveryHint}>
        <TextInput
          id="stagingUrl"
          name="stagingUrl"
          placeholder={info.deliveryPlaceholder}
          inputMode="url"
          required
        />
      </Field>

      {info.secondaryLabel ? (
        <Field label={info.secondaryLabel} htmlFor="prUrl" hint="İsteğe bağlı.">
          <TextInput
            id="prUrl"
            name="prUrl"
            placeholder={info.secondaryPlaceholder}
            inputMode="url"
          />
        </Field>
      ) : null}

      <Field label="Not" htmlFor="notes" hint="İsteğe bağlı.">
        <TextArea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Karşı tarafın bilmesi gereken bir şey varsa."
        />
      </Field>

      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Kaydediliyor...">
        Teslim et
      </SubmitButton>
    </form>
  );
}

/**
 * Picking the QA tier, and for Tier 3 the engineer who will do it.
 *
 * The roster is a card grid rather than a dropdown because this is a choice
 * about a person: their level, their years, what they work on. A select
 * element would flatten all of that into a name.
 */
export function TierPicker({
  contractId,
  deliveryId,
  reviewers,
}: Readonly<{
  contractId: string;
  deliveryId: string;
  reviewers: QaReviewer[];
}>) {
  const [state, action] = useActionState(chooseQaTier, INITIAL);
  const [tier, setTier] = useState<QaTier>("TIER1");
  const [reviewerId, setReviewerId] = useState("");

  const needsReviewer = QA_TIER_INFO[tier].needsReviewer;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="deliveryId" value={deliveryId} />
      <input type="hidden" name="tier" value={tier} />
      <input type="hidden" name="reviewerId" value={reviewerId} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-bold text-zinc-950 dark:text-zinc-50">
          QA Doğrulama ve Test Modeli Seçimi
        </legend>
        <p className="mb-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Teslimatın nasıl taranacağını ve doğrulanacağını seçin. Seçtiğiniz paket maliyeti müşteriye şeffaf olarak yansıtılır.
        </p>

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
                } ${
                  info.available
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <input
                        id={`tier-${value}`}
                        type="radio"
                        name="tierChoice"
                        value={value}
                        checked={isSelected}
                        disabled={!info.available}
                        onChange={() => setTier(value)}
                        className="accent-brand size-4 mt-0.5"
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
                      <li key={idx} className="flex items-center gap-1.5 text-[0.75rem] text-zinc-500 dark:text-zinc-400">
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
      </fieldset>

      {needsReviewer ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
            İncelemeyi kim yapsın?
          </legend>

          {reviewers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Şu an müsait mühendis yok. Temel paketle devam edebilir veya
              sonra tekrar bakabilirsin.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {reviewers.map((r) => (
                <label
                  key={r.id}
                  htmlFor={`reviewer-${r.id}`}
                  className="has-checked:border-brand has-checked:bg-brand-muted flex cursor-pointer flex-col gap-1 rounded-lg border border-zinc-200 px-3 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <span className="flex items-start gap-2">
                    <input
                      id={`reviewer-${r.id}`}
                      type="radio"
                      name="reviewerChoice"
                      value={r.id}
                      checked={reviewerId === r.id}
                      onChange={() => setReviewerId(r.id)}
                      className="accent-brand mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
                        {LEVEL_LABEL[r.level] ?? r.level}
                      </span>
                      <span className="tnum block text-xs text-zinc-500 dark:text-zinc-400">
                        {r.years_experience}+ yıl
                      </span>
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
              ))}
            </div>
          )}

          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Ücret şimdilik elden faturalanır; ödeme entegrasyonu henüz bağlı
            değil.
          </p>
        </fieldset>
      ) : null}

      <FormFeedback state={state} />
      <SubmitButton
        className="self-start"
        pendingLabel="Gönderiliyor..."
        disabled={needsReviewer && reviewerId === ""}
      >
        {tier === "TIER1" ? "Müşteriye gönder" : "QA masasına gönder"}
      </SubmitButton>
    </form>
  );
}

/** The client answers inside the window. */
export function ClientDecision({
  contractId,
  deliveryId,
}: Readonly<{ contractId: string; deliveryId: string }>) {
  const [state, action] = useActionState(decideDelivery, INITIAL);
  const [decision, setDecision] = useState<"ACCEPTED" | "REJECTED">("ACCEPTED");

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="deliveryId" value={deliveryId} />
      <input type="hidden" name="decision" value={decision} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDecision("ACCEPTED")}
          className={`rounded-lg border px-3 py-2 text-sm ${
            decision === "ACCEPTED"
              ? "border-brand bg-brand-muted text-brand font-medium"
              : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          }`}
        >
          Kabul ediyorum
        </button>
        <button
          type="button"
          onClick={() => setDecision("REJECTED")}
          className={`rounded-lg border px-3 py-2 text-sm ${
            decision === "REJECTED"
              ? "border-rose-300 bg-rose-50 font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
              : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          }`}
        >
          İtiraz ediyorum
        </button>
      </div>

      <Field
        label={decision === "REJECTED" ? "Gerekçe" : "Not"}
        htmlFor="note"
        hint={
          decision === "REJECTED"
            ? "Neyin karşılanmadığını yaz. Kayda geçer."
            : "İsteğe bağlı."
        }
      >
        <TextArea
          id="note"
          name="note"
          rows={3}
          placeholder={
            decision === "REJECTED"
              ? "2. kriter karşılanmıyor: mobilde yatay kaydırma var."
              : ""
          }
        />
      </Field>

      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Kaydediliyor...">
        {decision === "ACCEPTED" ? "Kabul et" : "İtirazı gönder"}
      </SubmitButton>
    </form>
  );
}
