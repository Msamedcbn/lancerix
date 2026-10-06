import Link from "next/link";
import {
  CheckCircle2,
  Scale,
  Server,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import { SHOWCASE_KUYUMCU_DATA } from "@/lib/data/verification";
import { formatKurus } from "@/lib/escrow/money";
import { ArbitrationSimulator } from "@/components/contracts/arbitration-simulator";
import {
  SiNginx,
  SiLetsencrypt,
  SiNextdotjs,
} from "@icons-pack/react-simple-icons";
import {
  CheckBadgeIcon,
  ClockIcon as HeroClockIcon,
  DocumentArrowDownIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

export const metadata = {
  title: "85.000 TL Kuyumculuk Örnek Tahkim Dosyası — Lancerix",
  description: "Canlı altın fiyatlama ve MASAK AML projesinde keyfi itiraz krizinin TBK m. 477 ve HMK m. 193 ile nasıl çözüldüğünü inceleyin.",
};

export default function OrnekTahkimPage() {
  const record = SHOWCASE_KUYUMCU_DATA;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-emerald-400 transition">
              Ana Sayfa
            </Link>
            <span>/</span>
            <span className="text-slate-200">Örnek Tahkim Dosyası</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Canlı Bilirkişi Örneği
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>Gerçek Vaka İncelemesi · Adli Bilişim & Hukuk Standartı</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white">
            85.000 TL Kuyumculuk & MASAK Projesi: Haksız Fesih Krizinin Hukuki Çözümü
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            Yazılımcı 22 gün boyunca canlı kur motorunu ve MASAK uyumluluk altyapısını geliştirip demo yaptıktan sonra; işverenin keyfi olarak &ldquo;projeyi iptal ettik&rdquo; deme girişiminin, Lancerix teknik delil protokolü sayesinde nasıl çürütüldüğünü adım adım inceleyin.
          </p>
        </div>

        {/* The Real Story Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-white">
                Olayın Özeti: Keyfi Fesih ve &ldquo;Beğenmedim&rdquo; Girişimi
              </h2>
              <p className="text-xs text-slate-400">
                Piyasadaki klasik serbest çalışan / işveren krizinin somut örneği
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono text-emerald-400">1</span>
                Sözleşme & Kriterler
              </div>
              <p className="text-slate-400 leading-relaxed">
                Canlı altın/döviz API motoru ve MASAK AML doğrulaması için 85.000 TL revize bedel üzerinde çift taraflı mutabakat sağlandı ve kriterler koda bağlandı.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono text-amber-400">2</span>
                Teslimat & Sessizlik
              </div>
              <p className="text-slate-400 leading-relaxed">
                22 günlük geliştirme sonrası canlı demo çalışır vaziyette teslim edildi. İşveren sözlü &ldquo;tamam&rdquo; dedi ancak faturayı ödememek için 7 gün boyunca somut hiçbir teknik ayıp bildirmedi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono text-emerald-400">3</span>
                TBK m. 477 ile Koruma
              </div>
              <p className="text-slate-400 leading-relaxed">
                Lancerix yasal sürenin sonunda otomatik olarak zımni kabulü mühürledi. HMK 193 delil sözleşmesi sayesinde işverenin soyut itirazları mahkemede geçersiz kaldı.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Arbitration & Dispute Simulator */}
        <ArbitrationSimulator />

        {/* Live Dossier Interactive Card */}
        <div className="rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 sm:p-8 space-y-8 shadow-2xl">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
                <span>Dava / Tahkim Referansı</span>
                <span>·</span>
                <span className="text-slate-200 font-bold">{record.reference}</span>
              </div>
              <h3 className="text-2xl font-bold font-display text-white">
                {record.title}
              </h3>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <div className="text-xs text-slate-400">Hüküm Bedeli</div>
              <div className="text-3xl font-extrabold font-display text-emerald-400">
                {formatKurus(record.projectAmountKurus)}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold">
                <CheckBadgeIcon className="w-4 h-4 text-emerald-400" />
                <span>Zımnen Kabul Edildi (TBK m. 477)</span>
              </div>
            </div>
          </div>

          {/* ProofGuard Live Monitoring Probe Grid with Simple Icons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                ProofGuard Canlı Teslimat Kanıtı (Adli Bilişim Logu)
              </h4>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Sürekli Doğrulama Aktif
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">HTTP Yanıtı</div>
                  <SiNextdotjs className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition" />
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">200 OK</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Erişilebilirlik Tam</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">Ortalama Yanıt</div>
                  <HeroClockIcon className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition" />
                </div>
                <div className="text-lg font-bold font-mono text-slate-100 mt-1">138 ms</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Sözleşme Kriteri: &lt;250ms</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">Güvenlik Katmanı</div>
                  <SiLetsencrypt className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition" />
                </div>
                <div className="text-lg font-bold font-mono text-emerald-300 mt-1">TLS 1.3</div>
                <div className="text-[10px] text-slate-400 mt-0.5">HSTS / CSP Doğrulandı</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">Sunucu Donanımı</div>
                  <SiNginx className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition" />
                </div>
                <div className="text-lg font-bold font-mono text-slate-200 mt-1 truncate">Nginx / Cloud</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Dedicated Staging Host</div>
              </div>
            </div>
          </div>

          {/* Criteria Presets */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CheckBadgeIcon className="w-4 h-4 text-emerald-400" />
              Sözleşmeye Bağlı Kriterlerin Karşılanma Durumu (4 / 4 Başarılı)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {record.criteria.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{c.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {c.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Signatures */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                HMK m. 193 Uyarınca Çift Taraflı İmzalanmış Dijital Mühür
              </span>
              <span className="font-mono text-[11px] text-emerald-400">SHA-256 İmzalı</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-sans font-medium text-xs mb-1">
                  Yazılımcı İmzası ({record.freelancerName})
                </div>
                <div className="text-slate-500 text-[11px]">Tarih: 2026-09-14 09:12 · IP: 185.22.184.12</div>
                <div className="text-emerald-400/90 text-[10px] mt-1 break-all select-all">
                  Mühür: 7a41ef689bc01a4ef39082918e9a11...
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-sans font-medium text-xs mb-1">
                  İşveren İmzası ({record.clientName})
                </div>
                <div className="text-slate-500 text-[11px]">Tarih: 2026-09-14 11:04 · IP: 212.156.40.85</div>
                <div className="text-emerald-400/90 text-[10px] mt-1 break-all select-all">
                  Mühür: 3d92fb011ce499ab110488219c01...
                </div>
              </div>
            </div>
          </div>

          {/* Download & Verification CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href="/api/contracts/ornek-tahkim/pdf"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                <span>Resmi HMK 193 Bilirkişi Raporunu İndir (PDF)</span>
              </a>

              <Link
                href={`/verify/${record.reference}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition border border-slate-700"
              >
                <span>Kamu Doğrulama Sayfası</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="text-xs text-slate-400 text-center sm:text-right">
              PDF üzerinde HMK 193 uyumlu dinamik karekod mevcuttur.
            </div>
          </div>
        </div>

        {/* Bottom Call to Action for Freelancers & Agencies */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-slate-800 p-8 text-center space-y-4">
          <h3 className="text-2xl font-bold font-display text-white">
            Senin de 50.000 TL - 500.000 TL Arası Bir Teslimatın Askıda mı Kalmasın?
          </h3>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            Projenin başlangıcında 2 dakika içinde Lancerix sözleşmeni oluştur. Şartnameyi koda bağla, ProofGuard teslimat kanıtı ve TBK 477 yasal korumasıyla emeğini garantiye al.
          </p>
          <div className="pt-2">
            <Link
              href="/freelancer/new"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-xl"
            >
              <span>Yeni Tahkim Sözleşmesi Başlat</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
