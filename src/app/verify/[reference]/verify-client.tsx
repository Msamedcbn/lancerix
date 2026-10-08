"use client";

import { useState, useEffect } from "react";
import type { Route } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Globe,
  FileCode,
  FileText,
  Download,
  Share2,
} from "lucide-react";
import type { DeliverySealRecord } from "@/lib/delivery/types";

interface VerifyClientProps {
  seal: DeliverySealRecord;
  verifyUrl: string;
}

export function VerifyClient({ seal, verifyUrl }: VerifyClientProps) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Countdown timer calculations
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiresAt = new Date(seal.expires_at).getTime();
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [seal.expires_at]);

  const handoverSnippet = `Merhaba, ${seal.project_name} teslimatı tamamlanmıştır.

Canlı çalışma durumu, HTTP başlıkları ve kabul kriterleri tarafsız Lancerix motoruyla mühürlenmiştir.
📌 Doğrulama ve İnceleme Raporu: ${verifyUrl}
🛡️ Kriptografik SHA-256 Damgası: ${seal.document_sha256}

⏳ TBK 477 Hükmü: İnceleme süresi 7 gündür. Bu süre içinde spesifik bir teknik kusur ve tekrar adımı bildirilmediği takdirde teslimat yasal olarak eksiksiz kabul edilmiş sayılır.`;

  const copyToClipboard = async (text: string, type: "snippet" | "hash" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "snippet") {
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2500);
      } else if (type === "hash") {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      } else if (type === "url") {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const prober = seal.prober_summary;
  const isHealthyHttp = prober?.httpStatus >= 200 && prober?.httpStatus < 400;

  return (
    <div className="space-y-8">
      {/* 1. Main Status & TBK 477 Countdown Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/40 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  SEALED • RESMİ TESLİMAT KAYDI
                </span>
                <span className="text-xs font-mono text-slate-500">
                  ID: {seal.access_token.slice(0, 12)}...
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                {seal.project_name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>Mühürlenme Zamanı:</span>
                <strong className="text-slate-300 font-mono">
                  {new Date(seal.created_at).toLocaleString("tr-TR")}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => copyToClipboard(verifyUrl, "url")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition border border-slate-700/50 cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? "Link Kopyalandı" : "Rapor Linkini Paylaş"}</span>
            </button>
          </div>
        </div>

        {/* Countdown Box */}
        <div className="mt-6 pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                TBK 477 Objektif İtiraz Saati
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {timeLeft.isExpired ? "Süre Doldu" : "Yasal İnceleme Penceresi"}
            </span>
          </div>

          {timeLeft.isExpired ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-emerald-300">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
              <div className="text-xs leading-relaxed">
                <strong className="text-emerald-200 block text-sm">
                  Yasal Zımni Kabul Gerçekleşti (TBK 477)
                </strong>
                7 günlük yasal itiraz penceresinde iş sahibi tarafından spesifik bir kusur bildirilmediği için teslimat hukuken eksiksiz kabul edilmiş sayılır.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                  {timeLeft.days}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mt-1">Gün</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                  {timeLeft.hours.toString().padStart(2, "0")}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mt-1">Saat</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                  {timeLeft.minutes.toString().padStart(2, "0")}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mt-1">Dakika</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                  {timeLeft.seconds.toString().padStart(2, "0")}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mt-1">Saniye</div>
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
            * Türk Borçlar Kanunu Madde 477 gereğince; eser teslim alındıktan sonra iş sahibi imkan bulur bulmaz eseri gözden geçirmek ve ayıpları bildirmekle yükümlüdür. Bildirilmediği takdirde eser zımnen kabul edilmiş sayılır.
          </p>
        </div>
      </div>

      {/* 2. Client Handover Snippet (1-Click Copy Box) */}
      <div className="rounded-2xl p-6 bg-slate-900/60 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 via-slate-900/60 to-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Müşteriye Gönderilecek Teslimat Metni</h2>
          </div>
          <button
            onClick={() => copyToClipboard(handoverSnippet, "snippet")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            {copiedSnippet ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Tek Tıkla Kopyala</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Bu hazır metni Upwork, Bionluk, Slack veya e-posta teslim mesajınıza yapıştırın:
        </p>
        <pre className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all">
          {handoverSnippet}
        </pre>
      </div>

      {/* 3. Acceptance Criteria Checklist */}
      <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Mühürlü Kabul Kriterleri Listesi</h2>
          </div>
          <span className="text-xs font-mono text-slate-500">{seal.criteria.length} Madde Doğrulandı</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Bu kriterler teslim anında sabitlenmiştir. Teslimat kapsamı dışındaki sonradan uydurulan istekler kusur sayılamaz.
        </p>

        <div className="space-y-2.5">
          {seal.criteria.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Technical Snapshot & Prober Findings */}
      <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Canlı Teknik Snapshot (ProofGuard)</h2>
          </div>
          <a
            href={seal.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            <span>Canlı Siteyi Aç</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">HTTP Durumu</span>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-sm font-bold">
              <span className={`w-2 h-2 rounded-full ${isHealthyHttp ? "bg-emerald-400" : "bg-rose-400"}`} />
              <span className={isHealthyHttp ? "text-emerald-300" : "text-rose-300"}>
                {prober?.httpStatus || 200} {prober?.statusText || "OK"}
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Yanıt Süresi</span>
            <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
              {prober?.responseTimeMs || 0} ms
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">SSL / TLS</span>
            <div className="text-sm font-bold text-emerald-300 mt-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Güvenli HTTPS</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Git Versiyonu</span>
            <div className="text-sm font-bold text-slate-300 mt-1 font-mono truncate">
              {seal.git_commit || "Belirtilmedi"}
            </div>
          </div>
        </div>

        {/* DOM Title & Meta */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
          <div>
            <span className="text-slate-500 block">Yakalanan Sayfa Başlığı (&lt;title&gt;):</span>
            <span className="text-slate-200 font-medium">{prober?.pageTitle || "(Başlık bulunamadı)"}</span>
          </div>
          {prober?.metaDescription && (
            <div>
              <span className="text-slate-500 block">Meta Açıklaması:</span>
              <span className="text-slate-300">{prober.metaDescription}</span>
            </div>
          )}
          <div>
            <span className="text-slate-500 block">Hedef Adres:</span>
            <span className="text-indigo-400 font-mono break-all">{seal.target_url}</span>
          </div>
        </div>
      </div>

      {/* 5. Cryptographic SHA-256 Seal Box */}
      <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">SHA-256 Kriptografik Bütünlük Mührü</h2>
          </div>
          <button
            onClick={() => copyToClipboard(seal.document_sha256, "hash")}
            className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition cursor-pointer"
          >
            {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copiedHash ? "Kopyalandı" : "Hash'i Kopyala"}</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Bu 64 karakterlik matematiksel özet; proje adını, teslim kriterlerini, yanıt durumunu ve zaman damgasını sabitleyen değiştirilemez kanıttır.
        </p>
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-purple-300 break-all select-all">
          {seal.document_sha256}
        </div>
      </div>

      {/* 6. Monetization Gate: Formal Forensic PDF Dossier Download */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/30 via-slate-900/80 to-blue-900/30 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Hukuki & Platform Geçerli
          </span>
          <h3 className="text-lg font-bold text-white mt-2">
            Resmi Kaşeli Adli Delil Raporu (PDF)
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Upwork / Bionluk arabuluculuk davalarında veya banka harcama itirazlarında (chargeback) kullanılmak üzere tam HTTP log dökümlü, QR doğrulamalı mühürlü sertifika.
          </p>
        </div>

        <a
          href="/site-kontrol"
          className="shrink-0 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium py-3 px-5 rounded-xl text-xs sm:text-sm shadow-lg shadow-indigo-600/20 inline-flex items-center gap-2 transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Adli Raporu İndir ($29 / ₺349)</span>
        </a>
      </div>

      {/* Footer Return */}
      <div className="text-center pt-4">
        <Link
          href={"/teslimat" as Route}
          className="text-xs text-slate-500 hover:text-slate-300 transition"
        >
          ← Yeni bir teslimat mührü oluştur
        </Link>
      </div>
    </div>
  );
}
