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
 * Restructured 2026-09-08 (user decision, see STATUS.md): Tier4 removed
 * (zero existing TIER4 rows when dropped, confirmed first). Tier1 is now
 * permanently free -- folded into the 10% platform commission, never goes
 * through Polar (superseding the 2026-09-03 "doğrulama kaydı ücreti"
 * experiment; the fee tested willingness-to-pay, this reverses that test
 * once the answer stopped mattering more than removing friction). Tier2 and
 * Tier3 both became fixed prices instead of variable ones -- Tier3 in
 * particular no longer has a reviewer-roster selection step at all: no
 * third-party reviewer is paid out of it, the founder reviews every Tier3
 * order personally for now (admin's existing submitQaReport flow), so
 * ₺3.500 is Lancerix's own revenue, not a pass-through fee. `qa_reviewers`
 * the table/roster/admin UI is untouched (not dropped) -- this is a "not
 * needed yet" pause, not a permanent removal, so re-expanding to a real
 * roster later doesn't mean rebuilding it.
 *
 * Tier 2 stays priced but not orderable: the Playwright worker exists
 * (src/lib/qa/agent.ts) but has never run end-to-end against a real
 * OPENAI_API_KEY, and an order that queues forever is worse than a tier
 * that says "not yet". See STATUS.md.
 */
export const QA_TIERS = ["TIER1", "TIER2", "TIER3"] as const;
export type QaTier = (typeof QA_TIERS)[number];

export const QA_TIER_INFO: Record<
  QaTier,
  {
    label: string;
    price: string;
    pricingType: "RECORD_FEE" | "AGENTIC" | "HYBRID";
    hint: string;
    details: string[];
    available: boolean;
  }
> = {
  TIER1: {
    label: "Temel Kontrol",
    price: "Ücretsiz",
    pricingType: "RECORD_FEE",
    hint: "Kriter listesi müşteriye sunulur, müşteri kendi kontrolünü yapar. Platform komisyonuna dahildir, ayrıca ücretlendirilmez.",
    details: ["Müşteri doğrudan kendi inceler", "Otomatik ajan maliyeti yok", "Zaman damgalı, değiştirilemez kayıt"],
    available: true,
  },
  TIER2: {
    label: "Agentic QA",
    price: "299 ₺",
    pricingType: "AGENTIC",
    hint: "Otonom test ajanı UI/UX ve kriterleri tarar. Sabit fiyat, çalışma sonrası ek ücret yansıtılmaz.",
    details: ["UI/UX & İşlevsellik taraması", "Sabit fiyat, sürpriz yok", "Zaman damgalı, değiştirilemez kayıt"],
    // available: false until the worker (worker/) is actually deployed and
    // running somewhere -- flipping this to true with no live worker means
    // an order sits in QA_QUEUED forever, which is worse than "not yet".
    // See STATUS.md.
    available: false,
  },
  TIER3: {
    label: "Agentic + Uzman İncelemesi",
    price: "3.500 ₺",
    pricingType: "HYBRID",
    hint: "Otonom agentic testler koşulur, sonuç kıdemli bir mühendis tarafından elden denetlenip onaylanır. Sabit fiyat.",
    details: ["Otonom test + İnsan gözü denetimi", "Mühendis onaylı rapor", "Sabit fiyat, sürpriz yok"],
    available: true,
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
