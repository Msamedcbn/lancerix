"use client";

import { useActionState } from "react";

import {
  addReviewer,
  setReviewerActive,
  setReviewerRate,
  type FormState,
} from "@/app/(dashboard)/admin/actions";
import { Field, Select, TextArea, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import type { QaReviewer } from "@/lib/data/admin-qa";

const INITIAL: FormState = { error: null };

/**
 * Adding an engineer -- no account required (2026-09-06). If the e-posta
 * matches an existing Lancerix account, that account's own name is used
 * instead of the one typed here; otherwise fullName/email are stored
 * directly on the roster row.
 */
export function AddReviewerForm() {
  const [state, action] = useActionState(addReviewer, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ad soyad" htmlFor="fullName" hint="Zaten kayıtlı bir hesap varsa o hesabın adı kullanılır.">
          <TextInput id="fullName" name="fullName" placeholder="Ayşe Yılmaz" required />
        </Field>

        <Field label="E-posta" htmlFor="email" hint="Hesabı yoksa buraya bilgilendirme e-postası gider.">
          <TextInput id="email" name="email" type="email" placeholder="ornek@sirket.com" required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Seviye" htmlFor="level">
          <Select id="level" name="level" defaultValue="SENIOR" required>
            <option value="SENIOR">Senior</option>
            <option value="PRINCIPAL">Principal / Lead</option>
          </Select>
        </Field>

        <Field label="Deneyim (yıl)" htmlFor="yearsExperience">
          <TextInput
            id="yearsExperience"
            name="yearsExperience"
            type="number"
            min={1}
            step={1}
            required
          />
        </Field>
      </div>

      <Field
        label="Uzmanlıklar"
        htmlFor="specialties"
        hint="Virgülle ayır, örn: React, Ödeme sistemleri, Mobil"
      >
        <TextInput id="specialties" name="specialties" placeholder="React, API, Güvenlik" />
      </Field>

      <Field label="Kısa bio" htmlFor="bio" hint="İsteğe bağlı, TierPicker'da gösterilir.">
        <TextArea id="bio" name="bio" rows={2} />
      </Field>

      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Ekleniyor...">
        Kadroya ekle
      </SubmitButton>
    </form>
  );
}

/** One row's active/pasif toggle -- a button, not a checkbox, so the click submits immediately. */
export function ReviewerActiveToggle({ reviewer }: Readonly<{ reviewer: QaReviewer }>) {
  const [, action] = useActionState(setReviewerActive, INITIAL);

  return (
    <form action={action}>
      <input type="hidden" name="reviewerId" value={reviewer.id} />
      <input type="hidden" name="active" value={(!reviewer.active).toString()} />
      <button
        type="submit"
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
          reviewer.active
            ? "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            : "border-brand/40 bg-brand-muted text-brand"
        }`}
      >
        {reviewer.active ? "Pasife al" : "Aktifleştir"}
      </button>
    </form>
  );
}

/**
 * The reviewer's own TIER3/TIER4 fee.
 *
 * choose_qa_tier() refuses to order this reviewer for TIER3/4 until
 * rate_kurus is set, so this isn't optional bookkeeping -- it's what makes
 * the reviewer orderable at all.
 */
export function ReviewerRateForm({ reviewer }: Readonly<{ reviewer: QaReviewer }>) {
  const [state, action] = useActionState(setReviewerRate, INITIAL);

  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name="reviewerId" value={reviewer.id} />
      <input
        name="rate"
        placeholder="0,00"
        defaultValue={
          reviewer.rate_kurus != null ? (reviewer.rate_kurus / 100).toFixed(2).replace(".", ",") : ""
        }
        inputMode="decimal"
        className="tnum w-24 rounded-lg border border-zinc-200 px-2 py-1 text-right text-xs dark:border-zinc-800 dark:bg-zinc-900"
      />
      <button
        type="submit"
        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        Ücreti kaydet
      </button>
      {state.error && (
        <span className="text-[0.7rem] text-rose-600 dark:text-rose-400">{state.error}</span>
      )}
    </form>
  );
}
