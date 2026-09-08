import type { Locale } from "@/lib/i18n/config";

/**
 * The contract-bound verification page. Split off the homepage on 2026-09-08:
 * these tiers involve a human reviewer, are sold to Turkish business customers
 * under a signed contract, and are invoiced directly rather than through the
 * self-serve checkout. Keeping them on the landing page made the automated,
 * software-delivered product look like the sideline of a consultancy, which is
 * the opposite of what either side of the business actually is.
 *
 * The tier cards themselves reuse HOME_COPY[locale].tiers -- one wording of a
 * tier, not two that can drift.
 */
export type ContractVerificationCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  billingTitle: string;
  billingBody: string;
  contactLabel: string;
  backLabel: string;
};

export const CONTRACT_VERIFICATION_COPY: Record<Locale, ContractVerificationCopy> = {
  tr: {
    metaTitle: "Sözleşmeli Doğrulama — Uzman İncelemeli QA | Lancerix",
    metaDescription:
      "Sözleşmeye bağlı projelerde kabul kriterlerinin doğrulanması: otonom test ve kıdemli mühendis incelemesi. Kurumsal müşterilere faturayla, ayrı olarak satılır.",
    eyebrow: "SÖZLEŞMELİ DOĞRULAMA",
    title: "İnsan gözü gereken işler için.",
    intro:
      "Bir sözleşmeye bağlı teslimatın, üzerinde anlaşılmış kabul kriterlerine göre doğrulanması. Otomatik site kontrolünden farkı: burada kriterleri taraflar yazıyor ve üst paketlerde sonucu kıdemli bir mühendis elden inceleyip onaylıyor.",
    billingTitle: "Ayrı satılır, ayrı faturalanır",
    billingBody:
      "Bu paketler Türkiye'deki kurumsal müşterilere sözleşme kapsamında sunulur ve doğrudan bize, kendi faturamızla ödenir. Sitedeki self-servis satın alma akışının parçası değildir; otomatik site kontrolü ürünlerinden tamamen ayrı yürür.",
    contactLabel: "Teklif için iletişime geç",
    backLabel: "Otomatik site kontrolüne dön",
  },
  en: {
    metaTitle: "Contract Verification — Expert-Reviewed QA | Lancerix",
    metaDescription:
      "Verifying a contracted delivery against agreed acceptance criteria: autonomous testing plus senior-engineer review. Sold separately to business customers against our own invoice.",
    eyebrow: "CONTRACT VERIFICATION",
    title: "For the work that needs a human.",
    intro:
      "Verification of a contracted delivery against acceptance criteria both parties agreed on. What makes it different from the automated site check: the criteria are written by the parties, and on the upper tiers a senior engineer reviews and signs off on the result by hand.",
    billingTitle: "Sold separately, invoiced separately",
    billingBody:
      "These tiers are offered to business customers in Turkey under a contract and are paid directly to us against our own invoice. They are not part of the self-serve checkout on this site, and they run entirely separately from the automated site-check products.",
    contactLabel: "Get in touch for a quote",
    backLabel: "Back to the automated site check",
  },
};
