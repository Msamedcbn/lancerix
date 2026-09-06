import type { Locale } from "@/lib/i18n/config";

/**
 * The roadmap page.
 *
 * Phase labels match CLAUDE.md's own vocabulary (Faz 1 / Faz 2) rather than
 * an invented semver scheme -- a second, parallel naming system for the same
 * two phases is exactly the kind of drift that makes a page quietly stop
 * matching reality. Every claim here must stay true against CLAUDE.md's
 * "Faz 1 ships as a Verification & Reporting SaaS, not an escrow/payment
 * business" line: no fund custody, no escrow, no usage-scale claim, and
 * pricing described as the QA_TIER_INFO tiers that actually exist today, not
 * the Faz 2 platform fee.
 */
export type RoadmapCopy = {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string;
  past: {
    title: string;
    body: string;
    problemsHeading: string;
    problems: readonly string[];
  };
  present: {
    title: string;
    bodyBefore: string;
    bodyStrong: string;
    bodyAfter: string;
    costTitle: string;
    costBody: string;
    reportsTitle: string;
    reportsBody: string;
  };
  future: {
    title: string;
    body: string;
    nowBadge: string;
    nowTitle: string;
    nowBody: string;
    launchBadge: string;
    launchTitle: string;
    launchBody: string;
    targetBadge: string;
    targetTitle: string;
    targetBodyBefore: string;
    targetBodyStrong: string;
    targetBodyAfter: string;
  };
};

