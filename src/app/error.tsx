"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, Home } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function GlobalError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-mono text-brand text-sm font-bold tracking-widest uppercase">
          Hata
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
          Bir şeyler ters gitti
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Sayfa yüklenirken beklenmedik bir hata oluştu. Bu genellikle geçicidir
          — tekrar deneyebilir veya ana sayfaya dönebilirsiniz.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            <RotateCw className="size-4" aria-hidden />
            Tekrar dene
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors active:scale-[0.98]"
          >
            <Home className="size-4" aria-hidden />
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
