import type { Locale } from "@/lib/i18n/config";

/**
 * Header and footer copy -- the chrome that wraps every public page.
 *
 * The English is written, not transliterated: "Sessizlik kabul sayılır"
 * becomes "Silence counts as acceptance" because that is the actual contract
 * clause it names, and "Yol Haritası (Neredeyiz?)" becomes "Roadmap" because
 * the parenthetical only reads naturally in Turkish.
 */
export type SiteCopy = {
  nav: { howItWorks: string; pricing: string; login: string; register: string };
  footer: {
    tagline: string;
    product: string;
    legal: string;
    contact: string;
    howItWorks: string;
    verificationMethods: string;
    guide: string;
    guideQa: string;
    guideNoCompany: string;
    guideClientNonPayment: string;
    trustArchitecture: string;
    roadmap: string;
    login: string;
    terms: string;
    rights: string;
    /** Split around the brand-coloured heart glyph the footer renders itself. */
    madeIn: { before: string; after: string };
  };
  languageLabel: string;
  otherLanguage: string;
};

export const SITE_COPY: Record<Locale, SiteCopy> = {
  tr: {
    nav: {
      howItWorks: "Nasıl çalışır",
      pricing: "Fiyatlandırma",
      login: "Giriş yap",
      register: "Hesap oluştur",
    },
    footer: {
      tagline:
        "Yazılım projelerindeki teslimat ve onay süreçlerini güvene alan, şeffaf ve bağımsız kod doğrulama altyapısı.",
      product: "Ürün",
      legal: "Yasal",
      contact: "İletişim",
      howItWorks: "Nasıl Çalışır?",
      verificationMethods: "Doğrulama Yöntemleri",
      guide: "Teslim ve Kabul Rehberi",
      guideQa: "Bağımsız QA Doğrulama Nedir",
      guideNoCompany: "Şirket Kurmadan Korunma",
      guideClientNonPayment: "Müşteri Ödemezse Ne Yapılır",
      trustArchitecture: "Güven Mimarisi",
      roadmap: "Yol Haritası (Neredeyiz?)",
      login: "Giriş Yap",
      terms: "Şartlar ve Koşullar",
      rights: "Tüm hakları saklıdır.",
      madeIn: { before: "Türkiye'de ", after: " ile geliştirildi" },
    },
    languageLabel: "Dil",
    otherLanguage: "EN",
  },
  en: {
    nav: {
      howItWorks: "How it works",
      pricing: "Pricing",
      login: "Log in",
      register: "Create account",
    },
    footer: {
      tagline:
        "Independent, transparent code verification for the handover and sign-off stages of software projects.",
      product: "Product",
      legal: "Legal",
      contact: "Contact",
      howItWorks: "How it works",
      verificationMethods: "Verification tiers",
      guide: "Delivery & Acceptance Guide",
      guideQa: "What Is Independent QA Verification",
      guideNoCompany: "Freelancing Without A Company",
      guideClientNonPayment: "What If A Client Doesn't Pay",
      trustArchitecture: "Trust Architecture",
      roadmap: "Roadmap",
      login: "Log in",
      terms: "Terms of service",
      rights: "All rights reserved.",
      madeIn: { before: "Built in Türkiye with ", after: "" },
    },
    languageLabel: "Language",
    otherLanguage: "TR",
  },
};
