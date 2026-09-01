"use client";

import { useActionState } from "react";

import {
  addReviewer,
  setReviewerActive,
  type FormState,
} from "@/app/(dashboard)/admin/actions";
import { Field, Select, TextArea, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import type { QaReviewer } from "@/lib/data/admin-qa";

const INITIAL: FormState = { error: null };

/** Adding an engineer -- they need an account already, looked up by email. */
export function AddReviewerForm() {
  const [state, action] = useActionState(addReviewer, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="E-posta" htmlFor="email" hint="Mühendisin zaten kayıtlı olduğu hesabın e-postası.">
        <TextInput id="email" name="email" type="email" placeholder="ornek@sirket.com" required />
      </Field>

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
