"use client";

import { useActionState } from "react";

import { signContract, type FormState } from "@/app/(dashboard)/actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

/**
 * Signing is a single button on purpose: what is being agreed to is the
 * document, not a checkbox. The hash of that exact text is what gets stored,
 * so the record can prove which words were on screen.
 */
export function SignContract({
  contractId,
  alreadySigned,
  otherPartySigned,
}: Readonly<{
  contractId: string;
  alreadySigned: boolean;
  otherPartySigned: boolean;
}>) {
  const [state, action] = useActionState(signContract, INITIAL);

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

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="contractId" value={contractId} />
      <p className="max-w-[58ch] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        İmzalamak; adını, zamanı, IP adresini ve sözleşme metninin birebir
        parmak izini kayda geçirir. Şartlar sonradan değiştirilirse o parmak izi
        tutmaz ve değişiklik kayıtta görünür.
      </p>
      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="İmzalanıyor...">
        Sözleşmeyi imzala
      </SubmitButton>
    </form>
  );
}
