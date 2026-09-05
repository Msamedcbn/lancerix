import type { Locale } from "@/lib/i18n/config";
import type { GuideCopy } from "@/lib/i18n/dictionaries/guide-shared";

/**
 * The second pillar page: the category definition itself, in Lancerix's own
 * words. Every number here is a paraphrase of QA_TIER_INFO in
 * src/lib/validations/delivery.ts (the source of truth per CLAUDE.md) --
 * check that file before changing a price or an availability claim here, not
 * the other way around. TIER2 is written as "coming soon" everywhere it's
 * mentioned because QA_TIER_INFO.TIER2.available is false.
 */
export const GUIDE_QA_VERIFICATION_COPY: Record<Locale, GuideCopy> = {
  tr: {
    metaTitle: "Bağımsız QA Doğrulama Nedir? — Lancerix",
    metaDescription:
      "Bağımsız QA doğrulaması bir güvenlik denetimi değildir. Dört seviyenin (Temel Kontrol, Agentic QA, Agentic + Manuel Tester, Sadece Manuel Tester) neyi kapsadığı ve hangisinin ne zaman seçileceği.",
    eyebrow: "REHBER · BAĞIMSIZ QA",
    title: "Bağımsız QA Doğrulama Nedir",
    intro:
      "Teknik bilginiz olmasa da, dışarıdan aldığınız bir yazılımın gerçekten istediğiniz gibi çalıştığından emin olmak istiyorsunuz. Ya da freelancer olarak, işinizi bitirdiğinizin tarafsız bir kanıtını istiyorsunuz. İkisi de bağımsız QA doğrulamasının çözdüğü sorun.",
    definition:
      "Bağımsız QA doğrulaması, bir yazılım teslimatının sözleşmeye önceden yazılan kabul kriterlerini karşılayıp karşılamadığının, işi yapan ya da isteyen taraftan bağımsız üçüncü bir tarafça kontrol edilmesidir. Bir güvenlik denetimi değildir: sızma testi yapmaz, hatasız kod garantisi vermez — yalnızca yazılı kriterlerin sağlanıp sağlanmadığını doğrular.",
    sections: [
      {
        heading: "Bağımsız doğrulama ile güvenlik denetimi karıştırılmamalı",
        body: [
          "Bir güvenlik denetimi, önceden tanımlanmamış, bilinmeyen açıkları arar: yetkisiz erişim, veri sızıntısı, enjeksiyon zafiyetleri. Uzmanlık gerektirir, haftalar sürebilir ve genellikle kodun kendisine erişim ister.",
          "Bağımsız QA doğrulaması farklı bir soruyu cevaplar: “sözleşmede yazılan kriterler karşılandı mı?” Kapsamı, iki tarafın önceden üzerinde anlaştığı listeyle sınırlıdır — bilinmeyen riskleri taramaz, çünkü bu onun işi değildir.",
          "İkisi birbirinin yerine geçmez. Güvenliği kritik bir sistem teslim alıyorsanız, ayrıca bir güvenlik denetimi yaptırmanız gerekir; bağımsız QA doğrulaması bunun yerine geçmez.",
        ],
      },
      {
        heading: "Dört seviye, dört farklı güvence düzeyi",
        body: [
          "Temel Kontrol (99 ₺): Kabul kriterleri müşteriye sunulur, kontrolü müşteri kendisi yapar. Otomatik ajan maliyeti yoktur; ücret yalnızca zaman damgalı, değiştirilemez kaydın kendisi içindir.",
          "Agentic QA (250 ₺ + harcanan API — yakında): Otonom bir test ajanı arayüzü ve kriterleri tarayacak, API bütçesi korunacak şekilde. Bu seviye şu an satın alınamıyor; ajan altyapısı devreye alındığında açılacak.",
          "Agentic + Manuel Tester (250 ₺ + API + tester ücreti): Otonom testler koşulur, sonuç kıdemli bir QA mühendisi tarafından denetlenip imzalanır. Mühendis onaylı bir rapor çıkar.",
          "Sadece Manuel Tester (tester'ın belirlediği ücret): Ajan koşulmaz; doğrudan bir QA test uzmanı projeyi elden inceler ve birebir detaylı bir rapor yazar.",
        ],
      },
      {
        heading: "Hangi seviye ne zaman seçilir",
        body: [
          "Düşük riskli, güvene dayalı bir ilişkideyseniz ve asıl ihtiyacınız “ne zaman ne teslim edildi”nin tartışmasız bir kaydıysa, Temel Kontrol yeterlidir.",
          "Teslimatın büyüklüğü ya da bedeli arttıkça, insan gözünün de devrede olduğu bir seviye (Agentic + Manuel Tester ya da Sadece Manuel Tester) daha güçlü bir güvence sağlar — özellikle kriterlerin yorumlanmaya açık olduğu durumlarda.",
          "Hızlı, otomatik bir işlevsellik taraması istiyorsanız Agentic QA tam size göre olacak — şimdilik yalnızca Temel Kontrol, Agentic + Manuel Tester ve Sadece Manuel Tester arasından seçim yapılabiliyor.",
        ],
      },
      {
        heading: "Bir doğrulama raporunda ne olur",
        body: [
          "Her rapor aynı üç şeyi taşır: hangi kriterlerin karşılandığı (madde madde), genel bir sonuç (karşılandı / kısmen karşılandı / karşılanmadı) ve kriptografik olarak zaman damgalanmış, değiştirilemez bir özet.",
          "Rapor hiçbir tarafın lehine yazılmaz; yalnızca kriterlerin durumunu bildirir.",
        ],
      },
      {
        heading: "Bağımsız kalmak neden önemli",
        body: [
          "Lancerix ne işi yapan tarafın, ne de işi isteyen tarafın avukatıdır — yazılan kriterlere bakan tarafsız bir gözdür. Bu, doğrulamanın kendisinin yeni bir anlaşmazlık konusu hâline gelmesini önler.",
          "Bu yüzden sınırlar nettir: bir yazılım garantisi kurumu değildir, hatasız kod ya da güvenlik garantisi vermez. Yalnızca üzerinde anlaşılan kriterlerin karşılanıp karşılanmadığını, tarafsızca ve kayıt altında söyler.",
        ],
      },
    ],
    faqHeading: "Sık sorulanlar",
    faq: [
      {
        q: "Agentic QA (Tier 2) şu an satın alınabilir mi?",
        a: "Hayır, henüz değil. Şu an Temel Kontrol, Agentic + Manuel Tester ve Sadece Manuel Tester seviyeleri kullanılabiliyor; Agentic QA otonom test altyapısı devreye alındığında açılacak.",
      },
      {
        q: "Bağımsız QA doğrulaması bir güvenlik denetimi midir?",
        a: "Hayır. Güvenlik denetimi bilinmeyen açıkları arar; bağımsız QA doğrulaması yalnızca sözleşmeye yazılan, bilinen kabul kriterlerinin karşılanıp karşılanmadığını kontrol eder.",
      },
      {
        q: "Hangi seviyeyi seçeceğimi bilmiyorum, ne yapmalıyım?",
        a: "Düşük riskli işler için Temel Kontrol yeterlidir; kriterlerin yorumlanmaya açık olduğu ya da bedelin yüksek olduğu işlerde insan gözü içeren bir seviye (Agentic + Manuel Tester ya da Sadece Manuel Tester) daha güçlü bir güvence sağlar.",
      },
      {
        q: "Rapor bir tarafı mı destekler?",
        a: "Hayır. Rapor hiçbir tarafı desteklemez; yalnızca kriterlerin karşılanıp karşılanmadığını tarafsızca bildirir.",
      },
    ],
    ctaTitle: "Doğru seviyeyi seçin, işinizi güvence altına alın",
    ctaBody: "Sözleşmenize uygun doğrulama seviyesini birlikte belirleyelim.",
    ctaPrimary: "Ücretsiz başla",
    ctaSecondary: "Nasıl çalıştığını gör",
    updated: "2026-09-06",
  },
  en: {
    metaTitle: "What Is Independent QA Verification? — Lancerix",
    metaDescription:
      "Independent QA verification isn't a security audit. What each of the four tiers (Essential Check, Agentic QA, Agentic + Manual Tester, Manual Tester Only) covers, and which one fits which project.",
    eyebrow: "GUIDE · INDEPENDENT QA",
    title: "What Is Independent QA Verification",
    intro:
      "You don't have technical knowledge, but you want to be sure the software you outsourced actually does what you asked. Or you're a freelancer who wants neutral proof the work is done. Both are exactly what independent QA verification solves.",
    definition:
      "Independent QA verification is a check, by a third party independent of both the side doing the work and the side requesting it, of whether a software delivery meets the acceptance criteria written into its contract beforehand. It is not a security audit: it doesn't run a penetration test or guarantee bug-free code — it only verifies whether the written criteria were met.",
    sections: [
      {
        heading: "Don't confuse this with a security audit",
        body: [
          "A security audit looks for unknown vulnerabilities: unauthorized access, data leaks, injection flaws. It requires specialist expertise, can take weeks, and usually needs access to the code itself.",
          "Independent QA verification answers a different question: “were the criteria written into the contract met?” Its scope is limited to the list both parties already agreed on — it doesn't scan for unknown risk, because that isn't its job.",
          "Neither replaces the other. If you're receiving a security-critical system, you still need a separate security audit; independent QA verification is not a substitute for it.",
        ],
      },
      {
        heading: "Four tiers, four levels of assurance",
        body: [
          "Essential Check (₺99): The criteria are handed to the client, who reviews them personally. No autonomous-agent cost; the fee is only for the timestamped, unchangeable record itself.",
          "Agentic QA (₺250 + API cost — coming soon): An autonomous test agent scans the interface and criteria, within a capped API budget. Not orderable yet; it opens once the agent infrastructure is live.",
          "Agentic + Manual Tester (₺250 + API + tester fee): Autonomous tests run, then a senior QA engineer reviews and signs off on the result. You get an engineer-approved report.",
          "Manual Tester Only (tester's own fee): No agent runs; a QA specialist reviews the project directly and writes a detailed, hands-on report.",
        ],
      },
      {
        heading: "Which tier fits which project",
        body: [
          "For a low-stakes, trust-based relationship where what you really need is an undisputed record of what was delivered when, Essential Check is enough.",
          "As the delivery's size or value grows, a tier with a human in the loop (Agentic + Manual Tester, or Manual Tester Only) gives stronger assurance — especially when the criteria leave room for interpretation.",
          "If you want a fast, automated functional scan, Agentic QA will be the fit — for now, only Essential Check, Agentic + Manual Tester and Manual Tester Only can actually be selected.",
        ],
      },
      {
        heading: "What's inside a verification report",
        body: [
          "Every report carries the same three things: which criteria were met, one by one, an overall result (met / partially met / not met), and a cryptographically timestamped, unchangeable summary.",
          "The report doesn't favor either side; it reports the state of the criteria only.",
        ],
      },
      {
        heading: "Why staying independent matters",
        body: [
          "Lancerix isn't counsel for the side doing the work or the side requesting it — it's a neutral eye on the criteria that were written. That keeps the verification itself from becoming a new source of dispute.",
          "Which is why the boundaries are explicit: it is not a software-warranty body, and it doesn't guarantee bug-free code or security. It only states, impartially and on the record, whether the agreed criteria were met.",
        ],
      },
    ],
    faqHeading: "Frequently asked",
    faq: [
      {
        q: "Is Agentic QA (Tier 2) available to buy right now?",
        a: "Not yet. Essential Check, Agentic + Manual Tester and Manual Tester Only are available today; Agentic QA opens once its autonomous test infrastructure is live.",
      },
      {
        q: "Is independent QA verification a security audit?",
        a: "No. A security audit looks for unknown vulnerabilities; independent QA verification only checks whether the known criteria written into the contract were met.",
      },
      {
        q: "I don't know which tier to pick — what should I do?",
        a: "Essential Check for low-stakes work; a tier with a human in the loop (Agentic + Manual Tester or Manual Tester Only) for higher-value work or criteria open to interpretation.",
      },
      {
        q: "Does the report favor either side?",
        a: "No. The report favors neither side — it reports impartially whether the criteria were met.",
      },
    ],
    ctaTitle: "Pick the right tier, protect your work",
    ctaBody: "Let's figure out the right verification tier for your contract together.",
    ctaPrimary: "Start for free",
    ctaSecondary: "See how it works",
    updated: "2026-09-06",
  },
};
