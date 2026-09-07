"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";

import { register, type AuthFormState } from "@/app/(auth)/actions";
import { Mark } from "@/components/brand/mark";
import { Field, Select, TextInput } from "@/components/field";

const INITIAL: AuthFormState = { error: null };

const ROLES = [
  {
    value: "FREELANCER",
    label: "Freelancerım",
    hint: "İş teslim ediyorum, makbuz kesiyorum",
  },
  {
    value: "CLIENT",
    label: "İşverenim",
    hint: "İş veriyorum, teslimi QA raporuyla onaylıyorum",
  },
] as const;

const REFERRAL_OPTIONS = [
  { value: "GOOGLE", label: "Google / arama" },
  { value: "SOCIAL_MEDIA", label: "Sosyal medya" },
  { value: "FRIEND_REFERRAL", label: "Arkadaş tavsiyesi" },
  { value: "ADVERTISEMENT", label: "Reklam" },
  { value: "OTHER", label: "Diğer" },
] as const;

function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, INITIAL);
  const next = useSearchParams().get("next");
  const loginHref = (next ? `/login?next=${encodeURIComponent(next)}` : "/login") as Route;

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[1fr_1.1fr]">
      <section className="hidden flex-col justify-between bg-zinc-950 p-12 lg:flex">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold tracking-tight text-zinc-50 hover:opacity-80"
        >
          <Mark className="size-4" />
          Lancerix
        </Link>
        <div className="max-w-[34ch]">
          <p className="text-3xl leading-tight font-medium tracking-tight text-zinc-50">
            Sözleşme imzalanır, aşamalar tek tek kapanır.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Her aşamanın bedeli, kesintisi ve teslim tarihi baştan yazılıdır.
            Kim neyi ne zaman onayladı, silinemeyen bir defterde durur.
          </p>
        </div>
        <span className="text-xs text-zinc-600">
          Sözleşme, aşama ve kabul kaydı
        </span>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-semibold tracking-tight text-zinc-950 hover:opacity-70 lg:hidden"
          >
            <Mark className="size-4" />
            Lancerix
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Hesap oluştur
          </h1>
          <p className="mt-1 mb-8 text-sm text-zinc-500">
            Freelancer teslim eder, işveren QA raporuyla onaylar.
          </p>

          <form action={formAction} className="flex flex-col gap-5">
            {next ? <input type="hidden" name="next" value={next} /> : null}

            <Field label="Ad soyad" htmlFor="fullName">
              <TextInput id="fullName" name="fullName" required />
            </Field>

            <Field label="E-posta" htmlFor="email">
              <TextInput id="email" name="email" type="email" required />
            </Field>

            <Field label="Parola" htmlFor="password" hint="En az 8 karakter.">
              <TextInput
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </Field>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-zinc-950">
                Hangisisin?
              </legend>
              {/* Cards rather than bare radios: this choice decides which half
                  of the product the account sees, so it earns the space. */}
              <div className="grid gap-2">
                {ROLES.map((role, index) => (
                  <label
                    key={role.value}
                    htmlFor={`role-${role.value}`}
                    className="has-checked:border-brand has-checked:bg-brand-muted flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 hover:bg-zinc-50 has-checked:hover:bg-[var(--brand-muted)]"
                  >
                    <input
                      id={`role-${role.value}`}
                      type="radio"
                      name="role"
                      value={role.value}
                      defaultChecked={index === 0}
                      className="accent-brand mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium text-zinc-950">
                        {role.label}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {role.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Bizi nereden duydunuz? (opsiyonel)" htmlFor="referralSource">
              <Select id="referralSource" name="referralSource" defaultValue="">
                <option value="">Belirtmek istemiyorum</option>
                {REFERRAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>

            {state.error ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="bg-brand text-brand-foreground inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {pending ? "Oluşturuluyor..." : "Hesap oluştur"}
            </button>

            <p className="text-center text-sm text-zinc-500">
              Zaten kayıtlı mısın?{" "}
              <Link
                href={loginHref}
                className="text-zinc-950 underline underline-offset-4"
              >
                Giriş yap
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
