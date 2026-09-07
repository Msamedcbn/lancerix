import type { Locale } from "@/lib/i18n/config";

/**
 * The founder/about page. Exists for the same reason the trust-architecture
 * page does: a platform that touches a client's payment decision needs a
 * named, accountable person behind it, not just a brand mark. Keep this to
 * facts a reader can verify (name, role, contact) -- no invented credentials
 * or history, matching the "no fabricated traction" rule the roadmap and
 * organizationJsonLd() comments already established.
 */
export type AboutCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  founderName: string;
  founderRole: string;
  founderBio: readonly string[];
  contactLabel: string;
};

export const ABOUT_COPY: Record<Locale, AboutCopy> = {
  tr: {
    metaTitle: "Kurucu | Lancerix",
    metaDescription:
      "Lancerix'i kim, neden kuruyor: kurucu Samed Çoban ve platformun arkasındaki mühendislik yaklaşımı.",
    eyebrow: "Kurucu",
    title: "Lancerix'in arkasında kim var",
    intro:
      "Bir ödeme veya doğrulama platformuna güvenmeden önce, arkasında kimin olduğunu bilmek makul bir istektir. İşte o kişi.",
    founderName: "Samed Çoban",
    founderRole: "Kurucu",
    founderBio: [
      "Lancerix'i kuran kişi Samed Çoban. Platformun Faz 1 kapsamını ve buradaki her teknik iddiayı (para hesaplama mantığı, escrow durum makinesi, RLS politikaları) o yazıyor ve imzalıyor.",
      "Sitedeki her sayfa aynı ilkeyle yazıldı: abartılmış kullanım rakamı yok, sahte müşteri listesi yok, olmayan bir özelliği varmış gibi göstermek yok. Güven mimarisi sayfası bu yaklaşımın teknik kanıtı.",
    ],
    contactLabel: "Doğrudan yazmak için:",
  },
  en: {
    metaTitle: "Founder | Lancerix",
    metaDescription:
      "Who's building Lancerix and why: founder Samed Çoban and the engineering approach behind the platform.",
    eyebrow: "Founder",
    title: "Who's behind Lancerix",
    intro:
      "Before trusting a payment or verification platform, knowing who stands behind it is a reasonable ask. Here it is.",
    founderName: "Samed Çoban",
    founderRole: "Founder",
    founderBio: [
      "Lancerix is built by Samed Çoban, who writes and stands behind every technical claim on this site -- the money math, the escrow state machine, the RLS policies.",
      "Every page here follows the same rule: no inflated usage numbers, no fabricated customer list, no feature described as live before it is. The Trust Architecture page is the technical evidence for that.",
    ],
    contactLabel: "Reach out directly:",
  },
};
