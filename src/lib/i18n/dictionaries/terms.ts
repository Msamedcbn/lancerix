import type { Locale } from "@/lib/i18n/config";
import { TERMS_SECTIONS, type TermsSection } from "@/lib/contracts/terms";

/**
 * The terms page in both languages.
 *
 * The Turkish text is not duplicated here -- it is imported from
 * src/lib/contracts/terms.ts, which is also what gets hashed into every
 * signature. A second copy would be a second thing to bump when the terms
 * change, and the one that drifted would be the one on screen.
 *
 * The English is a reading aid, not a second binding text: signatures record
 * TERMS_VERSION against the Turkish wording, so the page says so out loud.
 * Translating it without that notice would imply an English contract exists.
 */
export type TermsCopy = {
  metaTitle: string;
  metaDescription: string;
  versionLabel: string;
  title: string;
  intro: string;
  sections: readonly TermsSection[];
  footnote: (version: string) => string;
  /** Shown only in locales whose text is not the signed one. */
  authoritativeNotice: string | null;
};

const EN_SECTIONS: readonly TermsSection[] = [
  {
    heading: "What Lancerix does",
    body: [
      "Lancerix records the contract between a freelancer and a client, verifies the delivery technically against the acceptance criteria written into that contract, and writes the result into a timestamped report.",
      "The platform is not a party to the work itself. The freelancer does the work; the client commissions it.",
    ],
  },
  {
    heading: "What Lancerix does not do",
    body: [
      "It does not hold, collect or transfer money. Payment happens directly between the parties, outside this platform.",
      "Lancerix does not issue an invoice or a self-employment receipt for the contract amount; tax obligations rest with the parties. The platform may later bill the client separately and explicitly for its own service fee — that is independent of your contract amount.",
      "It gives no software warranty. Verification looks only at whether the acceptance criteria written into the contract were met; it is not a security audit and not a guarantee that the work is free of defects.",
    ],
  },
  {
    heading: "Verification and limitation of liability",
    body: [
      "A verification report shows the state of the criteria defined in the contract at the moment they were tested. A passing report does not mean the delivered work contains no gaps or errors.",
      "Lancerix's liability arising from this service is limited to the fee charged for the verification in question. It cannot be held liable for indirect damages, lost profit or lost business.",
    ],
  },
  {
    heading: "Silence counts as acceptance",
    body: [
      "When a delivery is opened for the client's review, the review period written into the contract begins. If the client neither raises a reasoned objection nor approves within that period, the delivery is deemed accepted under the contract, and that acceptance is recorded with a timestamp.",
      "This clause exists so that work cannot wait indefinitely for approval, and both parties accept it when they sign.",
    ],
  },
  {
    heading: "The record",
    body: [
      "Signatures, deliveries, verification results, approvals and acceptances that arise from an expired window are kept in an append-only ledger, together with a timestamp and a document digest.",
      "The parties accept that this record constitutes evidence in any dispute between them.",
    ],
  },
  {
    heading: "Accounts and use",
    body: [
      "Users are responsible for keeping their account credentials confidential and for the actions taken through their account.",
      "The platform may suspend accounts that breach these terms. Suspension does not delete records already created.",
    ],
  },
];

export const TERMS_COPY: Record<Locale, TermsCopy> = {
  tr: {
    metaTitle: "Hizmet Koşulları — Lancerix",
    metaDescription:
      "Lancerix'in doğrulama ve kayıt hizmetini hangi şartlarla sunduğu, neyi garanti ettiği ve neyi etmediği.",
    versionLabel: "SÜRÜM",
    title: "Hizmet Koşulları",
    intro:
      "Sözleşme imzalarken kabul ettiğin şartlar. Kısa tutuldu, çünkü okunmayan bir metne onay almak onay değildir.",
    sections: TERMS_SECTIONS,
    footnote: (version) =>
      `Bu sürüm ${version} tarihlidir. İmzaladığın her sözleşme, o an yürürlükte olan sürümü kaydeder — şartlar sonradan değişse bile senin kabul ettiğin sürüm kayıtta durur.`,
    authoritativeNotice: null,
  },
  en: {
    metaTitle: "Terms of Service — Lancerix",
    metaDescription:
      "The terms Lancerix provides its verification and record-keeping service under: what it guarantees and what it does not.",
    versionLabel: "VERSION",
    title: "Terms of Service",
    intro:
      "The terms you accept when you sign a contract. Kept short, because consent to a text nobody reads is not consent.",
    sections: EN_SECTIONS,
    footnote: (version) =>
      `This version is dated ${version}. Every contract you sign records the version in force at that moment — if the terms change later, the version you accepted stays on the record.`,
    authoritativeNotice:
      "This English text is provided for convenience. Signatures are recorded against the Turkish version, which is the binding text.",
  },
};
