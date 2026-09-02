"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signContract, type FormState } from "@/app/(dashboard)/actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

/**
 * Two things are being agreed to here and they are separate agreements: the
 * contract with the other party (the document, whose exact hash is stored)
 * and Lancerix's own terms (the checkbox, whose version is stored).
 *
 * The box is unchecked by default and the button stays disabled until it is
 * ticked. A pre-checked box is not consent, and the server re-checks it
 * anyway -- this only makes the gate visible.
 */
export function SignContract({
  contractId,
  alreadySigned,
  otherPartySigned,
  criteriaMissing = false,
  qaTierMissing = false,
}: Readonly<{
  contractId: string;
  alreadySigned: boolean;
  otherPartySigned: boolean;
  /** QA_ONLY with no acceptance criteria yet -- the client has to set these first. */
  criteriaMissing?: boolean;
  /** QA_ONLY with no QA package chosen yet -- the client has to pick one first. */
  qaTierMissing?: boolean;
}>) {
  const [state, action] = useActionState(signContract, INITIAL);
  const [accepted, setAccepted] = useState(false);

  if (alreadySigned) {
    return (
      <div className="flex items-start gap-2.5">
        <span className="bg-brand mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden />
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          İmzaladın.{" "}
          {otherPartySigned
            ? "İki taraf da imzaladı, sözleşme yürürlükte."
            : "Karşı tarafın imzası bekleniyor."}
        </p>
      </div>
    );
  }

  if (criteriaMissing || qaTierMissing) {
    return (
      <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {criteriaMissing && qaTierMissing
          ? "Kabul kriterleri ve QA paketi henüz girilmedi. İmza, ikisi de kaydedilince açılır."
          : criteriaMissing
            ? "Kabul kriterleri henüz girilmedi. İmza, kriterler kaydedilince açılır."
            : "QA paketi henüz seçilmedi. İmza, paket seçilince açılır."}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="contractId" value={contractId} />

      <p className="max-w-[58ch] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        İmzalamak; adını, zamanı, IP adresini ve sözleşme metninin birebir
        parmak izini kayda geçirir. Şartlar sonradan değiştirilirse o parmak izi
        tutmaz ve değişiklik kayıtta görünür.
      </p>

      <label
        htmlFor="acceptTerms"
        className="has-checked:border-brand has-checked:bg-brand-muted flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-3.5 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <input
          id="acceptTerms"
          name="acceptTerms"
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="accent-brand mt-0.5 size-4 shrink-0"
        />
        <span className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Lancerix{" "}
          <Link
            href="/sartlar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand font-medium underline underline-offset-4"
          >
            hizmet koşullarını
          </Link>{" "}
          okudum ve kabul ediyorum.
        </span>
      </label>

      <FormFeedback state={state} />
      <SubmitButton
        className="self-start"
        pendingLabel="İmzalanıyor..."
        disabled={!accepted}
      >
        Sözleşmeyi imzala
      </SubmitButton>
    </form>
  );
}
