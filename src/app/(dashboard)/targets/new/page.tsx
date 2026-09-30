import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { TargetForm } from "./target-form";

export const metadata: Metadata = {
  title: "Yeni Güvenlik Hedefi Ekle — Lancerix",
};

export default function NewTargetPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          href="/targets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Hedeflere Dön
        </Link>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        <div className="space-y-1 mb-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Yeni Güvenlik Hedefi Tanımla
          </h1>
          <p className="text-xs text-muted-foreground">
            Lancerix Otonom Ajanı hedef web uygulamanızı ve API yüzeyinizi denetlemek için yapılandırılacak.
          </p>
        </div>

        <TargetForm />
      </div>

      <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-[11px] text-muted-foreground flex items-start gap-2.5">
        <ShieldAlert className="size-4 shrink-0 text-primary mt-0.5" />
        <span>
          <strong>Yasal Uyarı & İzin Protokolü:</strong> Lancerix, yalnızca kullanıcısı tarafından mülkiyeti veya yazılı güvenlik denetim yetkisi doğrulanmış etki alanlarında çalışır. Üçüncü taraflara ait sistemlerin taranması engellenir.
        </span>
      </div>
    </div>
  );
}
