import type { Locale } from "@/lib/i18n/config";
import { QA_TIER_INFO, type QaTier } from "@/lib/validations/delivery";

/**
 * Landing page copy.
 *
 * `available` and `needsReviewer` always come from QA_TIER_INFO in
 * src/lib/validations/delivery.ts, which CLAUDE.md names as the source of
 * truth for pricing and availability -- a second copy of those booleans is
 * exactly how an unorderable tier ends up looking orderable in one language.
 *
 * The Turkish tiers below build their label/price/hint/details straight from
 * QA_TIER_INFO too, since it is already written in Turkish -- there is no
 * reason for a second, independent copy of the same sentences to exist and
 * drift out of sync the next time a tier's price or wording changes.
 * English keeps its own hand-translated copy below: QA_TIER_INFO has no
 * English text to derive from.
 */
import type { StandalonePackageId } from "@/lib/validations/standalone-qa";

export type TierCopy = {
  label: string;
  price: string;
  hint: string;
  details: readonly string[];
};

/** The Turkish tier copy, word for word, straight from QA_TIER_INFO. */
function tierCopyFromInfo(tier: QaTier): TierCopy {
  const info = QA_TIER_INFO[tier];
  return { label: info.label, price: info.price, hint: info.hint, details: info.details };
}

export type Step = { title: string; body: string };

export type StandalonePackageCopy = {
  label: string;
  hint: string;
  popular?: boolean;
  features: readonly string[];
};

export type HomeCopy = {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  heroTitle: string;
  heroBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
  /** City labels on the hero world map -- "Londra" is not a word in English. */
  cities: { ankara: string; london: string; newYork: string; tokyo: string; sydney: string };
  positioning: string;
  reportCardId: string;
  reportCardTitle: string;
  reportCardStatus: string;
  reportTestTypeLabel: string;
  reportTestTypeValue: string;
  reportStateLabel: string;
  reportStateValue: string;
  hashCaption: string;
  reportCardLink: string;
  noMoneyTitle: string;
  noMoneyBody: string;
  impartialTitle: string;
  impartialBody: string;
  immutableTitle: string;
  immutableBody: string;
  stepsEyebrow: string;
  stepsTitle: string;
  /** Desktop only -- describes the hover interaction the accordion has there. */
  stepsBody: string;
  /** Mobile only -- the accordion is a plain vertical list there, so there is
   * no gesture to explain. */
  stepsBodyMobile: string;
  /** Exactly three, in order -- STEP_ICONS in home-client.tsx pairs by index.
   * Was five (2026-09-08); merged down to three (2026-09-09 shorten pass) --
   * "contract" and "delivery" are one beat for a visitor deciding whether to
   * sign up, not two, and likewise "audit" and "report". */
  steps: readonly [Step, Step, Step];
  pricingEyebrow: string;
  pricingTitle: string;
  comingSoon: string;
  tiers: Record<QaTier, TierCopy>;
  /** One shared header for both pricing modes below (2026-09-09 shorten pass
   * merged what used to be two near-identical sections, each with its own
   * eyebrow/title/body, into one with a tab switch). */
  pricing: {
    eyebrow: string;
    title: string;
    body: string;
    tabOneTime: string;
    tabSubscription: string;
  };
  /** The self-serve /site-kontrol purchase, sold with no contract and no
   * dashboard visit -- see StandaloneFormCopy in standalone-purchase-form.tsx. */
  standalone: {
    packages: Record<StandalonePackageId, StandalonePackageCopy>;
    urlLabel: string;
    urlPlaceholder: string;
    emailLabel: string;
    passwordLabel: string;
    submit: string;
    footer: string;
    loginPrompt: string;
    loginLink: string;
  };
  monitoring: {
    /** "ay" / "mo" -- appended after the price as "/{perMonth}". */
    perMonth: string;
    plans: Record<
      "MONITORING" | "AGENCY",
      { label: string; hint: string; features: string[] }
    >;
    cta: string;
    note: string;
  };
  closingTitle: string;
  closingPrimary: string;
  closingSecondary: string;
};

