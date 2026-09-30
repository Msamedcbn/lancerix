import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Shield,
  Calendar,
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { SecurityScan, VerificationMethod } from "@/lib/security/types";
import { TargetVerificationCard, StartScanButton } from "./target-detail-client";

type ScanSummary = SecurityScan["summary"];

export const metadata: Metadata = {
  title: "Hedef Güvenlik Yönetimi — Lancerix",
};

export default async function TargetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: target, error } = await supabase
    .from("security_targets")
    .select(`
      id,
      name,
      target_url,
      verification_method,
      verification_token,
      is_verified,
      verified_at,
      created_at,
      security_scans (
        id,
        scan_type,
        status,
        health_score,
        created_at,
        completed_at,
        summary
      )
    `)
    .eq("id", id)
    .eq("user_id", session.userId)
    .single();

  if (error || !target) {
    notFound();
  }

  const scans = target.security_scans || [];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex items-center gap-2">
        <Link
          href="/targets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Hedeflere Dön
        </Link>
      </div>

      {/* Target Title & Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{target.name}</h1>
            {target.is_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="size-3" /> Doğrulandı
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                <AlertTriangle className="size-3" /> Doğrulama Gerekli
              </span>
            )}
          </div>
          <a
            href={target.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {target.target_url} <ExternalLink className="size-3" />
          </a>
        </div>

        <StartScanButton targetId={target.id} isVerified={target.is_verified} />
      </div>

      {/* Verification Card */}
      <TargetVerificationCard
        targetId={target.id}
        targetUrl={target.target_url}
        method={target.verification_method as VerificationMethod}
        token={target.verification_token}
        isVerified={target.is_verified}
      />

      {/* Scans History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Tarama & Denetim Geçmişi</h2>
            <p className="text-xs text-muted-foreground">Bu hedef üzerinde koşturulan otonom güvenlik testleri</p>
          </div>
        </div>

        {scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/40 p-10 text-center">
            <Terminal className="size-8 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">Henüz Tarama Yapılmadı</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Hedefinizi doğruladıktan sonra &quot;Otonom Güvenlik Taraması Başlat&quot; butonuna tıklayarak ilk sızma ve zafiyet denetimini koşturabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card overflow-hidden">
            {scans.map((scan) => {
              const summary = scan.summary as Partial<ScanSummary>;
              return (
                <div
                  key={scan.id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {scan.scan_type === "FULL_AUDIT"
                          ? "Tam Kapsamlı Güvenlik Denetimi"
                          : scan.scan_type}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
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
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3" />
                      {new Date(scan.created_at).toLocaleString("tr-TR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {scan.status === "COMPLETED" && (
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">
                          %{scan.health_score} Puan
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {summary?.totalFindings || 0} bulgu tespit edildi
                        </p>
                      </div>
                    )}

                    <Link
                      href={`/scans/${scan.id}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted"
                    >
                      Raporu Görüntüle
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
