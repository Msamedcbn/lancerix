"use client";

import { useActionState, useState } from "react";

import {
  confirmStartDate,
  rejectContract,
  rejectStartDate,
  requestRevision,
  resubmitContract,
  setPlannedStartDate,
  type FormState,
} from "@/app/(dashboard)/actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

/** Client can reject a contract with a reason */
export function ContractActions({
  contractId,
}: Readonly<{ contractId: string }>) {
  const [rejectState, rejectAction] = useActionState(rejectContract, INITIAL);
  const [revisionState, revisionAction] = useActionState(requestRevision, INITIAL);
  const [mode, setMode] = useState<"idle" | "reject" | "revise">("idle");

  if (mode === "idle") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Sözleşme şartlarını inceledikten sonra revizyon talep edebilir veya reddedebilirsiniz.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("revise")}
            className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 active:scale-[0.98] transition-colors dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/60"
          >
            ✏️ Revizyon İste
          </button>
          <button
            type="button"
            onClick={() => setMode("reject")}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 active:scale-[0.98] transition-colors dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
          >
            ❌ Reddet
          </button>
        </div>
      </div>
    );
  }

  if (mode === "reject") {
    return (
      <form action={rejectAction} className="flex flex-col gap-3">
        <input type="hidden" name="contractId" value={contractId} />
        <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
          Sözleşmeyi Reddet
        </p>
        <textarea
          name="reason"
          required
          minLength={5}
          rows={3}
          placeholder="Red gerekçenizi yazın..."
          className="w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm text-zinc-950 shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <FormFeedback state={rejectState} />
        <div className="flex items-center gap-2">
          <SubmitButton tone="danger" pendingLabel="Reddediliyor...">
            Sözleşmeyi Reddet
          </SubmitButton>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Vazgeç
          </button>
        </div>
      </form>
    );
  }

  // mode === "revise"
  return (
    <form action={revisionAction} className="flex flex-col gap-3">
      <input type="hidden" name="contractId" value={contractId} />
      <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
        Revizyon Talep Et
      </p>
      <textarea
        name="note"
        required
        minLength={5}
        rows={3}
        placeholder="Hangi maddelerin değişmesini istiyorsunuz?"
        className="w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm text-zinc-950 shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <FormFeedback state={revisionState} />
      <div className="flex items-center gap-2">
        <SubmitButton pendingLabel="Gönderiliyor...">
          Revizyon Talebi Gönder
        </SubmitButton>
        <button
          type="button"
          onClick={() => setMode("idle")}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}

/**
 * The freelancer's answer to a revision request -- send it back to the
 * client for another look. Shown only while the contract is
 * REVISION_REQUESTED; the actual editing of terms happens outside this
 * screen for now (see contract-lifecycle.sql's resubmit_contract comment).
 */
export function ResubmitContract({
  contractId,
}: Readonly<{ contractId: string }>) {
  const [state, action] = useActionState(resubmitContract, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="contractId" value={contractId} />
      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        Talep edilen değişiklikleri yaptıysan sözleşmeyi karşı tarafın
        incelemesine tekrar gönder.
      </p>
      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Gönderiliyor...">
        Tekrar Gönder
      </SubmitButton>
    </form>
  );
}

/**
 * Both parties confirm the start date -- or object to it. The objection is
 * folded into this component rather than a sibling card because the two are
 * one decision: the party reading "planlanan başlangıç: X" either accepts X
 * or names a date they can actually make. A counter date is optional; sending
 * none just reopens the SetStartDate form for whoever gets there first.
 */
export function StartDateConfirm({
  contractId,
}: Readonly<{ contractId: string }>) {
  const [state, action] = useActionState(confirmStartDate, INITIAL);
  const [rejectState, rejectAction] = useActionState(rejectStartDate, INITIAL);
  const [objecting, setObjecting] = useState(false);

  if (objecting) {
    return (
      <form action={rejectAction} className="flex w-full max-w-xs flex-col gap-2">
        <input type="hidden" name="contractId" value={contractId} />
        <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
          Bu tarih olmuyor
        </p>
        <label className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
          Önerdiğin tarih (opsiyonel)
          <input
            type="date"
            name="counterDate"
            className="mt-1 w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2 text-sm text-zinc-950 shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </label>
        <textarea
          name="note"
          rows={2}
          maxLength={500}
          placeholder="Neden olmuyor? (opsiyonel)"
          className="w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2 text-sm text-zinc-950 shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <FormFeedback state={rejectState} />
        <div className="flex items-center gap-2">
          <SubmitButton pendingLabel="Gönderiliyor...">Gönder</SubmitButton>
          <button
            type="button"
            onClick={() => setObjecting(false)}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Vazgeç
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="contractId" value={contractId} />
      <SubmitButton pendingLabel="Onaylanıyor...">
        Başlangıcı Onayla
      </SubmitButton>
      <button
        type="button"
        onClick={() => setObjecting(true)}
        className="text-xs font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
      >
        Bu tarih olmuyor
      </button>
      <FormFeedback state={state} />
    </form>
  );
}

/**
 * A signed contract with no planned start date (the field is optional at
 * creation) has no other path to one -- confirm_start_date() requires it,
 * and without it delivery can never open. Either party fills it in once.
 */
export function SetStartDate({
  contractId,
}: Readonly<{ contractId: string }>) {
  const [state, action] = useActionState(setPlannedStartDate, INITIAL);

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="contractId" value={contractId} />
      <input
        type="date"
        name="plannedStartDate"
        required
        className="rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2 text-sm text-zinc-950 shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <SubmitButton pendingLabel="Kaydediliyor...">
        Başlangıç Tarihi Belirle
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