export const ROADMAP_COPY: Record<Locale, RoadmapCopy> = {
  tr: {
    metaTitle: "Yol Haritası — Lancerix",
    metaDescription: "Lancerix'in bugün ne yaptığı, ne yapmadığı ve sırada ne olduğu -- olduğu gibi.",
    heading: "Bugün ne yapıyoruz, sırada ne var",
    intro:
      "Bir doğrulama servisinin en önemli özelliği dürüst olmasıdır. Bu yüzden burada ne bugün canlı olmayan bir özelliği \"şimdiden\" varmış gibi anlatıyoruz, ne de olmayan bir kullanım rakamı veriyoruz -- sadece bugün gerçekten çalışanı, ve ondan sonra ne inşa edeceğimizi.",
    past: {
      title: "Çözmeye çalıştığımız sorun",
      body: "Freelance ve ajans projelerinde teslim ile kabul arasında genellikle yazılı, tarafsız bir tanım yoktur: müşteri \"istediğim gibi değil\" der, geliştirici \"sözleşmede bu yazmıyordu\" der, ikisi de kısmen haklı olabilir -- çünkü hangi kriterin karşılandığını gösteren bağımsız bir kayıt yoktur.",
      problemsHeading: "Bu belirsizliğin somut sonuçları",
      problems: [
        "Kabul kriterleri sözlü ya da mesajlaşmaya dağılmış, tek bir yerde değil",
        "Bir anlaşmazlıkta kimin haklı olduğuna dair tarafsız bir kayıt yok",
        "Ödemenin ne zaman ve neden serbest kaldığına dair ortak, değiştirilemez bir zaman çizelgesi yok",
      ],
    },
    present: {
      title: "Bugün neredeyiz (Faz 1)",
      bodyBefore: "Lancerix bugün bağımsız bir ",
      bodyStrong: "teknik doğrulama servisi",
      bodyAfter:
        " -- fon saklamıyoruz, escrow yok, e-fatura kesmiyoruz. Sözleşme + yazılı kabul kriterleri + zaman damgalı bir doğrulama raporu üretiyoruz; ödeme taraflar arasında doğrudan çözülür.",
      costTitle: "Gerçek fiyatlandırma",
      costBody:
        "Gizli komisyon yok: Temel Kontrol 99₺'den başlıyor, kıdemli mühendis incelemesi gerektiren paketlerde tester kendi ücretini belirliyor. Tam liste ana sayfadaki fiyatlandırma bölümünde.",
      reportsTitle: "Değiştirilemez raporlar",
      reportsBody:
        "Her rapor SHA-256 ile özetlenir ve veritabanı seviyesinde silinemez/değiştirilemez bir kayda yazılır -- bu bir blokzincir değil, tek bir güvenilir tarafın (Lancerix) veritabanı kurallarıyla uyguladığı gerçek bir değiştirilemezlik garantisi. Detaylar güven mimarisi sayfasında.",
    },
    future: {
      title: "Sırada ne var",
      body: "Platformu adım adım, önce doğru temelleri kurarak inşa ediyoruz -- bir sonraki adıma geçmeden önce mevcut adımın gerçekten çalıştığından emin oluyoruz.",
      nowBadge: "Faz 1 — Şu an canlı",
      nowTitle: "Bağımsız QA doğrulama ve raporlama",
      nowBody:
        "Sözleşme, kabul kriterleri, teslim ve dört QA paketinden (temel kontrol, otonom test, otonom + mühendis, sadece mühendis) seçim -- hepsi bugün çalışıyor. Fon saklama ve e-fatura bu fazın kapsamında değil.",
      launchBadge: "Sırada",
      launchTitle: "Otonom test ajanının (Tier 2) canlıya alınması",
      launchBody:
        "Agentic QA paketi -- bir test ajanının teslim edilen çalışmayı otomatik taraması -- şu an sipariş edilemiyor; ilgili worker henüz üretime alınmadı. Bir sonraki somut hedefimiz bunu gerçek bir teslimatla uçtan uca test edip canlıya almak.",
      targetBadge: "Faz 2 — Hedef",
      targetTitle: "Güvenli ödeme (escrow) altyapısı",
      targetBodyBefore:
        "Bağımsız doğrulama katmanı olgunlaştıktan sonra, kendi ",
      targetBodyStrong: "escrow",
      targetBodyAfter:
        " altyapımızla fon saklama, stopaj hesaplama ve otomatik net ödeme devreye girecek. Bu, bugünkü doğrulama mekaniğinin üzerine kurulacak, onun yerini almayacak.",
    },
  },
  en: {
    metaTitle: "Roadmap — Lancerix",
    metaDescription: "What Lancerix actually does today, what it doesn't, and what's next -- as-is.",
    heading: "What we do today, what's next",
    intro:
      "The most important property of a verification service is honesty about itself. So this page never describes a feature that isn't live yet as if it were, and never states a usage number that isn't real -- just what actually works today, and what we build after it.",
    past: {
      title: "The problem we're solving",
      body: "Freelance and agency projects usually have no written, neutral definition of what \"done\" means: the client says \"this isn't what I asked for,\" the developer says \"the contract never said that,\" and both can be partly right -- because there is no independent record of which criteria were actually met.",
      problemsHeading: "What that uncertainty actually causes",
      problems: [
        "Acceptance criteria live in conversation or scattered messages, not one place",
        "No neutral record of who was right when a dispute happens",
        "No shared, tamper-proof timeline of when and why payment was released",
      ],
    },
    present: {
      title: "Where we are today (Faz 1)",
      bodyBefore: "Lancerix today is an independent ",
      bodyStrong: "technical verification service",
      bodyAfter:
        " -- we hold no funds, there is no escrow, we don't issue invoices. We produce a contract, written acceptance criteria, and a timestamped verification report; payment is settled directly between the two parties.",
      costTitle: "Real pricing",
      costBody:
        "No hidden commission: the basic check starts at ₺99, and tiers requiring a senior engineer have the tester set their own fee. The full list is on the homepage's pricing section.",
      reportsTitle: "Reports that can't be edited",
      reportsBody:
        "Every report is hashed with SHA-256 and written to a record that cannot be deleted or altered at the database level -- not a blockchain, but a real immutability guarantee enforced by one trusted party's (Lancerix's) own database rules. Details are on the trust architecture page.",
    },
    future: {
      title: "What's next",
      body: "We're building this one solid step at a time -- making sure the current step actually works before moving to the next one.",
      nowBadge: "Faz 1 — Live now",
      nowTitle: "Independent QA verification and reporting",
      nowBody:
        "Contracts, acceptance criteria, delivery, and a choice of four QA tiers (basic check, autonomous test, autonomous plus engineer, engineer only) all work today. Fund custody and invoicing are outside this phase's scope.",
      launchBadge: "Next",
      launchTitle: "Bringing the autonomous test agent (Tier 2) online",
      launchBody:
        "The Agentic QA tier -- a test agent automatically sweeping a delivered build -- isn't orderable yet; its worker hasn't shipped to production. Our next concrete milestone is testing it end to end against a real delivery and turning it on.",
      targetBadge: "Faz 2 — Target",
      targetTitle: "Secure payment (escrow) infrastructure",
      targetBodyBefore: "Once the independent verification layer has matured, our own ",
      targetBodyStrong: "escrow",
      targetBodyAfter:
        " infrastructure will add fund custody, tax withholding, and automatic net payout. This builds on top of today's verification mechanics -- it doesn't replace them.",
    },
  },
};
