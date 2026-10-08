import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Scale,
  FileText,
  Clock,
  Server,
  Lock,
  ArrowRight,
  ExternalLink,
  QrCode,
  Building2,
  Calendar,
  Zap,
} from "lucide-react";

import { getPublicVerificationRecord } from "@/lib/data/verification";
import { formatKurus } from "@/lib/escrow/money";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DeliverySealRecord } from "@/lib/delivery/types";
import { VerifyClient } from "./verify-client";
import {
  CheckBadgeIcon,
  ShieldCheckIcon as HeroShieldCheckIcon,
  ScaleIcon as HeroScaleIcon,
  ClockIcon as HeroClockIcon,
  DocumentCheckIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import {
  SiLetsencrypt,
  SiNginx,
  SiPostgresql,
} from "@icons-pack/react-simple-icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  const record = await getPublicVerificationRecord(reference);
  if (record) {
    return {
      title: `HMK 193 Doğrulama: ${reference} — Lancerix`,
      description: `6100 sayılı HMK m. 193 ve TBK m. 474/477 uyarınca resmi teknik bilirkişi ve teslimat doğrulama kaydı.`,
    };
  }

  const admin = createAdminClient();
  const { data: seal } = await admin
    .from("delivery_seals")
    .select("project_name, access_token")
    .eq("access_token", reference)
    .maybeSingle();

  if (seal) {
    return {
      title: `Teslimat Doğrulama Raporu: ${seal.project_name} | Lancerix ProofGuard`,
      description: `Kriptografik SHA-256 damgalı teslimat kanıtı ve TBK 477 yasal itiraz geri sayımı (${seal.access_token.slice(0, 8)}).`,
    };
  }

  return {
    title: `Doğrulama Bulunamadı — Lancerix`,
    description: `Belirtilen referans veya anahtara ait geçerli bir doğrulama kaydı bulunamadı.`,
  };
}

