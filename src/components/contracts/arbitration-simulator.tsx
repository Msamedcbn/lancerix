"use client";

import { useState } from "react";
import {
  ScaleIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  DocumentCheckIcon,
  ArrowRightIcon,
  CommandLineIcon,
  SparklesIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import {
  SiNginx,
  SiPostgresql,
  SiNextdotjs,
  SiDocker,
  SiRedis,
  SiLetsencrypt,
} from "@icons-pack/react-simple-icons";

type SimulationScenario = "tbk477_silence" | "tbk474_arbitrary" | "valid_defect";

export function ArbitrationSimulator() {
  const [scenario, setScenario] = useState<SimulationScenario>("tbk477_silence");
  const [arbitraryReason, setArbitraryReason] = useState("Proje içime sinmedi, iptal edip paramı geri istiyorum.");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-8 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ScaleIcon className="w-4 h-4" />
            <span>İnteraktif Tahkim & İtiraz Simülatörü</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold font-display text-white">
            Kanunlar Koda Dönüştüğünde Ne Olur?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Freelancer ve işveren arasındaki en kritik 3 uyuşmazlık senaryosunu canlı test edin.
          </p>
        </div>

        {/* Tech Stack Icons from Simple Icons */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-500 font-medium mr-1 uppercase tracking-wider">
            Altyapı:
          </span>
          <div className="flex items-center gap-2 text-slate-400">
            <span title="Next.js App Router"><SiNextdotjs className="w-4 h-4 hover:text-white transition" /></span>
            <span title="PostgreSQL"><SiPostgresql className="w-4 h-4 hover:text-blue-400 transition" /></span>
            <span title="Nginx Reverse Proxy"><SiNginx className="w-4 h-4 hover:text-emerald-400 transition" /></span>
            <span title="Docker Staging Container"><SiDocker className="w-4 h-4 hover:text-sky-400 transition" /></span>
            <span title="Redis Queue"><SiRedis className="w-4 h-4 hover:text-red-400 transition" /></span>
            <span title="Let's Encrypt TLS 1.3"><SiLetsencrypt className="w-4 h-4 hover:text-amber-400 transition" /></span>
          </div>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => {
            setScenario("tbk477_silence");
            setAttemptedSubmit(false);
          }}
          className={`flex items-start gap-3 p-3.5 rounded-2xl text-left transition border ${
            scenario === "tbk477_silence"
              ? "bg-emerald-500/10 border-emerald-500/40 text-white"
              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950"
          }`}
        >
          <div className={`p-2 rounded-xl mt-0.5 ${scenario === "tbk477_silence" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-900 text-slate-500"}`}>
            <ClockIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold font-display">Senaryo 1: TBK m. 477</div>
            <div className="text-[11px] text-slate-400 mt-0.5">İşveren 7 Gün Sessiz Kaldı (Zımni Kabul)</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setScenario("tbk474_arbitrary");
            setAttemptedSubmit(false);
          }}
          className={`flex items-start gap-3 p-3.5 rounded-2xl text-left transition border ${
            scenario === "tbk474_arbitrary"
              ? "bg-amber-500/10 border-amber-500/40 text-white"
              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950"
          }`}
        >
          <div className={`p-2 rounded-xl mt-0.5 ${scenario === "tbk474_arbitrary" ? "bg-amber-500/20 text-amber-400" : "bg-slate-900 text-slate-500"}`}>
            <ShieldExclamationIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold font-display">Senaryo 2: TBK m. 474</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Keyfi "Beğenmedim" Fesih Girişimi</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setScenario("valid_defect");
            setAttemptedSubmit(false);
          }}
          className={`flex items-start gap-3 p-3.5 rounded-2xl text-left transition border ${
            scenario === "valid_defect"
              ? "bg-blue-500/10 border-blue-500/40 text-white"
              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950"
          }`}
        >
          <div className={`p-2 rounded-xl mt-0.5 ${scenario === "valid_defect" ? "bg-blue-500/20 text-blue-400" : "bg-slate-900 text-slate-500"}`}>
            <CommandLineIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold font-display">Senaryo 3: Somut Kusur</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Teknik Loglu İtiraz & 48s Düzeltme</div>
          </div>
        </button>
      </div>

      {/* Scenario Content Body */}
      {scenario === "tbk477_silence" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
                <ClockIcon className="w-4 h-4" />
                <span>YASAL KONTROL PENCERESİ: 7 GÜN 00 SAAT</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono">
                Cron: /api/cron/process-review-deadlines
              </span>
            </div>

            {/* Stepper Progression */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-semibold">Gün 0 (Teslimat)</div>
                <div className="text-emerald-400 font-mono mt-1 text-[11px]">Staging Yayında</div>
                <p className="text-[10px] text-slate-500 mt-0.5">ProofGuard HTTP 200 OK aldı.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-semibold">Gün 1 - 6 (İnceleme)</div>
                <div className="text-amber-400 font-mono mt-1 text-[11px]">İşveren Sessiz</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Hiçbir teknik ayıp iletilmedi.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-semibold">Gün 7+ (Süre Doldu)</div>
                <div className="text-emerald-400 font-mono mt-1 text-[11px]">Deadline Aşıldı</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Otomatik zımni kabul tetiklendi.</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                <div className="text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckBadgeIcon className="w-4 h-4 text-emerald-400" />
                  Hüküm Kesinleşti
                </div>
                <div className="text-white font-mono font-bold mt-1 text-[11px]">85.000 TL Hak Ediş</div>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">HMK 193 QR Dosya Kilitli.</p>
              </div>
            </div>
          </div>

          {/* Legal Result Card */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3 text-xs">
            <CheckBadgeIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-emerald-300">Hukuki Sonuç (TBK m. 477):</span>
              <p className="text-slate-300 leading-relaxed">
                İşveren süresi içinde inceleme ve ayıp ihbarında bulunmadığı için eser kanunen kabul edilmiş sayılır. Yazılımcı icra takibi veya arabuluculukta doğrudan bu zaman damgalı bilirkişi dosyasını sunarak 85.000 TL alacağını tahsil edebilir.
              </p>
            </div>
          </div>
        </div>
      )}

      {scenario === "tbk474_arbitrary" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-slate-800">
              <span className="text-amber-400 flex items-center gap-1.5">
                <ExclamationTriangleIcon className="w-4 h-4" />
                İşveren Tarafından Gönderilmeye Çalışılan İtiraz Formu
              </span>
              <span className="text-slate-500 font-mono text-[11px]">TBK m. 474 Filtresi</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">
                  İşverenin İtiraz Gerekçesi (Test Edin):
                </label>
                <textarea
                  value={arbitraryReason}
                  onChange={(e) => {
                    setArbitraryReason(e.target.value);
                    setAttemptedSubmit(false);
                  }}
                  rows={2}
                  className="w-full text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Teknik log, HTTP kodu veya şartname kriteri seçilmedi.
                </span>
                <button
                  type="button"
                  onClick={() => setAttemptedSubmit(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  İtirazı Göndermeyi Dene
                </button>
              </div>
            </div>
          </div>

          {/* Validation Rejection Alert */}
          {attemptedSubmit ? (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3 text-xs animate-in fade-in duration-200">
              <ShieldExclamationIcon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-rose-300">
                  İtiraz Engellendi: TBK m. 474 Somut Ayıp İhbarı Eksik!
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Lancerix kural motoru sübjektif gerekçeleri kabul etmez. İtirazın kayda geçebilmesi için:
                  1) Şartnamedeki hangi kabul kriterinin ihlal edildiği, 2) Hata logu veya başarısız API testi sunulmalıdır. Aksi halde teslimat geçerli kalır ve süre sayacı işlemeye devam eder.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
              <InformationCircleIcon className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <span>
                "İtirazı Göndermeyi Dene" butonuna basarak Lancerix kural motorunun keyfi fesih girişimini nasıl engellediğini görün.
              </span>
            </div>
          )}
        </div>
      )}

      {scenario === "valid_defect" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-slate-800">
              <span className="text-blue-400 flex items-center gap-1.5 font-mono">
                <CommandLineIcon className="w-4 h-4" />
                SOMUT TEKNİK AYIP BİLDİRİMİ (Örnek: Altın API Çökmesi)
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">Doğrulanmış Kusur</span>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-900 p-3.5 rounded-xl border border-slate-800/80">
              <div className="text-slate-400">[İhlal Edilen Kriter]: Kriter #1 (Canlı Altın & Döviz API)</div>
              <div className="text-rose-400">[Hata Logu]: HTTP 502 Bad Gateway - Connection Timeout to provider API</div>
              <div className="text-slate-500">[Tekrar Adımları]: curl -X GET https://staging.domain.com/api/v1/gold-prices → 502</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-semibold text-slate-200">Adil Düzeltme Hakkı</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Yazılımcıya 48 saatlik düzeltme ve yeniden dağıtım hakkı tanınır; proje doğrudan iptal edilemez.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-semibold text-slate-200">Delil Kütüğüne İşlenme</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hata logu ve düzeltme commit'i SHA-256 ile bilirkişi raporuna eklenir; her iki taraf korunur.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3 text-xs">
            <DocumentCheckIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-blue-300">Hakemlik Dengesi:</span>
              <p className="text-slate-300 leading-relaxed">
                Lancerix yazılımcıyı keyfi fesihten korurken, işvereni de çalışmayan koddan korur. Somut teknik hata tespit edildiğinde adil bir mühendislik döngüsü işletilir.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
