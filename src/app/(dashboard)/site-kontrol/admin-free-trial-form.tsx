"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { adminFreeStandaloneCheck, type FormState } from "@/app/(dashboard)/standalone-qa-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import {
  STANDALONE_PACKAGE_IDS,
  STANDALONE_PACKAGES,
  type StandalonePackageId,
} from "@/lib/validations/standalone-qa";

const INITIAL: FormState = { error: null };

function FormFields({
  packageId,
  setPackageId,
  state,
}: {
  packageId: StandalonePackageId;
  setPackageId: (id: StandalonePackageId) => void;
  state: FormState;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-targetUrl" className="text-sm font-medium text-foreground">
          Test edilecek link
        </label>
        <input
          id="admin-targetUrl"
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
            return (
              <label
                key={id}
                className={`relative flex cursor-pointer flex-col justify-between rounded-lg border p-4 transition-all ${
                  selected
                    ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                    : "border-zinc-200 dark:border-zinc-800"
                } ${pending ? "pointer-events-none opacity-60" : ""}`}
              >
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
                  <span className="text-xs font-semibold text-brand">Ücretsiz</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {pkg.modules.length} modül taraması dahildir.
                </p>
              </label>
            );
          })}
        </div>
      </div>

      <SubmitButton pendingLabel="Başlatılıyor..." className="self-start">
        Ücretsiz dene (admin)
      </SubmitButton>
      <FormFeedback state={state} />
    </>
  );
}

/**
 * Admin-only: run any package against any URL with no Polar checkout and no
 * daily cap. Writes a real, already-PAID order (adminFreeStandaloneCheck),
 * so it shows up in "Geçmiş taramalar" below exactly like a paying
 * customer's -- same report, same "tarama sürüyor" state, nothing special-
 * cased in the read path.
 */
export function AdminFreeTrialForm() {
  const [state, action] = useActionState(adminFreeStandaloneCheck, INITIAL);
  const [packageId, setPackageId] = useState<StandalonePackageId>("FULL");

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        Admin: ücretsiz deneme
      </p>
      <FormFields packageId={packageId} setPackageId={setPackageId} state={state} />
    </form>
  );
}
