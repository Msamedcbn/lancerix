"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Globe,
  FileCode,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { sealDeliveryAction } from "./actions";

const DEFAULT_CRITERIA = [
  "Stripe ve Kredi Kartı test ödemesi başarıyla tamamlanıyor",
  "Mobil Safari ve Chrome üzerinde responsive tasarım hatası yok",
  "Kullanıcı kayıt ve parola sıfırlama e-posta bildirimleri çalışıyor",
];

export default function TeslimatPage() {
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [gitCommit, setGitCommit] = useState("");
  const [criteria, setCriteria] = useState<string[]>(DEFAULT_CRITERIA);
  const [newCriterion, setNewCriterion] = useState("");

  const [loading, setLoading] = useState(false);
  const [stepText, setStepText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    if (criteria.length >= 10) return;
    setCriteria([...criteria, newCriterion.trim()]);
    setNewCriterion("");
  };

  const handleRemoveCriterion = (index: number) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleUpdateCriterion = (index: number, value: string) => {
    const updated = [...criteria];
    updated[index] = value;
    setCriteria(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectName.trim() || projectName.length < 3) {
      setError("Lütfen geçerli bir proje veya hakediş başlığı girin (en az 3 karakter).");
      return;
    }

    if (!targetUrl.trim() || !targetUrl.startsWith("http")) {
      setError("Lütfen geçerli bir Staging / Canlı URL giriniz (http:// veya https:// ile başlamalıdır).");
      return;
    }

    const validCriteria = criteria.map((c) => c.trim()).filter(Boolean);
    if (validCriteria.length === 0) {
      setError("En az 1 adet teslimat kabul kriteri girmelisiniz.");
      return;
    }

    setLoading(true);
    setStepText("SSRF ve ağ güvenlik denetimi yapılıyor...");

    try {
      const stepTimer1 = setTimeout(() => {
        setStepText("Hedef staging sunucusuna bağlanılıyor (HTTP 200 & SSL)...");
      }, 1500);

      const stepTimer2 = setTimeout(() => {
        setStepText("DOM snapshot ve kriptografik SHA-256 damgası oluşturuluyor...");
      }, 3500);

      const result = await sealDeliveryAction({
        projectName: projectName.trim(),
        targetUrl: targetUrl.trim(),
        criteria: validCriteria,
        gitCommit: gitCommit.trim() || null,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setStepText("Mühürleme tamamlandı! Doğrulama sayfasına yönlendiriliyorsunuz...");
      router.push(`/verify/${result.accessToken}` as Route);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-blue-600/10 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-emerald-600/10 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-8 mb-8 border-b border-slate-800/80">
          <Link href="/" className="flex items-center gap-2.5 text-slate-200 hover:text-white transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">
              Lancerix <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ml-1">ProofGuard</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <Link href="/dashboard" className="hover:text-slate-200 transition">
              Dashboard
            </Link>
            <Link
              href="/#nasil-calisir"
              className="hidden sm:inline-flex items-center gap-1 hover:text-slate-200 transition"
            >
              Nasıl Çalışır? <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            Tek Taraflı Teslimat Mührü (Single-Player Proof)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Müşterinin &ldquo;Beğenmedim, Çalışmıyor&rdquo; Bahanelerine Son Verin
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Staging URL&apos;inizi ve kabul kriterlerinizi tarafsız üçüncü taraf motorumuzla 60 saniyede mühürleyin.
            Zaman damgalı SHA-256 kanıtı ve TBK 477 yasal itiraz geri sayımı oluşturun.
          </p>

          <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-slate-900 text-xs text-slate-400">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Üyelik Gerekmez</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>SHA-256 Mühürlü</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>7 Günlük TBK 477 Saati</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-medium text-rose-200">Mühürleme Başarısız</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project / Milestone Name */}
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Proje veya Hakediş Adı <span className="text-rose-400">*</span>
              </label>
              <input
                id="projectName"
                type="text"
                required
                disabled={loading}
                placeholder="Örn: E-Ticaret Sepet, Ödeme ve Kargo Entegrasyonu"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Upwork/Bionluk sözleşmesinde veya müşterinizle yazıştığınız hakediş başlığı.
              </p>
            </div>

            {/* Target Staging URL */}
            <div>
              <label htmlFor="targetUrl" className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Canlı / Staging URL <span className="text-rose-400">*</span>
              </label>
              <input
                id="targetUrl"
                type="url"
                required
                disabled={loading}
                placeholder="https://staging.musteri-app.vercel.app veya https://demo.siteniz.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition font-mono"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Müşterinin test edebileceği çalışan canlı adres. Motorumuz HTTP 200 durumunu ve yanıt başlıklarını doğrulayacaktır.
              </p>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Kabul Kriterleri (Müşterinin Onaylaması Gerekenler) <span className="text-rose-400">*</span>
                </label>
                <span className="text-xs text-slate-500 font-mono">{criteria.length} / 10 Madde</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Bu maddeler kriptografik hash&apos;e dahil edilir. Müşteri daha sonra teslimat kapsamı dışındaki keyfi eklemeleri bahane edemez.
              </p>

              <div className="space-y-2.5">
                {criteria.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 w-5 text-right">{idx + 1}.</span>
                    <input
                      type="text"
                      disabled={loading}
                      value={item}
                      onChange={(e) => handleUpdateCriterion(idx, e.target.value)}
                      className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                      placeholder={`Kriter #${idx + 1}`}
                    />
                    {criteria.length > 1 && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleRemoveCriterion(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition"
                        title="Kriteri Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {criteria.length < 10 && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      disabled={loading}
                      value={newCriterion}
                      onChange={(e) => setNewCriterion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCriterion();
                        }
                      }}
                      placeholder="Yeni kabul kriteri ekleyin (örn: PostgreSQL veritabanı migrasyonları tamamlandı)..."
                      className="flex-1 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    />
                    <button
                      type="button"
                      disabled={loading || !newCriterion.trim()}
                      onClick={handleAddCriterion}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ekle
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Git Commit / Version */}
            <div>
              <label htmlFor="gitCommit" className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                Git Commit Hash veya Sürüm Etiketi <span className="text-slate-500 text-xs font-normal">(İsteğe Bağlı)</span>
              </label>
              <input
                id="gitCommit"
                type="text"
                disabled={loading}
                placeholder="Örn: 9a3f21b veya v1.2.0-milestone-release"
                value={gitCommit}
                onChange={(e) => setGitCommit(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition font-mono"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Teslim ettiğiniz kod tabanının exact commit hash&apos;i. Kodun sonradan değiştirilmediğini ispatlar.
              </p>
            </div>

            {/* Submit CTA */}
            <div className="pt-4 border-t border-slate-800/80">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span className="text-sm font-medium">{stepText || "Teslimat taranıyor ve mühürleniyor..."}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition-transform" />
                    <span>Mühürle ve Teslimat Kanıtı Dosyası Oluştur</span>
                    <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-500 mt-3">
                Mühür oluşturulduğunda teslimat linki, SHA-256 damgası ve müşterinize göndereceğiniz mesaj şablonu anında üretilir.
              </p>
            </div>
          </form>
        </div>

        {/* Footer info box */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
          <span>
            ⚖️ <strong>TBK 477 Hükmü:</strong> Eser teslim edildiğinde iş sahibi makul süre (7 gün) içinde ayıpları bildirmekle yükümlüdür; aksi halde eser zımnen kabul edilmiş sayılır.
          </span>
          <Link href="/rehber/freelance-teslim-ve-kabul" className="text-indigo-400 hover:underline shrink-0 ml-4">
            Yasal Rehberi Oku →
          </Link>
        </div>
      </div>
    </div>
  );
}
