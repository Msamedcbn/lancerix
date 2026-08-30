"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";

import { login, type AuthFormState } from "@/app/(auth)/actions";
import { Field, TextInput } from "@/components/field";

const INITIAL: AuthFormState = { error: null };

/**
 * Registration redirects here with ?checkEmail=1, which only happens when the
 * project requires email confirmation. Without this notice the account exists
 * but nothing says so, and the first sign-in attempt fails with Supabase's
 * "Email not confirmed" for no visible reason.
 *
 * The wording deliberately does not promise that a message has arrived. Until a
 * mail provider is configured, delivery runs on Supabase's shared SMTP, which
 * is rate-limited and slow.
 */
function Notice() {
  const params = useSearchParams();

  if (params.get("error") === "profile_missing") {
    return (
      <p
        role="alert"
        className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-relaxed text-rose-700"
      >
        Bu hesabın profil kaydı yok, bu yüzden girilecek bir yer de yok. Yeniden
        kayıt olabilir veya destekle iletişime geçebilirsin.
      </p>
    );
  }

  if (params.get("checkEmail") !== "1") return null;

  return (
    <p
      role="status"
      className="border-brand/20 bg-brand-muted text-brand mb-5 rounded-lg border px-3 py-2 text-sm leading-relaxed"
    >
      Hesap oluşturuldu. Giriş yapabilmen için önce e-posta adresinin
      doğrulanması gerekiyor.
    </p>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[1fr_1.1fr]">
      {/* Asymmetric split rather than a centred card: the left column carries
          the proposition, the right one does the work. */}
      <section className="hidden flex-col justify-between bg-zinc-950 p-12 lg:flex">
        <span className="text-sm font-semibold tracking-tight text-zinc-50">
          Lancerix
        </span>
        <div className="max-w-[34ch]">
          <p className="text-3xl leading-tight font-medium tracking-tight text-zinc-50">
            Teslim ettin, itiraz gelmedi. Kabul edilmiş sayılır.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Sözleşmedeki süre dolduğunda onay kendiliğinden gerçekleşir ve zaman
            damgasıyla kayda geçer. Beklemek varsayılan değildir.
          </p>
        </div>
        <span className="text-xs text-zinc-600">
          Sözleşme, aşama ve kabul kaydı
        </span>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Giriş yap
          </h1>
          <p className="mt-1 mb-8 text-sm text-zinc-500">
            Sözleşmelerine, escrow bakiyene ve makbuzlarına eriş.
          </p>

          <Suspense fallback={null}>
            <Notice />
          </Suspense>

          <form action={formAction} className="flex flex-col gap-5">
            <Field label="E-posta" htmlFor="email">
              <TextInput id="email" name="email" type="email" required />
            </Field>

            <Field label="Parola" htmlFor="password">
              <TextInput id="password" name="password" type="password" required />
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
              className="bg-brand text-brand-foreground inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 active:translate-y-px disabled:opacity-50"
            >
              {pending ? "Giriş yapılıyor..." : "Giriş yap"}
            </button>

            <p className="text-center text-sm text-zinc-500">
              Hesabın yok mu?{" "}
              <Link
                href="/register"
                className="text-zinc-950 underline underline-offset-4"
              >
                Kayıt ol
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
