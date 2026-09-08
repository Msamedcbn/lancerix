"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { createStandaloneCheck, type FormState } from "@/app/(dashboard)/standalone-qa-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { LiveScanStepper } from "@/components/qa/live-scan-stepper";
import {
  packageFeeKurus,
  STANDALONE_PACKAGE_IDS,
  STANDALONE_PACKAGES,
  type StandalonePackageId,
} from "@/lib/validations/standalone-qa";

const INITIAL: FormState = { error: null };

function FormFields({
  packageId,
  setPackageId,
  currentFee,
  state,
}: {
  packageId: StandalonePackageId;
  setPackageId: (id: StandalonePackageId) => void;
  currentFee: string;
  state: FormState;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="targetUrl" className="text-sm font-medium text-foreground">
          Test edilecek link
        </label>
        <input
          id="targetUrl"
          name="targetUrl"
          type="url"
          required
          placeholder="https://ornek-site.com"
          disabled={pending}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Paket seçimi</span>
        <div className="grid gap-3 md:grid-cols-3">
          {STANDALONE_PACKAGE_IDS.map((id) => {
            const pkg = STANDALONE_PACKAGES[id];
            const selected = packageId === id;
            const priceDisplay = (pkg.feeKurus / 100).toFixed(0);
            return (
              <label
                key={id}
                className={`relative flex cursor-pointer flex-col justify-between rounded-lg border p-4 transition-all ${
                  selected
                    ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                    : "border-zinc-200 dark:border-zinc-800"
                } ${pending ? "pointer-events-none opacity-60" : ""}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <input
                        type="radio"
                        name="packageId"
                        value={id}
                        checked={selected}
                        onChange={() => setPackageId(id)}
                        disabled={pending}
                        className="accent-brand"
                      />
                      {pkg.label}
                    </span>
                    <span className="tnum text-sm font-bold text-foreground">₺{priceDisplay}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {pkg.modules.length} modül taraması dahildir.
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Seçili Paket Ücreti: <strong>₺{currentFee}</strong> -- sözleşme veya proje gerekmez, herhangi bir link.
      </p>

      <LiveScanStepper isScanning={pending} />

      <SubmitButton pendingLabel="Laboratuvar Taraması Yapılıyor..." className="self-start">
        Taramayı başlat
      </SubmitButton>
      <FormFeedback state={state} />
    </>
  );
}

export function StandaloneCheckForm() {
  const [state, action] = useActionState(createStandaloneCheck, INITIAL);
  const [packageId, setPackageId] = useState<StandalonePackageId>("PRO");
  const currentFee = (packageFeeKurus(packageId) / 100).toFixed(0);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-border p-5 dark:border-border/50">
      <FormFields packageId={packageId} setPackageId={setPackageId} currentFee={currentFee} state={state} />
    </form>
  );
}


