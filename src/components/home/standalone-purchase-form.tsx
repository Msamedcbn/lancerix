"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { purchaseStandaloneCheck, type FormState } from "@/app/marketing-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import type { StandaloneCheckType } from "@/lib/validations/standalone-qa";

const INITIAL: FormState = { error: null };

export type StandalonePackageCopy = { label: string; price: string; hint: string };

export type StandaloneFormCopy = {
  eyebrow: string;
  title: string;
  body: string;
  packages: Record<StandaloneCheckType, StandalonePackageCopy>;
  urlLabel: string;
  urlPlaceholder: string;
  emailLabel: string;
  passwordLabel: string;
  submit: string;
  footer: string;
  loginPrompt: string;
  loginLink: string;
}

const CHECK_TYPES: readonly StandaloneCheckType[] = [
  "ACCESSIBILITY",
  "PERFORMANCE",
  "SEO_META",
  "VISUAL_OVERFLOW",
  "DEAD_LINKS",
  "FORM_VALIDATION",
  "INTERACTION_SCAN",
];

/**
 * The homepage's self-serve purchase: pick a package, give an email +
 * password + URL, submit -- purchaseStandaloneCheck (marketing-actions.ts)
 * creates the account, runs the check and redirects straight to Polar
 * checkout, all from this one submit. No /register, no /login, no
 * navigating into the dashboard first.
 */
export function StandalonePurchaseForm({ copy }: Readonly<{ copy: StandaloneFormCopy }>) {
  const [state, action] = useActionState(purchaseStandaloneCheck, INITIAL);
  const [checkType, setCheckType] = useState<StandaloneCheckType>("ACCESSIBILITY");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 text-center">
        <p className="text-brand mono mb-2 text-xs tracking-[0.14em]">{copy.eyebrow}</p>
        <h2 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          {copy.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          {copy.body}
        </p>
      </div>

      <form action={action} className="glass flex flex-col gap-4 rounded-2xl border border-border p-6 md:p-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHECK_TYPES.map((type) => {
            const pkg = copy.packages[type];
            const selected = checkType === type;
            return (
              <label
                key={type}
                className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors ${
                  selected ? "border-brand bg-brand/5" : "border-border bg-background"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <input
                      type="radio"
                      name="checkType"
                      value={type}
                      checked={selected}
                      onChange={() => setCheckType(type)}
                      className="accent-brand"
                    />
                    {pkg.label}
                  </span>
                  <span className="mono text-sm text-muted-foreground">{pkg.price}</span>
                </span>
                <span className="pl-5.5 text-xs text-muted-foreground">{pkg.hint}</span>
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
            placeholder={copy.urlPlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
              minLength={8}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <SubmitButton pendingLabel="..." className="mt-1">
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
      </form>
    </div>
  );
}