export const HOME_COPY: Record<Locale, HomeCopy> = {
  tr: {
    metaTitle: "Lancerix — Bağımsız Kod Doğrulama",
    metaDescription:
      "Bağımsız teknik doğrulama: imzalı sözleşme, kabul kriterlerine karşı kontrol edilen teslim ve hiçbir tarafın değiştiremeyeceği zaman damgalı bir rapor. Ödeme taraflar arasında doğrudan çözülür.",
    badge: "Bağımsız Kod Doğrulama",
    heroTitle: "Projenizin teslimatını şansa bırakmayın.",
    heroBody:
      "Yazılım projelerindeki anlaşmazlıkları ortadan kaldırıyoruz. Müşteriyseniz tam istediğiniz kodu teslim aldığınızdan emin olun; geliştiriciyseniz işinizin hakkını alın.",
    ctaPrimary: "Hemen başla",
    ctaSecondary: "Nasıl çalışır?",
    cities: {
      ankara: "Ankara",
      london: "Londra",
      newYork: "New York",
      tokyo: "Tokyo",
      sydney: "Sidney",
    },
    positioning:
      "Biz bir aracı kurum değiliz — bağımsız bir teknik doğrulama servisiyiz. Paranızı bünyemizde tutmuyoruz (escrow yok); ödeme taraflar arasında doğrudan çözülür. Sözleşmenizdeki kabul kriterlerine göre teslimatı kontrol edip, kimsenin sonradan değiştiremeyeceği zaman damgalı bir rapor üretiyoruz.",
    reportCardId: "LX-8FQ2K · QA RAPORU",
    reportCardTitle: "Ödeme entegrasyonu — kriter doğrulaması",
    reportCardStatus: "ONAYLANDI",
    reportTestTypeLabel: "Test Tipi",
    reportTestTypeValue: "Otonom QA",
    reportStateLabel: "Durum",
    reportStateValue: "Tüm kriterler sağlandı",
    hashCaption: "Kriptografik özet · Bu rapor kesinlikle değiştirilemez",
    reportCardLink: "Tam örneği gör →",
    noMoneyTitle: "Paranıza Dokunmuyoruz",
    noMoneyBody:
      "Ödemeler sizin belirlediğiniz kanallar üzerinden, doğrudan taraflar arasında gerçekleşir.",
    impartialTitle: "Tarafsız İnceleme",
    impartialBody:
      "Kod kalitesini ve proje isterlerini, hiçbir tarafa bağlı kalmadan tamamen objektif bir şekilde denetliyoruz.",
    immutableTitle: "Değiştirilemez Kayıtlar",
    immutableBody:
      "Projedeki her ilerleme zaman damgasıyla birlikte şifrelenir. Olası bir anlaşmazlık durumunda, geriye dönük en güvenilir kanıtı bu kayıtlar oluşturur.",
    stepsEyebrow: "ADIM ADIM",
    stepsTitle: "Sistem nasıl işliyor?",
    stepsBody: "Sürecin nasıl ilerlediğini görmek için adımların üzerine gelin.",
    stepsBodyMobile: "Sürecin baştan sona nasıl ilerlediği aşağıda, sırasıyla.",
    steps: [
      {
        title: "1. Sözleşme & teslim",
        body: "İhtiyaçlar ve şartlar belirlenir, iki taraf onaylar; geliştirici işini sisteme yükler.",
      },
      {
        title: "2. Bağımsız denetim",
        body: "Seçilen pakete göre otonom test aracı ya da kıdemli mühendis projeyi inceler; sonuç sonradan değiştirilemeyen bir rapora kaydedilir.",
      },
      {
        title: "3. Onay tamamlanır",
        body: "Müşteri belirtilen süre içinde itiraz etmezse proje başarılı sayılır. Ödeme, aracı olmadan doğrudan hesabınıza ulaşır.",
      },
    ],
    pricingEyebrow: "DOĞRULAMA YÖNTEMLERİ",
    pricingTitle: "Projenize en uygun yöntemi seçin.",
    comingSoon: "Yakında",
    tiers: {
      TIER1: tierCopyFromInfo("TIER1"),
      TIER2: tierCopyFromInfo("TIER2"),
      TIER3: tierCopyFromInfo("TIER3"),
    },
    pricing: {
      eyebrow: "SÖZLEŞME GEREKMEZ",
      title: "Hemen dene ya da sürekli izlet.",
      body: "Herhangi bir linki şimdi tek seferlik test et, ya da siteni her hafta otomatik taratıp bir şey bozulunca haber al.",
      tabOneTime: "Tek seferlik",
      tabSubscription: "Sürekli izleme",
    },
    standalone: {
      packages: {
        BASIC: {
          label: "Temel Kontrol",
          hint: "Erişilebilirlik, SEO ve Ölü Link taraması.",
          features: [
            "Erişilebilirlik (WCAG 2.1 A/AA)",
            "SEO & Meta Uyum Analizi",
            "Ölü/Kırık Link Taraması",
          ],
        },
        PRO: {
          label: "Profesyonel",
          popular: true,
          hint: "Temel Kontrol + Hız & Mobil Taşma kontrolleri.",
          features: [
            "Temel Kontrol paketindeki tüm modüller",
            "Hız & Performans (Core Web Vitals)",
            "Görsel / Mobil Taşma Taraması",
          ],
        },
        FULL: {
          label: "Tam Tarama",
          hint: "Sistemdeki tüm 7 modül ve etkileşim taramaları.",
          features: [
            "Profesyonel paketindeki tüm modüller",
            "Form & Validasyon Bütünlüğü",
            "Genel Etkileşim & Konsol Hata Taraması",
          ],
        },
      },
      urlLabel: "Test edilecek link",
      urlPlaceholder: "https://ornek-site.com",
      emailLabel: "E-posta",
      passwordLabel: "Parola",
      submit: "Öde ve hesabımı aç",
      footer: "Kayıt formu yok — ödeme onayıyla hesabın anında açılır.",
      loginPrompt: "Zaten hesabın var mı?",
      loginLink: "Giriş yap",
    },
    monitoring: {
      perMonth: "ay",
      plans: {
        MONITORING: {
          label: "İzleme",
          hint: "Tek bir site sahibi için.",
          features: [
            "3 siteye kadar",
            "Haftalık tam tarama (7 modül)",
            "Sadece bir şey değiştiğinde e-posta",
          ],
        },
        AGENCY: {
          label: "Ajans",
          hint: "Birden çok müşteri yöneten ajanslar için.",
          features: [
            "5 siteye kadar",
            "Haftalık tam tarama (7 modül)",
            "Beyaz etiketli rapor + API erişimi",
          ],
        },
      },
      cta: "Panelden başlat",
      note: "Hesabın yoksa önce ücretsiz kayıt olman gerekir.",
    },
    closingTitle: "İşinizi güvence altına alın.",
    closingPrimary: "Ücretsiz Başla",
    closingSecondary: "Giriş yap",
  },
  en: {
    metaTitle: "Lancerix — Independent Code Verification",
    metaDescription:
      "Independent technical verification for software handovers. A signed contract, a delivery checked against the acceptance criteria both sides agreed on, and a timestamped report neither party can edit afterwards.",
    badge: "Independent code verification",
    heroTitle: "Stop leaving handover to chance.",
    heroBody:
      "We take the argument out of software delivery. If you are the client, know you received exactly the work you specified. If you are the developer, get the sign-off you have earned without chasing anyone for it.",
    ctaPrimary: "Get started",
    ctaSecondary: "How it works",
    cities: {
      ankara: "Ankara",
      london: "London",
      newYork: "New York",
      tokyo: "Tokyo",
      sydney: "Sydney",
    },
    positioning:
      "We are not a middleman — we are an independent technical verification service. We never hold your money (there is no escrow); payment is settled directly between the two parties. We check the delivery against the acceptance criteria written into your contract and produce a timestamped report that neither party can alter afterwards.",
    reportCardId: "LX-8FQ2K · QA REPORT",
    reportCardTitle: "Payment integration — criteria verification",
    reportCardStatus: "PASSED",
    reportTestTypeLabel: "Test type",
    reportTestTypeValue: "Autonomous QA",
    reportStateLabel: "Result",
    reportStateValue: "All criteria met",
    hashCaption: "Cryptographic digest · this report cannot be altered",
    reportCardLink: "See the full example →",
    noMoneyTitle: "We never touch your money",
    noMoneyBody:
      "Payment happens directly between the two of you, through whatever channel you already use.",
    impartialTitle: "Impartial review",
    impartialBody:
      "We audit code quality and contractual requirements objectively, with no stake in either side of the deal.",
    immutableTitle: "Records that cannot be rewritten",
    immutableBody:
      "Every step of the project is hashed and timestamped. If a dispute ever comes up, those records are the most reliable account of what actually happened.",
    stepsEyebrow: "STEP BY STEP",
    stepsTitle: "How the system works",
    stepsBody: "Hover over a step to see what happens at that point in the process.",
    stepsBodyMobile: "How the process runs from start to finish, in order.",
    steps: [
      {
        title: "1. Contract & delivery",
        body: "Requirements and terms are agreed, both sides approve; the developer uploads the work.",
      },
      {
        title: "2. Independent audit",
        body: "Depending on the tier, an autonomous test agent or a senior engineer reviews the work; the result is written into a report that can never be edited afterwards.",
      },
      {
        title: "3. Sign-off completes",
        body: "If the client raises no objection within the agreed window, the work counts as accepted. Payment reaches you directly, with no intermediary.",
      },
    ],
    pricingEyebrow: "VERIFICATION TIERS",
    pricingTitle: "Pick the tier that fits your project.",
    comingSoon: "Coming soon",
    tiers: {
      TIER1: {
        label: "Basic check",
        price: "Free",
        hint: "The criteria checklist goes to the client, who reviews the work themselves. Included in the platform commission, never billed separately.",
        details: [
          "The client reviews it directly",
          "No autonomous agent cost",
          "Timestamped, tamper-proof record",
        ],
      },
      TIER2: {
        label: "Agentic QA",
        price: "₺299",
        hint: "An autonomous test agent sweeps the UI/UX and the acceptance criteria. Flat price, no surprise charge after the run.",
        details: [
          "UI/UX and functionality sweep",
          "Flat price, no surprises",
          "Timestamped, tamper-proof record",
        ],
      },
      TIER3: {
        label: "Agentic + expert review",
        price: "₺3.500",
        hint: "Autonomous tests run first, then a senior engineer personally verifies the result and signs off. Flat price.",
        details: [
          "Autonomous tests plus human review",
          "Engineer-signed report",
          "Flat price, no surprises",
        ],
      },
    },
    pricing: {
      eyebrow: "NO CONTRACT NEEDED",
      title: "Try it now, or keep watch every week.",
      body: "Test any link right now, one time -- or have your site scanned automatically every week and hear from us only when something breaks.",
      tabOneTime: "One-time",
      tabSubscription: "Continuous",
    },
    standalone: {
      packages: {
        BASIC: {
          label: "Basic Check",
          hint: "Accessibility, SEO, and Dead Link scan.",
          features: [
            "Accessibility (WCAG 2.1 A/AA)",
            "SEO & Meta Compliance",
            "Dead Link Scan",
          ],
        },
        PRO: {
          label: "Professional",
          popular: true,
          hint: "Basic Check + Speed & Mobile Overflow checks.",
          features: [
            "All modules in Basic Check",
            "Speed & Performance (Core Web Vitals)",
            "Visual / Mobile Overflow Scan",
          ],
        },
        FULL: {
          label: "Full Scan",
          hint: "All 7 modules including browser interactions.",
          features: [
            "All modules in Professional",
            "Form & Validation Integrity",
            "General Interaction & Error Scan",
          ],
        },
      },
      urlLabel: "Link to test",
      urlPlaceholder: "https://example.com",
      emailLabel: "Email",
      passwordLabel: "Password",
      submit: "Pay and open my account",
      footer: "No separate signup form — a successful payment opens the account instantly.",
      loginPrompt: "Already have an account?",
      loginLink: "Log in",
    },
    monitoring: {
      perMonth: "mo",
      plans: {
        MONITORING: {
          label: "Monitoring",
          hint: "For a single site owner.",
          features: [
            "Up to 3 sites",
            "Weekly full scan (7 modules)",
            "Email only when something changes",
          ],
        },
        AGENCY: {
          label: "Agency",
          hint: "For agencies managing multiple clients.",
          features: [
            "Up to 5 sites",
            "Weekly full scan (7 modules)",
            "White-label reports + API access",
          ],
        },
      },
      cta: "Start from the dashboard",
      note: "No account yet? You'll need one first.",
    },
    closingTitle: "Put your work on the record.",
    closingPrimary: "Start free",
    closingSecondary: "Log in",
  },
};

