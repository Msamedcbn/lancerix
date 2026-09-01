import type { Metadata } from "next";
import Link from "next/link";

import { Mark } from "@/components/brand/mark";
import { TERMS_SECTIONS, TERMS_VERSION } from "@/lib/contracts/terms";

export const metadata: Metadata = {
  title: "Hizmet Koşulları — Lancerix",
  description:
    "Lancerix'in doğrulama ve kayıt hizmetini hangi şartlarla sunduğu, neyi garanti ettiği ve neyi etmediği.",
};

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 transition-colors hover:text-slate-600"
        >
          <Mark className="text-brand size-4" />
          Lancerix
        </Link>

        <header className="mt-12 border-b border-slate-200 pb-8">
          <p className="mono text-brand text-xs tracking-[0.14em]">
            SÜRÜM {TERMS_VERSION}
          </p>
          <h1 className="font-display mt-3 text-3xl font-medium tracking-tight text-slate-900 md:text-4xl">
            Hizmet Koşulları
          </h1>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-slate-500">
            Sözleşme imzalarken kabul ettiğin şartlar. Kısa tutuldu, çünkü
            okunmayan bir metne onay almak onay değildir.
          </p>
        </header>

        <div className="mt-12 flex flex-col gap-12">
          {TERMS_SECTIONS.map((section, index) => (
            <section key={section.heading} className="grid gap-4 md:grid-cols-[3rem_1fr]">
              <span
                aria-hidden
                className="mono hidden pt-1 text-xs text-slate-300 md:block"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  {section.heading}
                </h2>
                <div className="mt-3 flex flex-col gap-3">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="max-w-[65ch] text-base leading-relaxed text-slate-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-400">
            Bu sürüm {TERMS_VERSION} tarihlidir. İmzaladığın her sözleşme, o an
            yürürlükte olan sürümü kaydeder — şartlar sonradan değişse bile
            senin kabul ettiğin sürüm kayıtta durur.
          </p>
        </footer>
      </div>
    </main>
  );
}
