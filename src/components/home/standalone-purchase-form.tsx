"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { purchaseStandaloneCheck, type FormState } from "@/app/marketing-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import type { StandalonePackageCopy } from "@/lib/i18n/dictionaries/home";
import { formatMoney, type SupportedCurrency } from "@/lib/validations/currency";
import {
  STANDALONE_PACKAGE_IDS,
  STANDALONE_PACKAGES,
  type StandalonePackageId,
} from "@/lib/validations/standalone-qa";

const INITIAL: FormState = { error: null };

export type StandaloneFormCopy = {
  packages: Record<StandalonePackageId, StandalonePackageCopy>;
  urlLabel: string;
  urlPlaceholder: string;
  emailLabel: string;
  passwordLabel: string;
  submit: string;
  footer: string;
  loginPrompt: string;
  loginLink: string;
};

function MarketingFormFields({
  copy,
  currency,
  packageId,
  setPackageId,
  state,
}: {
  copy: StandaloneFormCopy;
  currency: SupportedCurrency;
  packageId: StandalonePackageId;
  setPackageId: (id: StandalonePackageId) => void;
  state: FormState;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {STANDALONE_PACKAGE_IDS.map((id) => {
          const pkg = copy.packages[id];
          const selected = packageId === id;
          return (
            <label
              key={id}
              className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-5 text-left transition-all ${
                selected
                  ? "border-brand bg-brand/5 shadow-md ring-2 ring-brand/20"
                  : "border-border bg-background hover:border-border/80"
              } ${pending ? "pointer-events-none opacity-60" : ""}`}
            >
              {pkg.popular && (
                <span className="bg-brand text-brand-foreground absolute -top-3 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                  Popüler
                </span>
              )}
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold text-foreground">
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
                </div>

                <div className="mb-2">
                  <span className="mono font-display text-2xl font-bold text-foreground">
                    {formatMoney(STANDALONE_PACKAGES[id].priceMinor[currency], currency)}
                  </span>
                </div>

                <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                  {pkg.hint}
                </p>

                <ul className="mb-4 flex flex-col gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="text-brand size-3.5 shrink-0 mt-0.5" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="marketing-target-url" className="text-sm font-medium text-foreground">
          {copy.urlLabel}
        </label>
        <input
          id="marketing-target-url"
          name="targetUrl"
          type="url"
          required
          disabled={pending}
          placeholder={copy.urlPlaceholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="marketing-email" className="text-sm font-medium text-foreground">
            {copy.emailLabel}
          </label>
          <input
            id="marketing-email"
            name="email"
            type="email"
            required
            disabled={pending}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="marketing-password" className="text-sm font-medium text-foreground">
            {copy.passwordLabel}
          </label>
          <input
            id="marketing-password"
            name="password"
            type="password"
            required
            disabled={pending}
            minLength={8}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>
      </div>

      <SubmitButton pendingLabel="Ödemeye yönlendiriliyor..." className="mt-1">
        {copy.submit}
      </SubmitButton>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="text-brand size-3.5 shrink-0" aria-hidden />
        {copy.footer}
      </p>

      <FormFeedback state={state} />

      <p className="text-center text-xs text-muted-foreground">
        {copy.loginPrompt}{" "}
        <Link href="/login" className="text-brand font-medium hover:underline">
          {copy.loginLink}
        </Link>
      </p>
    </>
  );
}

/** No heading of its own -- the shared pricing section header (home-client.tsx)
 * covers both this and the monitoring tab, so this is just the package
 * picker + purchase form. */
export function StandalonePurchaseForm({
  copy,
  currency,
}: Readonly<{
  copy: StandaloneFormCopy;
  currency: SupportedCurrency;
}>) {
  const [state, action] = useActionState(purchaseStandaloneCheck, INITIAL);
  const [packageId, setPackageId] = useState<StandalonePackageId>("PRO");

  return (
    <div className="mx-auto max-w-5xl">
      <form action={action} className="glass flex flex-col gap-6 rounded-2xl border border-border p-6 md:p-8">
        <MarketingFormFields copy={copy} currency={currency} packageId={packageId} setPackageId={setPackageId} state={state} />
      </form>
    </div>
  );
}


