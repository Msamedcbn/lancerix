import type { Locale } from "@/lib/i18n/config";
import type { QaTier } from "@/lib/validations/delivery";

/**
 * Landing page copy.
 *
 * The tier block carries only the words -- `available` and `needsReviewer`
 * still come from QA_TIER_INFO in src/lib/validations/delivery.ts, which
 * CLAUDE.md names as the source of truth for pricing and availability. A
 * second copy of those booleans is exactly how an unorderable tier ends up
 * looking orderable in one language.
 */
export type TierCopy = {
  label: string;
  price: string;
  hint: string;
  details: readonly string[];
};

export type Step = { title: string; body: string };

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
      "Yazılım projelerindeki anlaşmazlıkları ortadan kaldırıyoruz. Müşteriyseniz tam istediğiniz kodu teslim aldığınızdan emin olun; geliştiriciyseniz bitirdiğiniz işin haklı onayını anında alın.",
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
      "Biz bir aracı kurum değil, tarafsız bir hakemiz. Paranızı bünyemizde tutmuyoruz (escrow yok) — ödeme taraflar arasında doğrudan çözülür. Projenin testi ve denetimi için seçtiğiniz bağımsız QA paketine göre ücretlendirme yapıyoruz.",
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
      TIER1: {
        label: "Temel Kontrol",
        price: "99 ₺",
        hint: "Kriter listesi müşteriye sunulur, müşteri kendi kontrolünü yapar. Ücret, doğrulama kaydının kendisi içindir.",
        details: [
          "Müşteri doğrudan kendi inceler",
          "Otomatik ajan maliyeti yok",
          "Zaman damgalı, değiştirilemez kayıt",
        ],
      },
      TIER2: {
        label: "Agentic QA",
        price: "250 ₺ + Harcanan API",
        hint: "Otonom test ajanı UI/UX ve kriterleri tarar. API bütçesi korunur.",
        details: [
          "UI/UX & İşlevsellik taraması",
          "Kıstaslı API kullanım limiti",
          "Çalışma sonrası API maliyeti yansıtılır",
        ],
      },
      TIER3: {
        label: "Agentic + Manuel Tester",
        price: "250 ₺ + API + Tester Ücreti",
        hint: "Otonom agentic testler koşulur, kıdemli QA mühendisi denetiminde doğrulanır.",
        details: [
          "Otonom test + İnsan gözü denetimi",
          "Mühendis onaylı rapor",
          "Tester proje ücreti eklenir",
        ],
      },
      TIER4: {
        label: "Sadece Manuel Tester",
        price: "Tester Özel Ücreti",
        hint: "Doğrudan QA test uzmanı projeyi elden inceler, hataları raporlar.",
        details: [
          "Ajan koşulmaz, doğrudan uzman incelemesi",
          "Tester'ın proje için belirleyeceği sabit ücret",
          "Birebir detaylı rapor",
        ],
      },
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
      "We are not a middleman — we are a neutral referee. We never hold your money (there is no escrow); payment is settled directly between the two parties. What you pay us for is the independent QA tier you choose to test and audit the work.",
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
        price: "₺99",
        hint: "The criteria checklist goes to the client, who reviews the work themselves. The fee covers the verification record itself.",
        details: [
          "The client reviews it directly",
          "No autonomous agent cost",
          "Timestamped, tamper-proof record",
        ],
      },
      TIER2: {
        label: "Agentic QA",
        price: "₺250 + API usage",
        hint: "An autonomous test agent sweeps the UI/UX and the acceptance criteria, within a capped API budget.",
        details: [
          "UI/UX and functionality sweep",
          "Capped API usage limit",
          "API cost billed after the run",
        ],
      },
      TIER3: {
        label: "Agentic + manual tester",
        price: "₺250 + API + tester fee",
        hint: "Autonomous tests run first, then a senior QA engineer verifies the result and signs off.",
        details: [
          "Autonomous tests plus human review",
          "Engineer-signed report",
          "Tester's project fee added on top",
        ],
      },
      TIER4: {
        label: "Manual tester only",
        price: "Tester's own fee",
        hint: "A QA specialist goes through the project by hand and reports what they find.",
        details: [
          "No agent — direct expert review",
          "Flat fee set by the tester for your project",
          "Detailed, itemised report",
        ],
      },
    },
    closingTitle: "Put your work on the record.",
    closingPrimary: "Start free",
    closingSecondary: "Log in",
  },
};
