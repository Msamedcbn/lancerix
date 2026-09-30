"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, ArrowRight, Loader2, ShieldCheck, FileCode, Server } from "lucide-react";
import { createTargetAction } from "@/app/(dashboard)/security-actions";

export function TargetForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createTargetAction(formData);

    if (!res.success) {
      setError(res.error);
      setLoading(false);
      return;
    }

    router.push(`/targets/${res.data.targetId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Hedef / Proje Adı
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Örn: Müşteri Portali veya Ana Web Sitesi"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="targetUrl" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Hedef Web Adresi (URL / API)
        </label>
        <div className="relative">
          <Globe className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
          <input
            id="targetUrl"
            name="targetUrl"
            type="url"
            placeholder="https://app.sirketiniz.com"
            required
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Yalnızca mülkiyetine veya güvenlik denetim iznine sahip olduğunuz hedefleri ekleyiniz.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tercih Edilen Mülkiyet Doğrulama Yöntemi
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="relative flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 hover:border-primary/60 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="verificationMethod"
              value="DNS_TXT"
              defaultChecked
              className="mt-1 accent-primary"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                <Server className="size-3.5 text-primary" />
                DNS TXT Kaydı (Önerilen)
              </div>
              <p className="text-[11px] text-muted-foreground">
                Alan adı DNS yönetici panelinizden 1 adet TXT kaydı eklenir.
              </p>
            </div>
          </label>

          <label className="relative flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 hover:border-primary/60 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="verificationMethod"
              value="META_TAG"
              className="mt-1 accent-primary"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                <FileCode className="size-3.5 text-primary" />
                HTML Meta Etiketi
              </div>
              <p className="text-[11px] text-muted-foreground">
                Web sitenizin &lt;head&gt; bölümüne bir doğrulama meta etiketi yerleştirilir.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Kaydediliyor...
            </>
          ) : (
            <>
              Devam Et & Doğrula <ArrowRight className="size-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
