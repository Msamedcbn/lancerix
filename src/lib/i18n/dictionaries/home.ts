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
  price: string;
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
  /** Exactly five, in order -- STEP_ICONS in home-client.tsx pairs by index. */
  steps: readonly [Step, Step, Step, Step, Step];
  aboutEyebrow: string;
  aboutTitle: string;
  aboutBody: string;
  statVerified: string;
  statSignature: string;
  statWindowValue: string;
  statWindowLabel: string;
  pricingEyebrow: string;
  pricingTitle: string;
  comingSoon: string;
  tiers: Record<QaTier, TierCopy>;
  /** The self-serve /site-kontrol purchase, sold with no contract and no
   * dashboard visit -- see StandaloneFormCopy in standalone-purchase-form.tsx. */
  standalone: {
    eyebrow: string;
    title: string;
    body: string;
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
    eyebrow: string;
    title: string;
    body: string;
    plans: Record<
      "MONITORING" | "AGENCY",
      { label: string; price: string; hint: string; features: string[] }
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
        title: "1. Sözleşme oluşturulur",
        body: "İhtiyaçlar, teslim tarihi ve şartlar belirlenir. İki tarafın da onayladığı bu sözleşme kriptografik olarak güvence altına alınır.",
      },
      {
        title: "2. Proje teslim edilir",
        body: "Geliştirici, hazırladığı uygulamanın kaynak kodunu veya test adresini sisteme yükler ve inceleme süreci başlar.",
      },
      {
        title: "3. Bağımsız denetim yapılır",
        body: "Seçtiğiniz pakete göre; yapay zeka destekli otonom bir test aracı veya kıdemli bir yazılım mühendisi projenizi detaylıca inceler.",
      },
      {
        title: "4. Güvenilir rapor oluşturulur",
        body: "İnceleme sonucu başarılı ya da başarısız olarak, sonradan asla değiştirilemeyen bir rapora kaydedilip taraflara sunulur.",
      },
      {
        title: "5. Onay süreci tamamlanır",
        body: "Müşteri belirtilen süre içinde itirazda bulunmazsa, proje başarılı sayılır. Ödeme, aracı olmadan doğrudan hesabınıza ulaşır.",
      },
    ],
    aboutEyebrow: "BİZ KİMİZ",
    aboutTitle: "Yazılım dünyasındaki güven problemini çözüyoruz.",
    aboutBody:
      "Freelance ve ajans projelerinde yaşanan en büyük sorun, işin teslimi ve onayı sırasındaki belirsizliklerdir. Biz, kimsenin hakkının yenmemesi için süreci tamamen şeffaf, test edilebilir ve kayıt altında tutulabilir bir altyapıya dönüştürüyoruz.",
    statVerified: "Sözleşme Doğrulandı",
    statSignature: "Kriptografik İmza",
    statWindowValue: "5 Gün",
    statWindowLabel: "Otomatik Kabul Süresi",
    pricingEyebrow: "DOĞRULAMA YÖNTEMLERİ",
    pricingTitle: "Projenize en uygun yöntemi seçin.",
    comingSoon: "Yakında",
    tiers: {
      TIER1: tierCopyFromInfo("TIER1"),
      TIER2: tierCopyFromInfo("TIER2"),
      TIER3: tierCopyFromInfo("TIER3"),
    },
    standalone: {
      eyebrow: "SÖZLEŞME GEREKMEZ",
      title: "Hemen dene — hesabını ödeyerek aç.",
      body: "Projen bu platformda olmasa bile, herhangi bir linki şimdi test edebilirsin. Paketini seç, öde — hesabın aynı anda açılır.",
      packages: {
        BASIC: {
          label: "Temel Kontrol",
          price: "₺199",
          hint: "Erişilebilirlik, SEO ve Ölü Link taraması.",
          features: [
            "Erişilebilirlik (WCAG 2.1 A/AA)",
            "SEO & Meta Uyum Analizi",
            "Ölü/Kırık Link Taraması",
          ],
        },
        PRO: {
          label: "Profesyonel",
          price: "₺349",
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
          price: "₺449",
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
      eyebrow: "SÜREKLİ KORUMA",
      title: "Bir kere değil, her hafta.",
      body: "Siteni haftalık olarak otomatik tarar, bir şey değiştiğinde e-posta ile haber veririz. Değişmeyen kontroller için posta gelmez.",
      plans: {
        MONITORING: {
          label: "İzleme",
          price: "₺799/ay",
          hint: "Tek bir site sahibi için.",
          features: [
            "3 siteye kadar",
            "Haftalık tam tarama (7 modül)",
            "Sadece bir şey değiştiğinde e-posta",
          ],
        },
        AGENCY: {
          label: "Ajans",
          price: "₺3.500/ay",
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
        title: "1. The contract is drawn up",
        body: "Requirements, delivery date and terms are agreed. Once both sides approve it, the contract is sealed cryptographically.",
      },
      {
        title: "2. The work is delivered",
        body: "The developer submits the source code or a staging URL for the build, and the review process begins.",
      },
      {
        title: "3. An independent audit runs",
        body: "Depending on the tier you picked, either an AI-driven autonomous test agent or a senior engineer goes through the work in detail.",
      },
      {
        title: "4. A trustworthy report is issued",
        body: "The outcome — pass or fail — is written into a report that can never be edited afterwards, and shared with both parties.",
      },
      {
        title: "5. Sign-off completes",
        body: "If the client raises no objection within the agreed window, the work counts as accepted. Payment reaches you directly, with no intermediary.",
      },
    ],
    aboutEyebrow: "WHO WE ARE",
    aboutTitle: "We are fixing the trust problem in software work.",
    aboutBody:
      "The hardest part of freelance and agency projects is the grey area around delivery and approval. We turn that stretch into something transparent, testable and on the record, so nobody has to take the other side's word for it.",
    statVerified: "contracts verified",
    statSignature: "Cryptographic signature",
    statWindowValue: "5 days",
    statWindowLabel: "Automatic acceptance window",
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
    standalone: {
      eyebrow: "NO CONTRACT NEEDED",
      title: "Try it now — pay to open your account.",
      body: "Even if your project isn't on this platform, you can test any link right now. Pick a package, pay — your account opens in the same step.",
      packages: {
        BASIC: {
          label: "Basic Check",
          price: "₺199",
          hint: "Accessibility, SEO, and Dead Link scan.",
          features: [
            "Accessibility (WCAG 2.1 A/AA)",
            "SEO & Meta Compliance",
            "Dead Link Scan",
          ],
        },
        PRO: {
          label: "Professional",
          price: "₺349",
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
          price: "₺449",
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
      eyebrow: "CONTINUOUS COVERAGE",
      title: "Not once — every week.",
      body: "We scan your site automatically every week and email you only when something changes. No news, no email.",
      plans: {
        MONITORING: {
          label: "Monitoring",
          price: "₺799/mo",
          hint: "For a single site owner.",
          features: [
            "Up to 3 sites",
            "Weekly full scan (7 modules)",
            "Email only when something changes",
          ],
        },
        AGENCY: {
          label: "Agency",
          price: "₺3,500/mo",
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

