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
  criteria = [],
}: Readonly<{
  contractId: string;
  deliveryId: string;
  criteria?: { id: string; description: string; sequence_no: number }[];
}>) {
  const [state, action] = useActionState(decideDelivery, INITIAL);
  const [decision, setDecision] = useState<"ACCEPTED" | "REJECTED">("ACCEPTED");
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [reasonText, setReasonText] = useState("");

  const toggleCriterion = (desc: string) => {
    setSelectedCriteria((prev) =>
      prev.includes(desc) ? prev.filter((d) => d !== desc) : [...prev, desc],
    );
  };

  const finalNote =
    decision === "REJECTED" && selectedCriteria.length > 0
      ? `[İhlal Kriterleri: ${selectedCriteria.join("; ")}]\n\n${reasonText}`
      : reasonText;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="deliveryId" value={deliveryId} />
      <input type="hidden" name="decision" value={decision} />
      <input type="hidden" name="note" value={finalNote} />

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
          Teknik İtiraz Bildir
        </button>
      </div>

      {decision === "REJECTED" ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200 space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5">
            <span>⚖️</span> Hukuki & Teknik Hakemlik Uyarısı (TBK m. 474):
          </p>
          <p>
            Sözleşme şartnamesi ve eser sözleşmesi hükümleri uyarınca soyut veya sübjektif (&ldquo;beğenmedim&rdquo;, &ldquo;içime sinmedi&rdquo; vb.) gerekçeler geçerli bir ret oluşturmaz. İtirazın kabul edilebilmesi için sözleşmedeki hangi teknik kriterin ihlal edildiğini ve somut hata kanıtını (log, ekran görüntüsü, API yanıtı) bildirmeniz gereklidir. Bu beyan değiştirilemez delil kütüğüne işlenir.
          </p>
        </div>
      ) : null}

      {decision === "REJECTED" && criteria.length > 0 ? (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            Karşılanmadığı İddia Edilen Kriterler:
          </label>
          <div className="space-y-1.5 rounded-lg border border-border/80 bg-muted/30 p-2.5">
            {criteria.map((c) => {
              const isChecked = selectedCriteria.includes(c.description);
              return (
                <label
                  key={c.id}
                  className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer select-none py-1 hover:bg-muted/50 rounded px-1.5"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-border"
                    checked={isChecked}
                    onChange={() => toggleCriterion(c.description)}
                  />
                  <span>
                    <strong className="text-muted-foreground">{c.sequence_no}.</strong>{" "}
                    {c.description}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      <Field
        label={decision === "REJECTED" ? "Somut Teknik Hata ve Yeniden Üretme Adımları" : "Not"}
        htmlFor="reasonInput"
        hint={
          decision === "REJECTED"
            ? "Hata logu, HTTP yanıt kodu veya hatanın oluştuğu adımları yazınız (Zorunlu, resmi kayda geçer)."
            : "İsteğe bağlı."
        }
      >
        <TextArea
          id="reasonInput"
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          rows={3}
          required={decision === "REJECTED"}
          placeholder={
            decision === "REJECTED"
              ? "Örn: Canlı kur motoru test edildiğinde /api/rates 500 dönüyor. Konsol çıktısı ve cURL logu ektedir."
              : ""
          }
        />
      </Field>

      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Kaydediliyor...">
        {decision === "ACCEPTED" ? "Kabul et" : "Resmi İtirazı Kaydet"}
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
