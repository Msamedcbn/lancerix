"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Gavel,
  Volume2,
  VolumeX,
  Play,
  Terminal,
  Scale,
  Server,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  Lock,
} from "lucide-react";
import {
  CheckBadgeIcon,
  DocumentArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import {
  ARBITRATION_CASE_COPY,
  type CourtObjection,
} from "@/lib/i18n/dictionaries/arbitration-case";

interface StenographerLog {
  time: string;
  text: string;
  tag: string;
}

export function CourtroomTribunal({
  locale = DEFAULT_LOCALE,
}: Readonly<{
  locale?: Locale;
}>) {
  const t = ARBITRATION_CASE_COPY[locale];

  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gavelSwinging, setGavelSwinging] = useState(false);
  const [probeStatus, setProbeStatus] = useState<"ready" | "running" | "success">("ready");
  const [probeLatency, setProbeLatency] = useState<number>(138);
  const [selectedObjectionId, setSelectedObjectionId] = useState<string>("obj1");

  const [stenographerLogs, setStenographerLogs] = useState<StenographerLog[]>([]);

  // Web Audio Synthesizer for Gavel Knock
  function playGavelSound() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // AudioContext unavailable or blocked by autoplay
    }
  }

  // Populate initial stenographer record
  useEffect(() => {
    const initialLogs: StenographerLog[] =
      locale === "tr"
        ? [
            { time: "14:00:00", text: "Duruşma açıldı. Esas No: 2026/85000-KUYUMCU dosyaya alındı.", tag: "AÇILIŞ" },
            { time: "14:00:12", text: "HMK m. 193 uyarınca tarafların dijital imza hash kütükleri doğrulandı.", tag: "TUTANAK" },
            { time: "14:00:28", text: "Davacı işveren temsilcisi Hakan B. söz aldı; fesih ve iade talep etti.", tag: "İDDİA" },
            { time: "14:00:45", text: "Davalı yazılımcı Samed Çoban'ın TBK m. 477 yasal kabul savunması kayda geçti.", tag: "SAVUNMA" },
          ]
        : [
            { time: "14:00:00", text: "Tribunal convened. Docket No: LCX-2026-85000-KUYUMCU entered into record.", tag: "SESSION" },
            { time: "14:00:12", text: "Parties' cryptographic signature hashes verified under Art. 193 CPC.", tag: "RECORD" },
            { time: "14:00:28", text: "Claimant employer representative Hakan B. addressed bench; demanded refund.", tag: "CLAIM" },
            { time: "14:00:45", text: "Respondent developer Samed Çoban's statutory acceptance defense under Art. 477 recorded.", tag: "DEFENSE" },
          ];
    setStenographerLogs(initialLogs);
  }, [locale]);

  function handleGavelStrike() {
    setGavelSwinging(true);
    if (soundEnabled) playGavelSound();
    setTimeout(() => setGavelSwinging(false), 500);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const logText =
      locale === "tr"
        ? `[HAKİM TOKMAĞI] Mahkeme heyeti toplandı. Duruşma resmen açıldı. Taraflar dinleniyor.`
        : `[GAVEL STRIKE] Arbitral bench seated. Court in session. Hearing oral arguments.`;

    setStenographerLogs((prev) => [{ time: timeStr, text: logText, tag: "HÜKÜM" }, ...prev.slice(0, 7)]);
  }

  function handleRunProbe() {
    setProbeStatus("running");
    if (soundEnabled) playGavelSound();

    setTimeout(() => {
      setProbeStatus("success");
      setProbeLatency(138);

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      const logText =
        locale === "tr"
          ? `[ADLİ BİLİŞİM] Staging sunucusu problandı: HTTP 200 OK, TLS 1.3, Latency: 138 ms (SLA <250ms). İhlal saptanmadı.`
          : `[FORENSIC PROBE] Staging host audited: HTTP 200 OK, TLS 1.3, Latency: 138 ms (SLA <250ms). Zero defects detected.`;

      setStenographerLogs((prev) => [{ time: timeStr, text: logText, tag: "TELEMETRİ" }, ...prev.slice(0, 7)]);
    }, 1200);
  }

  function handleSelectObjection(obj: CourtObjection) {
    setSelectedObjectionId(obj.id);
    if (soundEnabled) playGavelSound();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const logText =
      locale === "tr"
        ? `[ÇAPRAZ SORGU] İşveren itirazı (${obj.objectionTitle}): Mahkeme Kararı -> ${obj.rulingTitle}.`
        : `[CROSS-EXAM] Employer objection (${obj.objectionTitle}): Bench Ruling -> ${obj.rulingTitle}.`;

    setStenographerLogs((prev) => [{ time: timeStr, text: logText, tag: "KARAR" }, ...prev.slice(0, 7)]);
  }

  const selectedObjection =
    t.courtroom.phase3.objections.find((o) => o.id === selectedObjectionId) ??
    t.courtroom.phase3.objections[0]!;

  return (
    <div className="space-y-8">
      {/* Top Courtroom Ambient Bar (Light Theme) */}
      <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-xs relative overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t.courtHeader.sessionBadge}
              </span>
              <span className="text-xs font-mono text-muted-foreground bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                {t.courtHeader.caseNo}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
              {t.courtroom.title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {t.courtroom.subtitle}
            </p>
          </div>

          {/* Court Action Controls (Gavel & Sound) */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition shadow-2xs"
              title={soundEnabled ? "Mute Gavel Sound" : "Enable Gavel Sound"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Ses Açık</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Sessiz</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGavelStrike}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-transform active:scale-95 ${
                gavelSwinging ? "rotate-[-18deg] scale-105" : ""
              }`}
            >
              <Gavel className="w-4 h-4 text-white" />
              <span>{t.courtroom.gavelStrikeLabel}</span>
            </button>
          </div>
        </div>

        {/* Live Court Stenographer Feed */}
        <div className="pt-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Terminal className="w-4 h-4 text-emerald-600" />
              <span className="font-bold tracking-wider">{t.courtroom.stenographerTitle}</span>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              {t.courtroom.stenographerLive}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-4 font-mono text-xs space-y-2 max-h-48 overflow-y-auto shadow-inner text-slate-800">
            {stenographerLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-slate-400 select-none text-[11px]">{log.time}</span>
                <span className="px-1.5 py-0.5 rounded bg-white text-[10px] text-slate-700 font-bold uppercase border border-slate-200 shrink-0">
                  {log.tag}
                </span>
                <span className="text-slate-800 font-medium">{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tribunal Phase Stepper Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { phase: 1, label: t.courtroom.tabs.phase1, icon: Scale },
          { phase: 2, label: t.courtroom.tabs.phase2, icon: Server },
          { phase: 3, label: t.courtroom.tabs.phase3, icon: AlertCircle },
          { phase: 4, label: t.courtroom.tabs.phase4, icon: FileCheck2 },
        ].map((item) => (
          <button
            key={item.phase}
            type="button"
            onClick={() => {
              setActivePhase(item.phase as 1 | 2 | 3 | 4);
              if (soundEnabled) playGavelSound();
            }}
            className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition ${
              activePhase === item.phase
                ? "bg-white border-brand text-brand ring-2 ring-brand/15 font-bold shadow-xs"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-slate-50 shadow-2xs"
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activePhase === item.phase
                  ? "bg-brand-muted text-brand"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold font-display truncate">{item.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {item.phase === 1 && (locale === "tr" ? "İddia & Savunma" : "Claims & Defense")}
                {item.phase === 2 && (locale === "tr" ? "Adli Loglar & Probe" : "Forensics & Probe")}
                {item.phase === 3 && (locale === "tr" ? "Ret Gerekçeleri" : "Bench Rulings")}
                {item.phase === 4 && (locale === "tr" ? "Bağlayıcı İlam" : "Binding Award")}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* PHASE 1: Pleadings & Claims */}
      {activePhase === 1 && (
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-8 animate-in fade-in duration-300 shadow-xs">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground">
              {t.courtroom.phase1.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t.courtroom.phase1.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Claimant Employer Box */}
            <div className="p-6 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-rose-200/80">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.parties.claimant.avatar}</span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{t.parties.claimant.name}</h4>
                    <span className="text-[11px] text-rose-700 font-semibold">{t.parties.claimant.role}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-rose-700 border border-rose-200">
                  {locale === "tr" ? "İPTAL TALEBİ" : "CANCELLATION"}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {t.courtroom.phase1.claimantHeader}
                </span>
                <blockquote className="p-4 rounded-xl bg-white border border-rose-200/80 text-xs sm:text-sm text-foreground/85 italic leading-relaxed shadow-2xs">
                  {t.parties.claimant.claimSummary}
                </blockquote>
              </div>

              <div className="text-xs text-muted-foreground flex items-center justify-between pt-2">
                <span>{locale === "tr" ? "Dava Talebi:" : "Formal Demand:"}</span>
                <span className="font-semibold text-rose-700">{t.parties.claimant.demands}</span>
              </div>
            </div>

            {/* Respondent Developer Box */}
            <div className="p-6 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.parties.respondent.avatar}</span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{t.parties.respondent.name}</h4>
                    <span className="text-[11px] text-emerald-700 font-semibold">{t.parties.respondent.role}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-emerald-700 border border-emerald-200">
                  {locale === "tr" ? "HAKEDİŞ TALEBİ" : "PAYOUT DEMAND"}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {t.courtroom.phase1.respondentHeader}
                </span>
                <blockquote className="p-4 rounded-xl bg-white border border-emerald-200/80 text-xs sm:text-sm text-foreground/85 italic leading-relaxed shadow-2xs">
                  {t.parties.respondent.claimSummary}
                </blockquote>
              </div>

              <div className="text-xs text-muted-foreground flex items-center justify-between pt-2">
                <span>{locale === "tr" ? "Dava Talebi:" : "Formal Demand:"}</span>
                <span className="font-semibold text-emerald-700">{t.parties.respondent.demands}</span>
              </div>
            </div>
          </div>

          {/* Contract Digest */}
          <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand" />
              {t.courtroom.phase1.contractDigestTitle}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {t.courtroom.phase1.contractDigestItems.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-[11px] text-muted-foreground">{item.label}</div>
                  <div className="text-xs font-bold text-foreground mt-1">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => {
                setActivePhase(2);
                if (soundEnabled) playGavelSound();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-brand-foreground font-bold text-xs sm:text-sm transition shadow-sm hover:opacity-90 active:scale-[0.98]"
            >
              <span>{locale === "tr" ? "Delil İnceleme Aşamasına Geç (Aşama 2)" : "Proceed to Evidence Review (Phase 2)"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: Forensic Evidence Bench */}
      {activePhase === 2 && (
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-8 animate-in fade-in duration-300 shadow-xs">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground">
              {t.courtroom.phase2.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t.courtroom.phase2.description}
            </p>
          </div>

          {/* Live Forensic Telemetry Probe Console */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-700 uppercase tracking-wider block font-bold">
                  {t.courtroom.phase2.probeTitle}
                </span>
                <span className="text-xs text-muted-foreground">
                  Hedef URL: <code className="text-foreground font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">https://staging-api.kuyumcu-demo.com/v1/health</code>
                </span>
              </div>

              <button
                type="button"
                onClick={handleRunProbe}
                disabled={probeStatus === "running"}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-brand-foreground disabled:opacity-50 font-bold text-xs transition shadow-sm hover:opacity-90 active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{t.courtroom.phase2.runProbeButton}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-muted-foreground">HTTP Response</div>
                <div className="text-lg font-bold font-mono text-emerald-600 mt-1">200 OK</div>
                <div className="text-[10px] text-muted-foreground/80">{locale === "tr" ? "Staging Sağlam" : "Staging Active"}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-muted-foreground">Gecikme (Latency)</div>
                <div className="text-lg font-bold font-mono text-foreground mt-1">
                  {probeStatus === "running" ? "..." : `${probeLatency} ms`}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">{locale === "tr" ? "SLA <250ms Karşılandı" : "SLA <250ms Met"}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-muted-foreground">Şifreleme Katmanı</div>
                <div className="text-lg font-bold font-mono text-emerald-700 mt-1">TLS 1.3</div>
                <div className="text-[10px] text-muted-foreground/80">HSTS / CSP Aktif</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-muted-foreground">Sunucu Kütüğü</div>
                <div className="text-lg font-bold font-mono text-foreground mt-1 truncate">Nginx / Cloud</div>
                <div className="text-[10px] text-muted-foreground/80">Uptime: %100</div>
              </div>
            </div>

            <div className="text-xs font-mono text-muted-foreground pt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {probeStatus === "running"
                  ? t.courtroom.phase2.probeStatusRunning
                  : probeStatus === "success"
                  ? t.courtroom.phase2.probeStatusSuccess
                  : t.courtroom.phase2.probeStatusReady}
              </span>
            </div>
          </div>

          {/* Admissible Court Exhibits Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {locale === "tr" ? "Mahkeme Heyetine Sunulan Delil Dosyası (HMK m. 193):" : "Exhibits Submitted to Tribunal (Art. 193 CPC):"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {t.courtroom.phase2.evidences.map((ev) => (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl bg-white border border-border space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-xs transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ev.code}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">{ev.legalCitation}</span>
                    </div>

                    <h5 className="text-sm font-bold text-foreground">{ev.title}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ev.summary}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    {Object.entries(ev.technicalData).map(([key, val]) => (
                      <div key={key}>
                        <div className="text-slate-400 text-[10px]">{key}</div>
                        <div className="text-foreground font-semibold truncate">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setActivePhase(1)}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              {locale === "tr" ? "← Aşama 1: İddianameye Dön" : "← Back to Phase 1: Pleadings"}
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePhase(3);
                if (soundEnabled) playGavelSound();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-brand-foreground font-bold text-xs sm:text-sm transition shadow-sm hover:opacity-90 active:scale-[0.98]"
            >
              <span>{locale === "tr" ? "Çapraz Sorgu Aşamasına Geç (Aşama 3)" : "Proceed to Cross-Examination (Phase 3)"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 3: Cross-Examination & Objection Simulator */}
      {activePhase === 3 && (
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-8 animate-in fade-in duration-300 shadow-xs">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground">
              {t.courtroom.phase3.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t.courtroom.phase3.description}
            </p>
          </div>

          {/* Objection Selectors */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              {t.courtroom.phase3.selectPrompt}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {t.courtroom.phase3.objections.map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => handleSelectObjection(obj)}
                  className={`p-4 rounded-2xl border text-left transition space-y-2 ${
                    selectedObjectionId === obj.id
                      ? "bg-amber-50/70 border-amber-300 shadow-xs ring-2 ring-amber-400/20 text-foreground font-semibold"
                      : "bg-white border-border text-muted-foreground hover:text-foreground hover:bg-slate-50 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white text-amber-800 font-bold border border-amber-200">
                      {obj.courtRuling}
                    </span>
                    <Gavel className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="text-xs font-bold text-foreground">{obj.objectionTitle}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Bench Ruling Showcase */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/30 via-white to-emerald-50/30 border border-amber-200 space-y-5 relative overflow-hidden shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
              <div className="flex items-center gap-2">
                <ScaleIcon className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-bold text-foreground font-display">
                  {selectedObjection.rulingTitle}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Maddi Hukuk: <strong className="text-amber-700">{selectedObjection.legalBasis}</strong>
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                {locale === "tr" ? "İşverenin Mahkemede İleri Sürdüğü Sav:" : "Employer Objection Pleaded:"}
              </span>
              <p className="p-3.5 rounded-xl bg-white text-xs sm:text-sm text-foreground/85 italic border border-slate-200 shadow-2xs">
                {selectedObjection.employerArgument}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                {locale === "tr" ? "Mahkeme Heyetinin Gerekçeli Ret Kararı:" : "Bench Dismissal Ruling & Judicial Rationale:"}
              </span>
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                {selectedObjection.rulingReasoning}
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
              <span>{locale === "tr" ? "Dayanak Delil Dosyası:" : "Exhibits Ref:"}</span>
              <span className="font-mono text-emerald-700 font-semibold">{selectedObjection.evidenceRef}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setActivePhase(2)}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              {locale === "tr" ? "← Aşama 2: Delillere Dön" : "← Back to Phase 2: Evidence"}
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePhase(4);
                if (soundEnabled) playGavelSound();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-brand-foreground font-bold text-xs sm:text-sm transition shadow-sm hover:opacity-90 active:scale-[0.98]"
            >
              <span>{locale === "tr" ? "Nihai Mahkeme İlamını Oku (Aşama 4)" : "Review Enforceable Arbitral Award (Phase 4)"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 4: Final Enforceable Arbitral Award */}
      {activePhase === 4 && (
        <div className="rounded-3xl bg-gradient-to-b from-emerald-50/40 via-white to-white border-2 border-emerald-200 p-6 sm:p-8 space-y-8 animate-in fade-in duration-300 shadow-xs">
          <div className="text-center space-y-2 pb-6 border-b border-slate-200">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200 shadow-xs">
              <CheckBadgeIcon className="w-4 h-4 text-emerald-600" />
              <span>{t.courtHeader.statusBadge}</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-extrabold font-display text-foreground tracking-wide">
              {t.courtroom.phase4.decreeHeader}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono">
              {t.courtroom.phase4.decreeSubheader} · {t.courtroom.phase4.decreeNumber}
            </p>
          </div>

          {/* Operative Verdict Items */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-emerald-800 font-display">
              {t.courtroom.phase4.verdictRulingTitle}
            </h4>

            <div className="space-y-3">
              {t.courtroom.phase4.verdictItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-foreground leading-relaxed shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Judicial Opinion & Reasoning */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t.courtroom.phase4.judicialReasoningTitle}
            </h5>
            <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
              {t.courtroom.phase4.judicialReasoning}
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="text-xs font-mono text-emerald-800 font-semibold break-all">
              {t.courtroom.phase4.sha256Seal}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground">{t.courtroom.phase4.signatureClerk}</div>
                <div className="font-bold text-foreground">Lancerix Autonomous Registry Daemon</div>
                <div className="text-[10px] text-emerald-700 font-mono font-medium">SHA-256 Zaman Damgası: 2026-10-14 14:00:00 UTC</div>
              </div>

              <div className="space-y-1 sm:text-right">
                <div className="text-muted-foreground">{t.courtroom.phase4.signaturePresident}</div>
                <div className="font-bold text-foreground">Lancerix Bağımsız Tahkim Heyeti</div>
                <div className="text-[10px] text-emerald-700 font-mono font-medium">HMK m. 193 Onaylı Resmi İlam</div>
              </div>
            </div>
          </div>

          {/* Download & Verification CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <a
                href="/api/contracts/ornek-tahkim/pdf"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm active:scale-[0.98]"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                <span>{t.courtroom.phase4.downloadPdfCta}</span>
              </a>

              <Link
                href={"/verify/LCX-2026-85000-KUYUMCU" as Route}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-foreground text-sm font-semibold transition border border-border shadow-2xs"
              >
                <span>{t.courtroom.phase4.publicVerifyCta}</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="text-xs text-muted-foreground text-center sm:text-right">
              {t.courtroom.phase4.qrNotice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
