"use client";

import { useActionState, useState } from "react";

import {
  decideDelivery,
  payQaOrder,
  submitQaDelivery,
  type FormState,
} from "@/app/(dashboard)/qa-actions";
import { Field, TextArea, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { Money } from "@/components/money";
import type { QaTierOrder } from "@/lib/data/deliveries";
import {
  PROJECT_CATEGORY_INFO,
  type ProjectCategory,
} from "@/lib/validations/project-category";

const INITIAL: FormState = { error: null };

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

/**
 * The QA order's fee, once one exists.
 *
 * fee_kurus is fixed at choose_qa_tier() time from the reviewer's own
 * rate_kurus, so this never computes an amount -- it only ever displays and
 * pays the one already on the order. Nothing renders for TIER1/WAIVED/PAID.
 */
export function QaOrderPayment({ order }: Readonly<{ order: QaTierOrder }>) {
  const [state, action] = useActionState(payQaOrder, INITIAL);

  if (order.payment_status !== "PENDING" || order.fee_kurus <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/30">
      <p className="text-sm text-amber-800 dark:text-amber-200">
        İnceleme ücreti <Money kurus={order.fee_kurus} /> — ödeme bekleniyor.
      </p>
      <form action={action}>
        <input type="hidden" name="orderId" value={order.id} />
        <SubmitButton pendingLabel="Yönlendiriliyor...">Öde</SubmitButton>
      </form>
      {state.error && (
        <p className="w-full text-xs text-rose-600 dark:text-rose-400">{state.error}</p>
      )}
    </div>
  );
}
