import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, Shield, Calendar, ArrowRight, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { SecurityScan } from "@/lib/security/types";
import type { Tables } from "@/lib/supabase/database.types";

type TargetRow = Pick<Tables<"security_targets">, "id" | "name" | "target_url">;
type ScanSummary = SecurityScan["summary"];

export const metadata: Metadata = {
  title: "Taramalar & Ajan Denetimleri — Lancerix",
};

export default async function ScansPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: scans, error } = await supabase
    .from("security_scans")
    .select(`
      id,
      scan_type,
      status,
      health_score,
      created_at,
      completed_at,
      summary,
      document_sha256,
      security_targets (
        id,
        name,
        target_url
      )
    `)
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const scanList = scans || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Taramalar & Ajan Denetimleri
        </h1>
        <p className="text-sm text-muted-foreground">
          Hedefleriniz üzerinde çalıştırılan tüm otonom sızma ve güvenlik denetim kayıtları.
        </p>
      </div>

      {scanList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
          <Terminal className="size-12 text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold text-foreground">Henüz Tarama Kaydı Yok</h2>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Bir hedef seçip otonom siber güvenlik taraması başlattığınızda sonuçlar ve canlı loglar burada listelenecektir.
          </p>
          <Link
            href="/targets"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Hedefleri Görüntüle
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card overflow-hidden">
          {scanList.map((scan) => {
            const target = scan.security_targets as TargetRow | null;
            const summary = scan.summary as Partial<ScanSummary>;

            return (
              <div
                key={scan.id}
                className="flex flex-col gap-3 p-5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-sm text-foreground">
                      {target?.name || "Hedef"}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        scan.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : scan.status === "RUNNING"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {scan.status}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground truncate">{target?.target_url}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3" />
                    {new Date(scan.created_at).toLocaleString("tr-TR")}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  {scan.status === "COMPLETED" && (
                    <div className="text-right">
                      <span className="text-sm font-bold text-foreground">
                        %{scan.health_score} Skor
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        {summary?.criticalCount ? (
                          <span className="text-red-400 font-semibold">{summary.criticalCount} Kritik</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">0 Kritik</span>
                        )}
                      </p>
                    </div>
                  )}

                  <Link
                    href={`/scans/${scan.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-muted"
                  >
                    Rapor & Loglar <ArrowRight className="size-3" />
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
