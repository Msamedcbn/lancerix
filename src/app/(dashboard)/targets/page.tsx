import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Globe, CheckCircle2, AlertTriangle, ArrowRight, Shield } from "lucide-react";

import { getTargetsAction } from "@/app/(dashboard)/security-actions";

export const metadata: Metadata = {
  title: "Hedefler & Varlıklar — Lancerix",
};

export default async function TargetsPage() {
  const targets = await getTargetsAction();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hedefler & Varlıklar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Otonom güvenlik taraması ve sürekli izleme yapılan web siteleriniz ve API uç noktalarınız.
          </p>
        </div>

        <Link
          href="/targets/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Yeni Hedef Ekle
        </Link>
      </div>

      {targets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Globe className="size-7" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">Kayıtlı Varlık Bulunamadı</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Web sitenizi veya API adresinizi ekleyerek mülkiyet doğrulamasını yapın ve ilk siber güvenlik denetimini başlatın.
          </p>
          <Link
            href="/targets/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Hedef Ekle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {targets.map((target) => {
            const latestScan = target.security_scans?.[0];
            return (
              <div
                key={target.id}
                className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-border hover:shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground text-base">{target.name}</h3>
                      <p className="font-mono text-xs text-muted-foreground truncate">{target.target_url}</p>
                    </div>

                    {target.is_verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="size-3" /> Doğrulandı
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="size-3" /> Doğrulama Gerekli
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      <Shield className="size-3.5 text-primary" />
                      <span>
                        Son Skor:{" "}
                        <strong className="text-foreground">
                          {latestScan ? `%${latestScan.health_score}` : "Yapılmadı"}
                        </strong>
                      </span>
                    </div>
                    <span>•</span>
                    <div>
                      Taramalar:{" "}
                      <strong className="text-foreground">{target.security_scans?.length || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  <Link
                    href={`/targets/${target.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    Detaylar & Tarama Yönetimi <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
