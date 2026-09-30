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
    metaTitle: "Lancerix — Otonom Güvenlik Hijyeni Tarama Motoru",
    metaDescription:
      "Web uygulamalarınız için pasif, zararsız güvenlik hijyeni taraması: HTTP güvenlik başlıkları, form/çerez hijyeni, hassas dosya sızıntısı kontrolü. SHA-256 mühürlü rapor ve önerilen kod düzeltmeleri.",
    badge: "Otonom Güvenlik Hijyeni Taraması",
    heroTitle: "Sitenizin güvenlik hijyenini dakikalar içinde görün.",
    heroBody:
      "Lancerix; web sitenizi ve API uç noktalarınızı pasif, zararsız kontrollerle tarar -- güvenlik başlıkları, form/çerez hijyeni, hassas dosya sızıntıları. Bu bir sızma testi değildir; her bulgu için anlaşılır açıklama ve önerilen düzeltme sunar.",
    ctaPrimary: "Güvenlik Taraması Başlat",
    ctaSecondary: "Nasıl Çalışır?",
    cities: {
      ankara: "Ankara",
      london: "Londra",
      newYork: "New York",
      tokyo: "Tokyo",
      sydney: "Sidney",
    },
    positioning:
      "Lancerix, hedefe zarar vermeyen, yetkisiz bir ziyaretçinin tarayıcısının zaten yapabileceği pasif kontrolleri otomatikleştiren bir güvenlik hijyeni tarama motorudur. HTTP güvenlik başlıklarını, form/çerez yapılandırmasını ve bilinen hassas dosya yollarını denetler, bulguları önceliklendirir ve düzeltme önerisi sunar -- exploit denemesi veya kimlik doğrulama atlatma içermez.",
    reportCardId: "LX-SEC-890 · GÜVENLİK RAPORU",
    reportCardTitle: "Web Güvenlik Hijyeni Denetimi",
    reportCardStatus: "TAMAMLANDI",
    reportTestTypeLabel: "Denetim Tipi",
    reportTestTypeValue: "Pasif Güvenlik Hijyeni Taraması",
    reportStateLabel: "Duruş Puanı",
    reportStateValue: "Sağlık Skoru: %88 (A)",
    hashCaption: "Kriptografik SHA-256 mührü · Değiştirilemez güvenlik denetim kanıtı",
    reportCardLink: "Canlı raporu incele →",
    noMoneyTitle: "Anlaşılır, Doğrulanabilir Bulgular",
    noMoneyBody:
      "Her bulgu, neyin kontrol edildiğini ve neden önemli olduğunu açıkça anlatır -- karmaşık güvenlik jargonu değil, doğrudan kanıt (ör. eksik başlık, sızdırılan dosya yolu).",
    impartialTitle: "Önerilen Onarım Kodu",
    impartialBody:
      "Açığı bulmakla kalmaz; Next.js, Node.js veya Nginx için başlangıç noktası olacak bir kod düzeltme önerisi üretir -- doğrudan sisteminize uygulamadan önce gözden geçirin.",
    immutableTitle: "Zamanlanmış Abonelik Taramaları",
    immutableBody:
      "İzleme aboneliğiniz varsa hedefleriniz düzenli aralıklarla yeniden taranır; API anahtarınızla CI/CD akışınızdan da manuel olarak tetikleyebilirsiniz.",
    stepsEyebrow: "TARAMA DÖNGÜSÜ",
    stepsTitle: "Güvenlik Taraması Nasıl Çalışıyor?",
    stepsBody: "Sürecin nasıl ilerlediğini görmek için adımların üzerine gelin.",
    stepsBodyMobile: "Sürecin baştan sona nasıl ilerlediği aşağıda, sırasıyla.",
    steps: [
      {
        title: "1. Keşif",
        body: "Hedefe tek bir istek atılır; yanıt başlıkları, sunucu bilgisi ve HTTPS yapılandırması kaydedilir.",
      },
      {
        title: "2. Pasif Hijyen Kontrolü",
        body: "HTTP güvenlik başlıkları (HSTS, CSP, X-Frame-Options), form/çerez hijyeni ve bilinen hassas dosya yolları (.git, .env) zararsız problarla kontrol edilir.",
      },
      {
        title: "3. Önceliklendirme & Öneri",
        body: "Bulgular ciddiyetine göre sıralanır ve geliştiricilerin gözden geçirebileceği önerilen kod düzeltmesiyle birlikte SHA-256 mühürlü rapor teslim edilir.",
      },
    ],
    pricingEyebrow: "SÜREKLİ GÜVENLİK ABONELİKLERİ",
    pricingTitle: "Ekibinize ve altyapınıza en uygun planı seçin.",
    comingSoon: "Yakında",
    tiers: {
      TIER1: tierCopyFromInfo("TIER1"),
      TIER2: tierCopyFromInfo("TIER2"),
      TIER3: tierCopyFromInfo("TIER3"),
    },
    pricing: {
      eyebrow: "OTONOM GÜVENLİK SAAS",
      title: "Sitenizi Düzenli Kontrol Eden Güvenlik Planları",
      body: "Geliştiricilerden kurumsal ajanslara kadar her ölçek için otonom güvenlik hijyeni taraması ve sürekli izleme.",
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
    closingTitle: "Siber güvenliğinizi otonom yapay zekâya emanet edin.",
    closingPrimary: "Hemen Başla",
    closingSecondary: "Giriş yap",
  },
  en: {
    metaTitle: "Lancerix — Autonomous Security Hygiene Scanner",
    metaDescription:
      "Passive, non-intrusive security hygiene scanning for web apps: HTTP security headers, form/cookie hygiene, sensitive file exposure checks. SHA-256 sealed report with suggested code fixes.",
    badge: "Autonomous Security Hygiene Scanning",
    heroTitle: "See your site's security hygiene in minutes.",
    heroBody:
      "Lancerix scans your website and API endpoints with passive, non-intrusive checks -- security headers, form/cookie hygiene, sensitive file exposure. This is not a penetration test; every finding comes with a plain-language explanation and a suggested fix.",
    ctaPrimary: "Start Security Scan",
    ctaSecondary: "How It Works",
    cities: {
      ankara: "Ankara",
      london: "London",
      newYork: "New York",
      tokyo: "Tokyo",
      sydney: "Sydney",
    },
    positioning:
      "Lancerix is a security hygiene scanning engine that automates the passive checks any visitor's browser could already run -- nothing that harms the target. It inspects HTTP security headers, form/cookie configuration, and known sensitive file paths, prioritizes what it finds, and suggests fixes -- no exploit attempts, no authentication bypass.",
    reportCardId: "LX-SEC-890 · SECURITY REPORT",
    reportCardTitle: "Web Security Hygiene Audit",
    reportCardStatus: "COMPLETED",
    reportTestTypeLabel: "Audit Type",
    reportTestTypeValue: "Passive Security Hygiene Scan",
    reportStateLabel: "Posture Grade",
    reportStateValue: "Health Score: 88% (A)",
    hashCaption: "Cryptographic SHA-256 seal · Tamper-proof audit evidence",
    reportCardLink: "Inspect live report →",
    noMoneyTitle: "Clear, Verifiable Findings",
    noMoneyBody:
      "Every finding explains what was checked and why it matters -- not security jargon, but direct evidence (e.g. a missing header, an exposed file path).",
    impartialTitle: "Suggested Fix Code",
    impartialBody:
      "Beyond finding issues, Lancerix generates a starting-point code patch for Next.js, Node.js, or Nginx -- review it before applying to your own system.",
    immutableTitle: "Scheduled Subscription Scans",
    immutableBody:
      "With a monitoring subscription, your targets are rescanned on a regular cadence; you can also trigger scans manually from your CI/CD pipeline with an API key.",
    stepsEyebrow: "SCAN CYCLE",
    stepsTitle: "How the Security Scan Works",
    stepsBody: "Hover over each step to see what happens under the hood.",
    stepsBodyMobile: "How the scan runs from start to finish, in order.",
    steps: [
      {
        title: "1. Recon",
        body: "A single request is made to the target; response headers, server banner, and HTTPS configuration are recorded.",
      },
      {
        title: "2. Passive Hygiene Check",
        body: "HTTP security headers (HSTS, CSP, X-Frame-Options), form/cookie hygiene, and known sensitive file paths (.git, .env) are checked with harmless probes.",
      },
      {
        title: "3. Prioritization & Suggestions",
        body: "Findings are ranked by severity and delivered with a suggested code fix for developers to review, sealed with SHA-256.",
      },
    ],
    pricingEyebrow: "CONTINUOUS SECURITY PLANS",
    pricingTitle: "Choose the plan that fits your engineering team.",
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
      eyebrow: "AUTONOMOUS SECURITY SAAS",
      title: "Security Hygiene Plans That Check Your Site Around the Clock",
      body: "From independent builders to scaling software agencies, autonomous security hygiene scanning and continuous monitoring for every size of team.",
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
    closingTitle: "Automate your application security today.",
    closingPrimary: "Get Started Free",
    closingSecondary: "Sign In",
  },
};
