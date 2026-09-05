/**
 * Shared shape for every content-pillar guide page (src/app/rehber/*,
 * src/app/en/guide/*). One type, reused by each guide's own dictionary file,
 * so GuideView (src/components/public/guide-view.tsx) can render any of them
 * without knowing which one it got.
 */
export type GuideSection = {
  heading: string;
  body: readonly string[];
};

export type GuideFaqItem = {
  q: string;
  a: string;
};

export type GuideCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  /** The one paragraph written to stand alone if quoted out of context --
   * for a search snippet or an AI answer that lifts a single paragraph. */
  definition: string;
  sections: readonly GuideSection[];
  faqHeading: string;
  faq: readonly GuideFaqItem[];
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
  /** ISO date -- also feeds the page's FAQPage/Article schema. */
  updated: string;
};
