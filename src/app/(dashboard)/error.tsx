"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border px-6 py-24 text-center">
      <p className="font-mono text-brand text-xs font-bold tracking-widest uppercase">
        Hata
      </p>
      <h2 className="text-xl font-semibold text-foreground">
        Bir şeyler ters gitti
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Bu sayfa yüklenirken beklenmedik bir hata oluştu. Genellikle geçicidir.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
      >
        <RotateCw className="size-4" aria-hidden />
        Tekrar dene
      </button>
    </div>
  );
}
