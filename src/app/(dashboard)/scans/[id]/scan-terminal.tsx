"use client";

import { useState } from "react";
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ShieldAlert,
  Code,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { SEVERITY_CONFIG, type Severity, type VulnerabilityCategory } from "@/lib/security/types";

export function AgentTerminal({
  logs,
}: {
  logs: { id: string; step_name: string; message: string; level: string; created_at: string }[];
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-zinc-950 font-mono shadow-md">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500/80" />
            <span className="size-2.5 rounded-full bg-amber-500/80" />
            <span className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Terminal className="size-3.5 text-primary" /> Lancerix Autonomous Agent Terminal
          </span>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="max-h-72 overflow-y-auto p-4 space-y-2 text-xs text-zinc-300">
          {logs.length === 0 ? (
            <div className="text-zinc-500 italic">Ajan terminal çıktısı bekleniyor...</div>
          ) : (
            logs.map((log) => {
              const levelColor =
                log.level === "ERROR"
                  ? "text-red-400 bg-red-500/10"
                  : log.level === "WARN"
                  ? "text-amber-400 bg-amber-500/10"
                  : log.level === "SUCCESS"
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-blue-400 bg-blue-500/10";

              return (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-zinc-600 shrink-0 text-[10px]">
                    {new Date(log.created_at).toLocaleTimeString("tr-TR")}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${levelColor}`}>
                    [{log.step_name}]
                  </span>
                  <span className="text-zinc-200 break-words">{log.message}</span>
                </div>
              );
            })
          )}
          <div className="flex items-center gap-1 text-primary pt-1">
            <span className="animate-pulse">_</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function VulnerabilityCard({
  vuln,
}: {
  vuln: {
    id: string;
    title: string;
    description: string;
    severity: Severity;
    category: VulnerabilityCategory;
    cvss_score: number;
    evidence?: string;
    remediation_patch?: string;
  };
}) {
  const [showRemediation, setShowRemediation] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = SEVERITY_CONFIG[vuln.severity];

  function copyPatch(patch: string) {
    navigator.clipboard.writeText(patch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`rounded-xl border ${config.border} bg-card p-5 space-y-4 shadow-xs`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}>
              <ShieldAlert className="size-3" />
              {config.label}
            </span>
            <span
              className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
              title="Ciddiyet seviyesinden türetilen dahili risk puanı -- resmi CVSS metodolojisiyle hesaplanmamıştır."
            >
              Risk Puanı {vuln.cvss_score}
            </span>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">
              {vuln.category.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className="text-base font-semibold text-foreground">{vuln.title}</h3>
        </div>

        {vuln.remediation_patch && (
          <button
            onClick={() => setShowRemediation(!showRemediation)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
          >
            <Code className="size-3.5" />
            {showRemediation ? "Yamayı Gizle" : "Onarım Kodu (Patch)"}
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{vuln.description}</p>

      {vuln.evidence && (
        <div className="rounded-lg border border-border/80 bg-muted/40 p-3 text-xs font-mono text-zinc-300">
          <span className="text-[10px] text-muted-foreground uppercase block font-sans font-medium mb-1">
            Gözlemlenen Kanıt (Evidence):
          </span>
          {vuln.evidence}
        </div>
      )}

      {showRemediation && vuln.remediation_patch && (
        <div className="rounded-xl border border-primary/20 bg-zinc-950 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <FileCheck className="size-3.5" /> Lancerix AI Önerilen Kod Yaması:
            </span>
            <button
              onClick={() => copyPatch(vuln.remediation_patch!)}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-400" /> Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="size-3" /> Kopyala
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900/90 p-3 font-mono text-xs text-zinc-200">
            <code>{vuln.remediation_patch}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
