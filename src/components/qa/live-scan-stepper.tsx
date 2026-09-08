"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, Zap, Eye, Link2, Lock } from "lucide-react";

export type ScanStep = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const STEPS: ScanStep[] = [
  { id: "ssrf", label: "SSRF & Hedef Güvenlik Taraması", icon: ShieldCheck },
  { id: "accessibility", label: "WCAG 2.1 AA Erişilebilirlik Taraması (axe-core)", icon: Eye },
  { id: "performance", label: "Core Web Vitals Hız & Performans Analizi (Lighthouse)", icon: Zap },
  { id: "deadlinks", label: "Sayfa İçi Ölü/Kırık Link Avcısı (Linkinator)", icon: Link2 },
  { id: "seal", label: "Kriptografik SHA-256 Şifreleme & Zaman Damgası", icon: Lock },
];

export function LiveScanStepper({ isScanning }: { isScanning: boolean }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    if (!isScanning) {
      setActiveStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isScanning]);

  if (!isScanning) return null;

  return (
    <div className="glass rounded-xl border border-brand/20 bg-brand/5 p-4 sm:p-5 my-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="mb-3 flex items-center justify-between">
        <span className="mono text-xs font-semibold text-brand tracking-wider uppercase flex items-center gap-1.5">
          <Loader2 className="size-3.5 animate-spin text-brand" />
          Otonom Laboratuvar Taraması Çalışıyor...
        </span>
        <span className="mono text-xs text-muted-foreground">
          %{Math.round(((activeStepIndex + 1) / STEPS.length) * 100)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all duration-200 ${
                isCurrent
                  ? "bg-background border border-brand/30 shadow-xs text-foreground font-medium"
                  : isDone
                    ? "text-muted-foreground opacity-90"
                    : "text-muted-foreground/50 opacity-60"
              }`}
            >
              <span className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="size-4 text-brand" />
                ) : isCurrent ? (
                  <Loader2 className="size-4 text-brand animate-spin" />
                ) : (
                  <Icon className="size-4 text-muted-foreground/40" />
                )}
              </span>
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
