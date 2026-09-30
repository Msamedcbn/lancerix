"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Palette,
  ShieldCheck,
  Globe,
  Loader2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { saveAgencyBrandingAction, type AgencyBranding } from "@/app/(dashboard)/agency-branding-actions";

const COLOR_PRESETS = [
  { name: "Emerald Cyber", hex: "#10b981" },
  { name: "Electric Blue", hex: "#3b82f6" },
  { name: "Deep Violet", hex: "#8b5cf6" },
  { name: "Neon Amber", hex: "#f59e0b" },
  { name: "Crimson Red", hex: "#ef4444" },
];

export function WhiteLabelManager({
  initialBranding,
  isSubscribed,
}: {
  initialBranding: AgencyBranding | null;
  isSubscribed: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live preview state
  const [agencyName, setAgencyName] = useState(initialBranding?.agencyName || "Apex Security Labs");
  const [logoUrl, setLogoUrl] = useState(initialBranding?.logoUrl || "");
  const [primaryColor, setPrimaryColor] = useState(initialBranding?.primaryColor || "#10b981");
  const [customFooter, setCustomFooter] = useState(
    initialBranding?.customFooter || "Bu denetim raporu Apex Security Labs siber güvenlik motoru ile üretilmiştir."
  );
  const [isActive, setIsActive] = useState(
    isSubscribed ? (initialBranding ? initialBranding.isActive : true) : false,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("isActive", isActive ? "true" : "false");
    formData.set("primaryColor", primaryColor);

    const res = await saveAgencyBrandingAction(formData);
    setSaving(false);

    if (res.success) {
      setFeedback("White-Label ajans ayarlarınız başarıyla kaydedildi ve yayınlandı.");
      router.refresh();
    } else {
      setError(res.error || "Ayarlar kaydedilemedi.");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Settings Form */}
      <div className="lg:col-span-7 space-y-6">
        {feedback && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 font-medium flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {feedback}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border/80 bg-card p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="size-4 text-primary" /> Kurumsal Ajans Kimliği
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Müşterilerinizle paylaştığınız güvenlik denetim sertifikalarında Lancerix logosu yerine kendi logonuzu sergileyin.
              </p>
            </div>
            <label
              className={`relative inline-flex items-center ${isSubscribed ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              title={isSubscribed ? undefined : "Etkinleştirmek için Ajans planına abone olmanız gerekir."}
            >
              <input
                type="checkbox"
                checked={isActive}
                disabled={!isSubscribed}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              <span className="ml-2 text-xs font-medium text-foreground">
                {isActive ? "Aktif" : "Pasif"}
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ajans / Şirket Adı</label>
              <input
                type="text"
                name="agencyName"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Örn: Apex Cyber Security Studio"
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Logo URL Adresi (PNG veya SVG)</label>
              <input
                type="url"
                name="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://youragency.com/logo.svg"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground">
                Şeffaf arka planlı, yatay logo URL adresi giriniz. Boş bırakılırsa ajans adı metin olarak görünecektir.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Palette className="size-3.5 text-muted-foreground" /> Marka Vurgu Rengi
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-8 w-12 rounded cursor-pointer border border-border bg-background p-0.5"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-24 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-mono uppercase text-foreground focus:border-primary focus:outline-none"
                />
                <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setPrimaryColor(p.hex)}
                      className="size-5 rounded-full border border-border/80 transition-transform hover:scale-110"
                      style={{ backgroundColor: p.hex }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Özel Rapor Altbilgisi (Footer)</label>
              <textarea
                name="customFooter"
                rows={3}
                value={customFooter}
                onChange={(e) => setCustomFooter(e.target.value)}
                placeholder="Örn: Bu rapor Gizli & Güvenlidir. Apex Cyber Security tarafından denetlenmiştir."
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground">
                Raporun en altında, telif ve denetim onay beyanınız olarak yer alır.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border/60">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Ayarları Kaydet & Yayınla
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Card */}
      <div className="lg:col-span-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          Canlı Müşteri Raporu Önizlemesi
        </h3>

        <div className="rounded-2xl border border-border/90 bg-card p-5 space-y-6 shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: primaryColor }} />

          {/* Mock Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={agencyName} className="h-6 max-w-[120px] object-contain" />
              ) : (
                <div
                  className="size-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {agencyName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold text-foreground truncate max-w-[140px]">
                {agencyName}
              </span>
            </div>

            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded border"
              style={{
                color: primaryColor,
                borderColor: `${primaryColor}40`,
                backgroundColor: `${primaryColor}15`,
              }}
            >
              DOĞRULANMIŞ SERTİFİKA
            </span>
          </div>

          {/* Mock Content */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">HEDEF URL</p>
                <p className="text-xs font-semibold text-foreground">client-app.company.com</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground font-mono">GÜVENLİK SKORU</p>
                <p className="text-base font-bold" style={{ color: primaryColor }}>
                  95 / 100 (A+)
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-background/80 border border-border/60 p-3 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>OWASP Top 10 Denetimi</span>
                <span className="text-emerald-400 font-semibold font-mono">GEÇTİ (%100)</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>SOC 2 Type II Uyumluluğu</span>
                <span className="text-emerald-400 font-semibold font-mono">UYUMLU (%92)</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Kritik Güvenlik Açığı</span>
                <span className="text-emerald-400 font-semibold font-mono">0 Bulgu</span>
              </div>
            </div>
          </div>

          {/* Mock Footer */}
          <div className="pt-3 border-t border-border/60 text-center">
            <p className="text-[10px] text-muted-foreground">
              {customFooter}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">💡 Ajans Paketi Avantajı (₺3.500/ay)</p>
          <p className="text-[11px]">
            Tüm müşterilerinize gönderdiğiniz veya web sitelerine ekledikleri Lancerix rozet ve sertifikalarında tam white-label sağlanır. Kendi siber güvenlik stüdyonuzun gücünü sergileyin.
          </p>
        </div>
      </div>
    </div>
  );
}
