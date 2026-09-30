"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Play,
  Loader2,
  Server,
  FileCode,
  ShieldCheck,
  Terminal,
} from "lucide-react";

import { verifyTargetAction, startSecurityScanAction } from "@/app/(dashboard)/security-actions";
import type { VerificationMethod } from "@/lib/security/types";

export function TargetVerificationCard({
  targetId,
  targetUrl,
  method,
  token,
  isVerified,
}: {
  targetId: string;
  targetUrl: string;
  method: VerificationMethod;
  token: string;
  isVerified: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  let hostname = targetUrl;
  try {
    hostname = new URL(targetUrl).hostname;
  } catch {}

  const dnsHost = `_lancerix-challenge.${hostname}`;
  const dnsValue = `lancerix-verify=${token}`;
  const metaSnippet = `<meta name="lancerix-site-verification" content="${token}" />`;

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleVerify() {
    setVerifying(true);
    setMessage(null);
    const res = await verifyTargetAction(targetId);
    setVerifying(false);

    if (res.success) {
      setMessage({ text: res.message || "Başarıyla doğrulandı!", error: false });
      router.refresh();
    } else {
      setMessage({ text: res.error, error: true });
    }
  }

  if (isVerified) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-400">Alan Adı Mülkiyeti Doğrulandı</h3>
            <p className="text-xs text-muted-foreground">
              Bu hedef üzerinde otonom yapay zekâ güvenlik taramaları ve sürekli izleme çalıştırma yetkisi onaylandı.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-card p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">Hedef Mülkiyet Doğrulaması Gerekli</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Siber güvenlik denetimlerinin başlatılabilmesi için bu hedefin size ait olduğunu doğrulamanız gerekmektedir.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {verifying ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Kontrol Ediliyor...
            </>
          ) : (
            <>
              <RefreshCw className="size-3.5" /> Şimdi Doğrula
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-medium ${
            message.error
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {method === "DNS_TXT" ? (
        <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Server className="size-3.5 text-primary" />
            DNS Yönetim Panelinize Aşağıdaki TXT Kaydını Ekleyin:
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Ana Bilgisayar (Host / Name)</span>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[11px] text-foreground">
                <span className="truncate">{dnsHost}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(dnsHost)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Kayıt Değeri (Value / Content)</span>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[11px] text-foreground">
                <span className="truncate">{dnsValue}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(dnsValue)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <FileCode className="size-3.5 text-primary" />
            HTML &lt;head&gt; Bölümüne Ekleyin:
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 font-mono text-[11px] text-foreground">
            <span className="truncate">{metaSnippet}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(metaSnippet)}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StartScanButton({
  targetId,
  isVerified,
}: {
  targetId: string;
  isVerified: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setRunning(true);
    setError(null);

    const res = await startSecurityScanAction(targetId, "FULL_AUDIT");
    setRunning(false);

    if (res.success) {
      router.push(`/scans/${res.data.scanId}`);
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          {error}
        </div>
      )}
      <button
        onClick={handleStart}
        disabled={running || !isVerified}
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98]"
      >
        {running ? (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Ajan Başlatılıyor & Taranıyor...
          </>
        ) : (
          <>
            <Play className="size-3.5 fill-current" /> Otonom Güvenlik Taraması Başlat
          </>
        )}
      </button>
    </div>
  );
}
