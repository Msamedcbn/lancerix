"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Printer,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import type { ComplianceEvaluation, ComplianceControl } from "@/lib/security/compliance";

export function ComplianceView({
  evaluation,
  targetName,
  targetUrl,
}: {
  evaluation: ComplianceEvaluation;
  targetName: string;
  targetUrl: string;
}) {
  const [activeTab, setActiveTab] = useState<"OWASP" | "SOC2">("OWASP");
  const framework = activeTab === "OWASP" ? evaluation.owasp : evaluation.soc2;

  return (
    <div className="space-y-8">
      {/* Top Readiness Scorecards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Genel Uyumluluk Skoru
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-foreground">
              %{evaluation.overallComplianceScore}
            </span>
            <span className="text-sm font-semibold text-emerald-400">
              {evaluation.overallComplianceScore >= 80 ? "Standartlara Uygun" : "Açıklar Var"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Hedef: {targetName} ({targetUrl})</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              OWASP Top 10 (2021)
            </span>
            <span className="text-xs font-mono font-bold text-primary">
              {evaluation.owasp.passingControls}/{evaluation.owasp.totalControls}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">%{evaluation.owasp.score}</span>
            <span className="text-xs font-medium text-emerald-400">{evaluation.owasp.grade}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${evaluation.owasp.score}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              SOC 2 Type II (Security)
            </span>
            <span className="text-xs font-mono font-bold text-primary">
              {evaluation.soc2.passingControls}/{evaluation.soc2.totalControls}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">%{evaluation.soc2.score}</span>
            <span className="text-xs font-medium text-emerald-400">{evaluation.soc2.grade}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${evaluation.soc2.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs & Controls Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-1">
            <button
              onClick={() => setActiveTab("OWASP")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "OWASP"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              OWASP Top 10 Denetimi
            </button>
            <button
              onClick={() => setActiveTab("SOC2")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "SOC2"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SOC 2 Güvenlik Kriterleri
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
          >
            <Printer className="size-3.5" /> Denetçi Kontrol Listesi Yazdır (PDF)
          </button>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-xs">
          <div className="space-y-1 pb-4 border-b border-border/60">
            <h3 className="text-base font-semibold text-foreground">{framework.name}</h3>
            <p className="text-xs text-muted-foreground">{framework.description}</p>
          </div>

          <div className="divide-y divide-border/60">
            {framework.controls.map((control) => {
              const statusPill =
                control.status === "PASS" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="size-3" /> Uygun (Pass)
                  </span>
                ) : control.status === "WARN" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="size-3" /> Dikkat (Warning)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
                    <XCircle className="size-3" /> Uyumsuz (Fail)
                  </span>
                );

              return (
                <div key={control.id} className="py-4 space-y-2 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                        {control.code}
                      </code>
                      <span className="font-semibold text-sm text-foreground">{control.title}</span>
                      <span className="text-[11px] text-muted-foreground hidden md:inline">
                        • {control.category}
                      </span>
                    </div>
                    {statusPill}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{control.description}</p>

                  {control.matchingVulnerabilities.length > 0 && (
                    <div className="rounded-lg bg-red-500/5 border border-red-500/15 p-3 text-xs text-red-300 space-y-1">
                      <span className="font-semibold block text-[11px]">Etkileyen Bulgular:</span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {control.matchingVulnerabilities.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