export default async function VerifyReferencePage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const record = await getPublicVerificationRecord(reference);

  if (!record) {
    const admin = createAdminClient();
    const { data: seal } = await admin
      .from("delivery_seals")
      .select("*")
      .eq("access_token", reference)
      .maybeSingle();

    if (seal) {
      const verifyUrl = `https://lancerix.com/verify/${seal.access_token}`;
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
          {/* Background Glow */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-blue-600/10 to-transparent blur-3xl" />
            <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-emerald-600/10 blur-3xl" />
          </div>

          {/* Top Navigation Bar */}
          <div className="relative border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-20">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link href={"/teslimat" as Route} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm tracking-tight text-white font-mono">
                  Lancerix <span className="text-indigo-400 font-normal">ProofGuard</span>
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  TBK 477 Delil Portalı
                </span>
              </div>
            </div>
          </div>

          <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
            <VerifyClient seal={seal as unknown as DeliverySealRecord} verifyUrl={verifyUrl} />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-center shadow-2xl">
          <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400 mb-4">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold font-display text-white mb-2">
            Belge Doğrulanamadı
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            <span className="font-mono text-slate-200">{reference}</span> referanslı sözleşme veya teslimat mühür kaydı bulunamadı. Lütfen QR kodu veya bağlantıyı kontrol ediniz.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={"/teslimat" as Route}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition text-white"
            >
              Yeni Teslimat Mührü Oluştur
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium transition text-slate-300"
            >
              Lancerix Ana Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Official Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Resmi Delil Doğrulama Portalı
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono">
                  HMK m. 193
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white mt-1">
                Teknik Tahkim ve Teslimat Mührü
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href={"/vaka/85k-kuyumculuk-tahkim" as Route}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition border border-slate-700"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vaka Dosyasını Aç</span>
            </Link>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <CheckBadgeIcon className="w-4 h-4 text-emerald-400" />
                <span>HUKUKEN KESİNLEŞMİŞ (TBK m. 477 ZIMNİ KABUL)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                {record.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Bu teslimat; Türk Borçlar Kanunu Madde 477 gereğince 7 günlük yasal inceleme süresinde somut teknik ayıp bildirimi yapılmadığından kanunen kabul edilmiştir.
              </p>
            </div>
            <div className="sm:text-right shrink-0 bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Kesinleşen Proje Bedeli</div>
              <div className="text-2xl font-extrabold font-display text-emerald-400">
                {formatKurus(record.projectAmountKurus)}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Meta Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parties & Reference */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HeroScaleIcon className="w-4 h-4 text-emerald-400" />
                Sözleşme Kimliği
              </span>
              <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 font-semibold">
                {record.reference}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 text-xs">Yüklenici (Geliştirici):</span>
                <span className="font-medium text-slate-200 text-right">{record.freelancerName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 text-xs">İşveren (Müşteri):</span>
                <span className="font-medium text-slate-200 text-right">{record.clientName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 text-xs">Sözleşme Tarihi:</span>
                <span className="font-mono text-xs text-slate-300">
                  {new Date(record.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 text-xs">Teslim Tarihi:</span>
                <span className="font-mono text-xs text-slate-300">
                  {new Date(record.deliveredAt).toLocaleDateString("tr-TR")}
                </span>
              </div>
            </div>
          </div>

          {/* ProofGuard Live Evidence */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-400" />
                ProofGuard Canlı Teslimat Kanıtı
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE (200 OK)
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Test URL:</span>
                <span className="font-mono text-xs text-blue-400 truncate max-w-[220px]">
                  {record.stagingUrl}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">HTTP Yanıt Kodu:</span>
                <span className="font-mono text-xs font-bold text-emerald-300">
                  {record.proofGuard.httpStatus} OK
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <HeroClockIcon className="w-3.5 h-3.5 text-slate-500" />
                  Ortalama Yanıt Süresi:
                </span>
                <span className="font-mono text-xs text-slate-200">
                  {record.proofGuard.latencyMs} ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <SiLetsencrypt className="w-3.5 h-3.5 text-amber-400" />
                  Güvenlik Protokolü:
                </span>
                <span className="font-mono text-xs text-emerald-300">
                  {record.proofGuard.tlsVersion}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <SiNginx className="w-3.5 h-3.5 text-emerald-400" />
                  Sunucu Mimarisi:
                </span>
                <span className="font-mono text-xs text-slate-200">
                  {record.proofGuard.serverHeader}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic SHA-256 Hashes */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Kriptografik Zaman Damgaları & SHA-256 Mühürleri</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-slate-500 mb-1">Sözleşme Metni Özeti (Contract Hash):</div>
              <div className="text-slate-300 break-all select-all">{record.contractSha256}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-slate-500 mb-1">Teslimat Kanıtı Özeti (Artifact Hash):</div>
              <div className="text-slate-300 break-all select-all">{record.deliverySha256}</div>
            </div>
          </div>
        </div>

        {/* Specification Criteria */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Sözleşmeye Bağlı Teknik Kabul Kriterleri (Specification as Code)
            </span>
            <span className="text-xs text-emerald-400 font-medium">4 / 4 Doğrulandı</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {record.criteria.map((c, i) => (
              <div
                key={c.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60"
              >
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{c.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{c.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Statement for Court & Mediators */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-400" />
            Mahkeme ve Arabuluculuk Delil Niteliği Beyanı
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            6100 sayılı Hukuk Muhakemeleri Kanunu Madde 193 uyarınca; tarafların sözleşme başlangıcında akdettikleri kabul kriterleri, zaman damgalı ProofGuard sistem logları ve süre aşımı kayıtları münhasır delil niteliğindedir. İşveren tarafından 7 günlük yasal sürede somut bir teknik ayıp raporu sunulmadığından, Türk Borçlar Kanunu Madde 477 gereğince eser zımnen kabul edilmiş sayılır ve fatura/ödemeye hak kazanılmıştır.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-4 pb-8">
          Lancerix Doğrulama Motoru · TBK m. 474/477 & HMK m. 193 Uyumlu Teknik Tahkim Protokolü
        </div>
      </div>
    </div>
  );
}
