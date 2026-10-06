import type { Locale } from "@/lib/i18n/config";
import { QA_TIER_INFO, type QaTier } from "@/lib/validations/delivery";
import type { StandalonePackageId } from "@/lib/validations/standalone-qa";

export type TierCopy = {
  label: string;
  price: string;
  hint: string;
  details: readonly string[];
};

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
  stepsBody: string;
  stepsBodyMobile: string;
  steps: readonly [Step, Step, Step];
  pricingEyebrow: string;
  pricingTitle: string;
  comingSoon: string;
  tiers: Record<QaTier, TierCopy>;
  pricing: {
    eyebrow: string;
    title: string;
    body: string;
    freeTier: {
      badge: string;
      label: string;
      price: string;
      period: string;
      hint: string;
      cta: string;
      features: readonly string[];
    };
    shieldTier: {
      badge: string;
      label: string;
      period: string;
      hint: string;
      cta: string;
      features: readonly string[];
    };
    agencyTier: {
      badge: string;
      label: string;
      perMonth: string;
      hint: string;
      cta: string;
      features: readonly string[];
    };
  };
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
    retainer: {
      label: string;
      perMonth: string;
      hint: string;
      features: string[];
      comingSoon: string;
    };
  };
  monitoring: {
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
    metaTitle: "Lancerix — Kriptografik Teslimat Kanıtı, Teknik Hakemlik & Güvenlik Protokolü",
    metaDescription:
      "Yazılımcı ve işveren arasındaki teslimat uyuşmazlıklarına son: TBK m. 474 ve HMK m. 193 uyumlu objektif kriterler, canlı çalışma kanıtı (Proof of Delivery) ve SHA-256 mühürlü bilirkişi raporu.",
    badge: "Kriptografik Teslimat Protokolü & Teknik Hakemlik",
    heroTitle: "Yazılım teslimatlarında keyfi itirazlara ve haksız fesihlere son.",
    heroBody:
      "Yazılımcı ile işveren arasındaki sözleşmeyi TBK m. 474 ve HMK m. 193 standartlarında bağlar. Canlı çalışma kanıtı (Proof of Delivery), 7 günlük nöbetçi kontrolü ve tarafsız güvenlik denetimiyle subjektif 'beğenmedim' iddialarını resmi bilirkişi raporuna dönüştürür.",
    ctaPrimary: "Protokolü Başlat",
    ctaSecondary: "Nasıl Çalışır?",
    cities: {
      ankara: "Ankara",
      london: "Londra",
      newYork: "New York",
      tokyo: "Tokyo",
      sydney: "Sidney",
    },
    positioning:
      "Lancerix; yazılımcı ve işveren arasındaki güven krizini matematiksel ve hukuki kesinlikle çözer. İş başlamadan önce objektif kabul kriterlerini (Specification as Code) dijital imzalarla mühürler, teslim anında canlı ortamın çalıştığını ProofGuard nöbetçisi ile doğrular ve mahkemede/arabuluculukta kesin delil teşkil eden SHA-256 mühürlü tahkim dosyasını üretir.",
    reportCardId: "LX-ARB-2026 · TAHKİM & TESLİMAT DOSYASI",
    reportCardTitle: "Resmi Teknik Hakemlik & Teslimat Raporu",
    reportCardStatus: "MÜHÜRLENDİ",
    reportTestTypeLabel: "Hukuki Dayanak",
    reportTestTypeValue: "TBK m. 474 · HMK m. 193 Delil Sözleşmesi",
    reportStateLabel: "Teslimat Doğrulama",
    reportStateValue: "Proof of Delivery: %100 Doğrulandı",
    hashCaption: "Kriptografik SHA-256 mührü · Mahkeme ve arabuluculuk nezdinde kesin delil",
    reportCardLink: "Örnek tahkim dosyasını incele →",
    noMoneyTitle: "Objektif Kabul Kriterleri (Specification as Code)",
    noMoneyBody:
      "Müşteri 'içime sinmedi / beğenmedim' diyerek ödemeyi reddedemez. İtiraz ancak sözleşmede tanımlanan teknik kriterlerin somut ihlal loglarıyla yapılabilir.",
    impartialTitle: "Canlı Çalışma Kanıtı & Nöbetçi Prober",
    impartialBody:
      "Staging ve canlı test ortamının yayında olduğunu, yanıt süresini ve HTTPS durumunu saniye saniye denetler; teslim anındaki çalışma kanıtını dondurur.",
    immutableTitle: "1-Tıkla Mahkeme & Arabuluculuk Dosyası",
    immutableBody:
      "Her iki tarafın ıslak imza hükmündeki dijital imzalarını, sunucu yanıtlarını ve güvenlik denetimini içeren resmi PDF bilirkişi raporu.",
    stepsEyebrow: "HAKEMLİK & TESLİMAT PROTOKOLÜ",
    stepsTitle: "Lancerix Uyuşmazlıkları Nasıl Önler?",
    stepsBody: "Sürecin nasıl işlediğini görmek için adımların üzerine gelin.",
    stepsBodyMobile: "Sürecin baştan sona nasıl ilerlediği aşağıda, sırasıyla.",
    steps: [
      {
        title: "1. Objektif Kriterlerle Sözleşme",
        body: "İşe başlamadan önce teknik kabul kriterleri (API şemaları, MASAK/AML uyumu, SLA) belirlenir ve iki tarafça dijital olarak imzalanır.",
      },
      {
        title: "2. Teslim & Canlı ProofGuard Denetimi",
        body: "Yazılımcı teslimatı yaptığında ProofGuard canlı ortamı (staging) otomatik problar, güvenlik hijyenini doğrular ve zaman damgalar.",
      },
      {
        title: "3. Bağlayıcı Hakemlik & Otomatik Kabul",
        body: "İşveren 7 gün içinde somut teknik log sunmazsa TBK m. 477 uyarınca zımni kabul gerçekleşir; uyuşmazlıkta resmi bilirkişi raporu hazır olur.",
      },
    ],
    pricingEyebrow: "ŞEFFAF VE ADİL MODEL",
    pricingTitle: "Yazılımcıya Ücretsiz, Teslimatta Eksiksiz Güvence",
    comingSoon: "Yakında",
    tiers: {
      TIER1: tierCopyFromInfo("TIER1"),
      TIER2: tierCopyFromInfo("TIER2"),
      TIER3: tierCopyFromInfo("TIER3"),
    },
    pricing: {
      eyebrow: "ŞEFFAF VE ADİL MODEL",
      title: "Yazılımcıya Ücretsiz, Teslimatta Eksiksiz Güvence",
      body: "Sözleşme oluşturma ve kabul kriterlerini belirleme her zaman ücretsizdir. Kriptografik teslimat kanıtı ve resmi tahkim güvencesi ihtiyaca göre ölçeklenir.",
      freeTier: {
        badge: "Bireysel Geliştirici",
        label: "Standart Protokol",
        price: "Ücretsiz",
        period: "sözleşme başına",
        hint: "Şartname hazırlama ve standart teslimat koruması.",
        cta: "Hemen Başla",
        features: [
          "TBK m. 474 & HMK m. 193 uyumlu sözleşme",
          "Objektif kabul kriterleri (Specification as Code)",
          "ProofGuard canlı çalışma ve uptime kontrolü",
          "7 günlük yasal zımni kabul sayacı",
          "Kriptografik SHA-256 kök parmak izi",
        ],
      },
      shieldTier: {
        badge: "En Çok Tercih Edilen",
        label: "Dispute Shield & Tahkim Dosyası",
        period: "sözleşme başına",
        hint: "Mahkemede ve arabuluculukta bağlayıcı resmi delil tutanağı.",
        cta: "Protokolü Başlat",
        features: [
          "Standart protokole ait tüm özellikler",
          "Resmi Adli Bilişim PDF Tutanağı (Kaşeli & QR kodlu)",
          "Pasif güvenlik & hassas dosya sızıntı denetimi (Check #4)",
          "Arabulucu & bilirkişi için şifresiz token inceleme linki",
          "GitHub README & Web için dinamik SVG mühür rozeti",
          "Keyfi ayıplı ifa iddialarına karşı bağlayıcı hakemlik kaydı",
        ],
      },
      agencyTier: {
        badge: "Yazılım Stüdyoları",
        label: "Ajans & Kurumsal Retainer",
        perMonth: "ay",
        hint: "Birden çok müşteri ve ekip yöneten ajanslar için.",
        cta: "Ekip İçin Başlat",
        features: [
          "Ayda 10 sözleşmeye kadar tam tahkim ve adli bilişim dosyası",
          "Özel kurumsal marka & kaşe desteği (White-Label)",
          "REST API ve webhook teslimat entegrasyonu",
          "Öncelikli teknik bilirkişi incelemesi",
          "Sözleşme başına ek ödeme sürtünmesi yok",
        ],
      },
    },
    standalone: {
      packages: {
        BASIC: {
          label: "Hızlı Güvenlik & Hijyen",
          hint: "Erişilebilirlik, SEO ve Temel Güvenlik kontrolleri.",
          features: [
            "Temel HTTP Güvenlik Başlıkları Analizi",
            "SSL/TLS ve HTTPS Yönlendirme Denetimi",
            "Ölü Link ve Meta Uyum Taraması",
          ],
        },
        PRO: {
          label: "Gelişmiş Hijyen Taraması",
          hint: "Genişletilmiş başlık/dosya kontrolleri ve performans.",
          features: [
            "Temel Güvenlik paketindeki tüm modüller",
            "Hassas Dosya Sızıntısı (.git, .env) Taraması",
            "Sunucu Banner ve Teknoloji İfşası Tespiti",
          ],
        },
        FULL: {
          label: "Tam Kapsamlı Hijyen Taraması",
          hint: "Tüm Güvenlik ve Etkileşim Taramaları.",
          features: [
            "Gelişmiş paketteki tüm modüller",
            "Form ve POST İstekleri Güvenlik Hijyeni",
            "AI Destekli Kod Düzeltme Önerisi",
          ],
        },
        DISPUTE_SHIELD: {
          label: "Güvenlik Mührü & Denetim",
          popular: true,
          hint: "Müşterilere veya denetçilere sunulmak üzere SHA-256 mühürlü tam hijyen raporu.",
          features: [
            "Pasif Güvenlik Hijyeni Taraması (tüm modüller)",
            "OWASP Top 10 kategorilerine eşlenmiş bulgular",
            "AI Destekli Kod Düzeltme Önerisi ve Risk Puanları",
            "Kriptografik SHA-256 Mühürlü Kamusal Rapor Linki",
            "PDF İhracı ve Doğrulama Rozeti",
          ],
        },
      },
      urlLabel: "Denetlenecek Web Adresi",
      urlPlaceholder: "https://app.sirketiniz.com",
      emailLabel: "Kurumsal E-posta",
      passwordLabel: "Parola",
      submit: "Güvenlik Taramasını Başlat",
      footer: "Kayıt formu yok — ödeme onayıyla hesabınız anında açılır ve tarama başlar.",
      loginPrompt: "Zaten hesabınız var mı?",
      loginLink: "Giriş yap",
      retainer: {
        label: "Agency Security Retainer",
        perMonth: "ay",
        hint: "Birden çok müşteri yöneten yazılım evleri için -- ayda 10 denetime kadar.",
        features: [
          "Ayda 10 hedef denetimi",
          "Her denetim için ayrı ödeme yok",
          "White-label SHA-256 mühürlü rapor",
        ],
        comingSoon: "Yakında",
      },
    },
    monitoring: {
      perMonth: "ay",
      plans: {
        MONITORING: {
          label: "İzleme (₺799/ay)",
          hint: "Tek bir site sahibi için.",
          features: [
            "3 hedefe kadar sürekli izleme",
            "Haftalık otonom güvenlik hijyeni taraması",
            "AI Destekli Kod Düzeltme Önerisi",
            "Sadece yeni bulgu çıktığında anlık uyarı",
          ],
        },
        AGENCY: {
          label: "Ajans (₺3.500/ay)",
          hint: "Birden çok müşteri yöneten ajanslar ve yazılım evleri.",
          features: [
            "5 hedefe kadar sürekli izleme",
            "Haftalık otonom tam hijyen taraması (Tüm modüller)",
            "Müşteriye özel White-Label PDF Raporu",
            "Güvenlik Denetim Mührü & REST API Erişimi",
          ],
        },
      },
      cta: "Paneli Aç ve Başlat",
      note: "Hesabınız yoksa önce ücretsiz kayıt olabilirsiniz.",
    },
    closingTitle: "Yazılım projelerinizi hukuki ve teknik güvence altına alın.",
    closingPrimary: "Hemen Başla",
    closingSecondary: "Giriş yap",
  },
  en: {
    metaTitle: "Lancerix — Cryptographic Proof of Delivery & Technical Arbitration Protocol",
    metaDescription:
      "End subjective disputes between developers and clients: TBK Art. 474 & evidence agreement standards, live Proof of Delivery (PoD), and SHA-256 sealed expert witness dossiers.",
    badge: "Proof of Delivery & Technical Arbitration Protocol",
    heroTitle: "End subjective rejection and bad-faith cancellations in software delivery.",
    heroBody:
      "Binds developer-client contracts with cryptographic and legal certainty. Combines live Proof of Delivery, 7-day uptime monitoring, and neutral security hygiene verification into court-ready expert witness dossiers.",
    ctaPrimary: "Start Delivery Protocol",
    ctaSecondary: "How It Works",
    cities: {
      ankara: "Ankara",
      london: "London",
      newYork: "New York",
      tokyo: "Tokyo",
      sydney: "Sydney",
    },
    positioning:
      "Lancerix solves the trust crisis in software development. Before work begins, objective acceptance criteria (Specification as Code) are sealed with bilateral digital signatures. Upon delivery, the ProofGuard prober verifies live uptime, and the protocol generates a tamper-proof SHA-256 arbitration dossier admissible in court and mediation.",
    reportCardId: "LX-ARB-2026 · ARBITRATION & DELIVERY DOSSIER",
    reportCardTitle: "Official Technical Arbitration & Delivery Record",
    reportCardStatus: "SEALED",
    reportTestTypeLabel: "Legal Basis",
    reportTestTypeValue: "TBK Art. 474 · Technical Evidence Agreement",
    reportStateLabel: "Delivery Verification",
    reportStateValue: "Proof of Delivery: 100% Verified",
    hashCaption: "Cryptographic SHA-256 seal · Tamper-proof expert witness evidence",
    reportCardLink: "Inspect example dossier →",
    noMoneyTitle: "Objective Criteria (Specification as Code)",
    noMoneyBody:
      "Clients cannot reject payment claiming subjective dissatisfaction. Any dispute requires concrete violation logs against predefined contract criteria.",
    impartialTitle: "Live Proof of Delivery & Uptime Prober",
    impartialBody:
      "Continuously verifies that the staging URL is online, measuring latency, HTTPS, and server headers to freeze undeniable evidence of delivery.",
    immutableTitle: "1-Click Court & Mediation PDF Dossier",
    immutableBody:
      "Generates an official forensic PDF dossier complete with bilateral cryptographic signatures, server logs, and statutory legal conclusions.",
    stepsEyebrow: "ARBITRATION PROTOCOL",
    stepsTitle: "How Lancerix Protects Your Delivery",
    stepsBody: "Hover over each step to see what happens under the hood.",
    stepsBodyMobile: "How the protocol operates from contract to delivery.",
    steps: [
      {
        title: "1. Bilateral Objective Contract",
        body: "Both parties agree upon and digitally sign technical acceptance criteria (API schemas, compliance, performance SLAs) before work begins.",
      },
      {
        title: "2. Delivery & Live ProofGuard Prober",
        body: "When the developer submits the delivery, ProofGuard probes the live target, runs passive hygiene checks, and cryptographically timestamps proof.",
      },
      {
        title: "3. Binding Arbitration & Tacit Acceptance",
        body: "Clients must submit concrete technical logs within 7 days; silence triggers statutory acceptance, producing an authoritative dossier.",
      },
    ],
    pricingEyebrow: "TRANSPARENT & FAIR PRICING",
    pricingTitle: "Free for Developers, Absolute Certainty on Delivery",
    comingSoon: "Coming soon",
    tiers: {
      TIER1: {
        label: "Basic check",
        price: "Free",
        hint: "Basic security headers and hygiene checks for developer portfolios.",
        details: ["Security headers analysis", "SSL/TLS verification", "Timestamped report"],
      },
      TIER2: {
        label: "Autonomous Hygiene Scan",
        price: "$129/mo",
        hint: "Autonomous security hygiene scan generating suggested remediation code.",
        details: [
          "Findings mapped to OWASP Top 10 categories",
          "Suggested code remediation patches",
          "Cryptographic SHA-256 audit seal",
        ],
      },
      TIER3: {
        label: "Agency / Enterprise",
        price: "$299/mo",
        hint: "Autonomous scans plus white-label audit reports and API access for digital studios.",
        details: [
          "10 monitored targets",
          "White-label client PDF reports",
          "Security seal embed & REST API",
        ],
      },
    },
    pricing: {
      eyebrow: "TRANSPARENT & FAIR PRICING",
      title: "Free for Developers, Absolute Certainty on Delivery",
      body: "Drafting contracts and binding acceptance criteria is always free. Cryptographic proof of delivery and binding arbitration scale to your project needs.",
      freeTier: {
        badge: "Individual Developer",
        label: "Standard Protocol",
        price: "Free",
        period: "per contract",
        hint: "Specification drafting and standard delivery protection.",
        cta: "Get Started Free",
        features: [
          "TBK Art. 474 & HMK Art. 193 compliant contract",
          "Objective acceptance criteria (Specification as Code)",
          "ProofGuard live uptime & health prober",
          "7-day statutory tacit acceptance countdown",
          "Cryptographic SHA-256 root seal",
        ],
      },
      shieldTier: {
        badge: "Most Popular",
        label: "Dispute Shield & Dossier",
        period: "per contract",
        hint: "Binding expert witness evidence admissible in court and mediation.",
        cta: "Start Protocol",
        features: [
          "All features in Standard Protocol",
          "Official Forensic PDF Dossier (Sealed with QR verification)",
          "Passive security & sensitive file exposure hygiene (Check #4)",
          "Token-gated guest access for mediators & counsel",
          "Embeddable dynamic SVG verification badge for GitHub",
          "Binding technical arbitration record against bad-faith rejections",
        ],
      },
      agencyTier: {
        badge: "Software Studios",
        label: "Agency Retainer",
        perMonth: "mo",
        hint: "For digital agencies and studios managing multiple client deliverables.",
        cta: "Start for Team",
        features: [
          "Up to 10 sealed contracts & forensic dossiers per month",
          "Custom agency branding (White-Label)",
          "REST API & webhook delivery integration",
          "Priority expert witness inspection",
          "Zero per-contract checkout friction",
        ],
      },
    },
    standalone: {
      packages: {
        BASIC: {
          label: "Basic Hygiene",
          hint: "Accessibility, SEO, and Basic Security headers check.",
          features: [
            "Essential HTTP Security Headers",
            "SSL/TLS & HTTPS Enforcement Audit",
            "Broken Link & SEO Hygiene",
          ],
        },
        PRO: {
          label: "Advanced Hygiene Scan",
          hint: "Extended header/file checks plus performance.",
          features: [
            "All Basic modules included",
            "Sensitive Files (.git, .env) Exposure Probe",
            "Server Banner & Tech Leakage Detection",
          ],
        },
        FULL: {
          label: "Full Hygiene Scan",
          hint: "All Security and Interaction Audits.",
          features: [
            "All Advanced modules included",
            "Form & POST Request Security Hygiene",
            "AI-Powered Code Fix Suggestions",
          ],
        },
        DISPUTE_SHIELD: {
          label: "Security Seal & Audit",
          popular: true,
          hint: "Cryptographically sealed hygiene audit report to share with clients, investors, or auditors.",
          features: [
            "Passive Security Hygiene Scan (all modules)",
            "Findings mapped to OWASP Top 10 categories",
            "AI-Powered Code Fix Suggestions & Risk Scores",
            "SHA-256 Sealed Public Report URL",
            "PDF Export & Embeddable Security Badge",
          ],
        },
      },
      urlLabel: "Target URL to Audit",
      urlPlaceholder: "https://app.yourcompany.com",
      emailLabel: "Work Email",
      passwordLabel: "Password",
      submit: "Launch Security Audit",
      footer: "No lengthy forms — your account is provisioned and scanning starts upon checkout.",
      loginPrompt: "Already have an account?",
      loginLink: "Sign in",
      retainer: {
        label: "Agency Security Retainer",
        perMonth: "mo",
        hint: "For agencies delivering multiple client projects -- up to 10 audits per month.",
        features: [
          "Up to 10 target audits/month",
          "No per-scan checkout friction",
          "White-label SHA-256 sealed reports",
        ],
        comingSoon: "Coming soon",
      },
    },
    monitoring: {
      perMonth: "mo",
      plans: {
        MONITORING: {
          label: "Monitoring ($79/mo)",
          hint: "For a single site owner.",
          features: [
            "Up to 3 monitored targets",
            "Weekly autonomous hygiene scan",
            "AI-Powered Code Fix Suggestions",
            "Instant alerts only when a new finding emerges",
          ],
        },
        AGENCY: {
          label: "Agency ($349/mo)",
          hint: "For agencies and software studios managing client systems.",
          features: [
            "Up to 5 monitored targets",
            "Weekly full autonomous hygiene scans",
            "White-label client PDF audit reports",
            "Security Verification Badge & REST API",
          ],
        },
      },
      cta: "Open Console & Subscribe",
      note: "No account? You can sign up for free first.",
    },
    closingTitle: "Protect your software deliverables with cryptographic certainty.",
    closingPrimary: "Get Started Now",
    closingSecondary: "Log In",
  },
};
