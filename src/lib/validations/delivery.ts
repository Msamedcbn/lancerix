import { z } from "zod";

/**
 * What a freelancer hands over on a QA_ONLY contract.
 *
 * A staging URL is required because it is what QA actually runs against --
 * every automatable criterion type carries a URL of its own, but the delivery
 * is the thing being verified as a whole. The PR link is optional evidence for
 * a human reviewer (Tier 3) and is never fetched by the agent.
 */
const httpUrl = z
  .string()
  .trim()
  .regex(/^https?:\/\/\S+$/, "http:// veya https:// ile başlayan bir adres gir.");

const optionalText = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v === "" ? null : v));

export const deliverySchema = z.object({
  stagingUrl: httpUrl,
  prUrl: optionalText
    .nullable()
    .refine(
      (v) => v === null || httpUrl.safeParse(v).success,
      "PR linki http:// veya https:// ile başlamalı.",
    ),
  notes: optionalText.nullable(),
});

export type DeliveryInput = z.infer<typeof deliverySchema>;

/**
 * The tiers, and what each one costs.
 *
 * Tier 2 is priced but not orderable yet: the Playwright worker that would run
 * it does not exist, and an order that queues forever is worse than a tier
 * that says "not yet". Tier 3's fee is charged manually until the payment
 * integration lands, which is why nothing here touches money in the database.
 */
export const QA_TIERS = ["TIER1", "TIER2", "TIER3", "TIER4"] as const;
export type QaTier = (typeof QA_TIERS)[number];

export const QA_TIER_INFO: Record<
  QaTier,
  {
    label: string;
    price: string;
    pricingType: "FREE" | "AGENTIC" | "HYBRID" | "MANUAL_TESTER";
    hint: string;
    details: string[];
    available: boolean;
    needsReviewer: boolean;
  }
> = {
  TIER1: {
    label: "Temel Kontrol",
    price: "Ücretsiz",
    pricingType: "FREE",
    hint: "Kriter listesi müşteriye sunulur, müşteri kendi kontrolünü yapar.",
    details: ["Müşteri doğrudan kendi inceler", "Otomatik ajan maliyeti yok", "Hızlı onay"],
    available: true,
    needsReviewer: false,
  },
  TIER2: {
    label: "Agentic QA",
    price: "250 ₺ + Harcanan API",
    pricingType: "AGENTIC",
    hint: "Otonom test ajanı UI/UX ve kriterleri tarar. API bütçesi korunur.",
    details: ["UI/UX & İşlevsellik taraması", "Kıstaslı API kullanım limiti", "Çalışma sonrası API maliyeti yansıtılır"],
    // available: false until the worker (worker/) is actually deployed and
    // running somewhere -- flipping this to true with no live worker means
    // an order sits in QA_QUEUED forever, which is worse than "not yet".
    // See STATUS.md.
    available: false,
    needsReviewer: false,
  },
  TIER3: {
    label: "Agentic + Manuel Tester",
    price: "250 ₺ + API + Tester Ücreti",
    pricingType: "HYBRID",
    hint: "Otonom agentic testler koşulur, kıdemli QA mühendisi denetiminde doğrulanır.",
    details: ["Otonom test + İnsan gözü denetimi", "Mühendis onaylı rapor", "Tester proje ücreti eklenir"],
    available: true,
    needsReviewer: true,
  },
  TIER4: {
    label: "Sadece Manuel Tester",
    price: "Tester Özel Ücreti",
    pricingType: "MANUAL_TESTER",
    hint: "Doğrudan QA test uzmanı projeyi elden inceler, hataları raporlar.",
    details: ["Ajan koşulmaz, doğrudan uzman incelemesi", "Tester'ın proje için belirleyeceği sabit ücret", "Birebir detaylı rapor"],
    available: true,
    needsReviewer: true,
  },
};

export const qaTierSchema = z.enum(QA_TIERS).refine(
  (tier) => QA_TIER_INFO[tier].available,
  "Bu paket şu an seçilemiyor.",
);

/**
 * The client's answer inside the review window.
 *
 * An objection has to say what is wrong. Accepting does not: silence already
 * means acceptance under the contract, so demanding prose to say yes would
 * make the explicit path harder than the passive one.
 */
export const clientDecisionSchema = z
  .object({
    decision: z.enum(["ACCEPTED", "REJECTED"]),
    note: optionalText.nullable(),
  })
  .refine(
    (v) => v.decision === "ACCEPTED" || (v.note?.length ?? 0) >= 10,
    {
      message: "İtirazın gerekçesini en az on karakterle yaz.",
      path: ["note"],
    },
  );
