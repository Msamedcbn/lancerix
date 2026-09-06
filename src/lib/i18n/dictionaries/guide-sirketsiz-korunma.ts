import type { GuideCopy } from "@/lib/i18n/dictionaries/guide-shared";
import type { Locale } from "@/lib/i18n/config";

/**
 * Second content pillar, built around the positioning insight from the
 * 2026-09-06 CEO review conversation: the freelancer most exposed to being
 * taken advantage of is the one who hasn't yet reached the income level
 * where forming a full company (a limited şirket, not just registering as a
 * self-employed individual) makes financial sense. That population is real,
 * underserved, and exactly who this guide is written for.
 *
 * Deliberately stays out of specific tax thresholds or numbers -- those
 * change and this isn't a tax/accounting service (see the FAQ's own
 * disclaimer). What's actually true and doesn't expire: a written contract,
 * clear acceptance criteria, and an independent record protect a bireysel
 * (individual) freelancer exactly as much as they protect a registered
 * company, because none of those three things depend on having a company
 * title -- they depend on being written down.
 */
export const GUIDE_SIRKETSIZ_KORUNMA_COPY: Record<Locale, GuideCopy> = {
  tr: {
    metaTitle: "Şirket Kurmadan Freelance Çalışırken Kendini Nasıl Korursun — Lancerix",
    metaDescription:
      "Henüz şirket kuracak kadar büyümedin diye korumasız değilsin. Bireysel bir freelancer'ın kurumsal bir müşteriye karşı elinde neyin gerçekten kanıt sayıldığını anlatan rehber.",
    eyebrow: "REHBER · BİREYSEL FREELANCER",
    title: "Şirket Kurmadan Freelance Çalışırken Kendini Nasıl Korursun",
    intro:
      "Bir müşteri \"siz gerçek bir şirket değilsiniz\" dediğinde, bunu bir hak kaybı gibi hissedersin. Değil. Zayıf olan unvanın değil, elindeki kanıtın -- ve kanıt, şirket kurmadan da tam olarak aynı ağırlıkta üretilebilir.",
    definition:
      "Bireysel bir freelancer ile kurumsal bir müşteri arasındaki güç dengesizliği gerçektir: karşındaki bir hukuk departmanına sahipken sen tek başınasın, ve bu bazen \"nasılsa dava açamaz\" gibi bir varsayıma dönüşür. Ama bir sözleşmenin bağlayıcılığı, tarafın şirket mi yoksa TCKN'siyle imzalayan bir birey mi olduğuna bakmaz -- bağlayıcılığı belirleyen şey, neyin yazılı olduğu ve neyin kayıt altında tutulduğudur.",
    sections: [
      {
        heading: "Sorun: eksik olan unvan değil, kanıt",
        body: [
          "\"Şirketiniz yok, sizi ciddiye almıyorum\" cümlesi aslında şunu söyler: \"elinizde bana karşı kullanabileceğiniz güçlü bir kayıt olmadığını düşünüyorum.\" Çoğu zaman haklı çıkar -- çünkü sözleşme bir mesajlaşma geçmişine, kabul kriterleri sözlü bir anlaşmaya dağılmıştır.",
          "Bu, çözülemez bir sorun değil, bir hazırlık eksikliğidir. Yazılı bir sözleşme, açık kabul kriterleri ve zaman damgalı bir teslim kaydı olan bireysel bir freelancer, hiçbirine sahip olmayan bir şirketten çok daha güçlü bir konumdadır.",
        ],
      },
      {
        heading: "Şirket kurmak ne zaman mantıklı, ne zaman erken",
        body: [
          "Bir limited şirket kurmanın kendi maliyeti vardır -- muhasebeci, SGK, düzenli beyanname -- ve bu maliyet ancak belirli bir gelir seviyesinin üzerinde kendini amorti eder. O seviyenin altındaykenki her ay, parayı işe değil bürokrasiye harcamak demektir.",
          "Bu, doğru rakamı bilmek için bir muhasebeciye sorulması gereken bir hesaptır -- burada vermeyeceğiz, çünkü bu bir muhasebe hizmeti değil. Ama genel kural şu: şirket kurmak bir korunma yöntemi değil, bir ölçeklenme kararıdır. Korunma, gelir seviyesinden bağımsız olarak bugün başlar.",
        ],
      },
      {
        heading: "Şirket olmadan da bağlayıcı bir sözleşme kurabilirsin",
        body: [
          "Türkiye'de bireysel bir kişi, kendi TCKN'siyle taraf olduğu bir sözleşmeyle tam olarak bağlıdır -- sözleşmenin geçerliliği, imzalayanın bir şirket unvanı taşımasına bağlı değildir.",
          "Dijital olarak imzalanmış, zaman damgalı bir sözleşme -- kağıda basılıp ıslak imza atılmış bir sözleşmeden daha az \"gerçek\" değildir. Önemli olan şey kimin ne zaman neyi kabul ettiğinin tartışmasız kaydedilmiş olmasıdır.",
        ],
      },
      {
        heading: "Bağımsız bir kayıt, unvandan daha güçlü bir kanıttır",
        body: [
          "Bir anlaşmazlık anında sorulan soru \"karşı taraf bir şirket mi\" değildir -- \"kabul kriterleri neydi, teslim ne zaman yapıldı, hangisi karşılandı\" sorusudur. Bu soruların cevabı bağımsız ve zaman damgalı bir yerde duruyorsa, unvanın hiç önemi kalmaz.",
          "Lancerix burada tam olarak bunu yapar: sözleşmenize yazdığınız kabul kriterlerinin karşılanıp karşılanmadığını taraflardan bağımsız şekilde doğrular ve sonucu değiştirilemez bir rapora yazar -- ister bireysel bir freelancer, ister kurumsal bir ajans olun, fark etmez.",
        ],
      },
    ],
    faqHeading: "Sık sorulanlar",
    faq: [
      {
        q: "Şirket kurmadan yasal olarak freelance çalışabilir miyim?",
        a: "Türkiye'de bireysel (şahıs) olarak, serbest meslek kaydıyla çalışmak yaygın ve mümkün bir yoldur -- bu, bir limited şirket kurmaktan farklı bir şeydir. Doğru kayıt şeklinin hangisi olduğu kendi durumuna göre değişir; bunun için bir mali müşavire danışmanı öneririz, biz bir muhasebe ya da hukuk hizmeti sunmuyoruz.",
      },
      {
        q: "Müşterim \"siz şirket değilsiniz, sözleşme geçersiz\" derse ne olur?",
        a: "Bu doğru değildir -- bireysel bir kişinin kendi kimliğiyle taraf olduğu bir sözleşme bağlayıcıdır. Ama bunu bir anlaşmazlık anında kanıtlamak, sözleşmenin ve kabul kriterlerinin yazılı ve zaman damgalı olmasına bağlıdır.",
      },
      {
        q: "Lancerix kullanmak için şirket kurmam gerekiyor mu?",
        a: "Hayır. Bugünkü haliyle Lancerix hiçbir tarafın şirket kurmasını şart koşmaz -- bireysel bir freelancer ile kurumsal bir müşteri arasındaki sözleşmeyi de aynı şekilde destekler.",
      },
      {
        q: "Vergi ya da muhasebe konusunda tavsiye verir misiniz?",
        a: "Hayır. Bu rehber ve Lancerix'in kendisi, sözleşme ve teslim doğrulaması üzerine -- vergi, muhasebe ya da hukuki danışmanlık sağlamıyoruz.",
      },
    ],
    ctaTitle: "Bir sonraki sözleşmeni bugün güvence altına al",
    ctaBody:
      "Şirket kurmuş olman gerekmiyor -- yazılı bir sözleşme, net kabul kriterleri ve bağımsız bir doğrulama katmanı yeterli.",
    ctaPrimary: "Ücretsiz başla",
    ctaSecondary: "Nasıl çalıştığını gör",
    updated: "2026-09-06",
  },
  en: {
    metaTitle: "How To Protect Yourself Freelancing Without A Company — Lancerix",
    metaDescription:
      "Not having reached the income level to form a company doesn't mean you're unprotected. A guide to what actually counts as proof for an individual freelancer against a corporate client.",
    eyebrow: "GUIDE · INDIVIDUAL FREELANCERS",
    title: "How To Protect Yourself Freelancing Without A Company",
    intro:
      "When a client says \"you're not a real company,\" it feels like losing a right. It isn't one. What's actually weak isn't your title -- it's your evidence, and evidence can be produced at exactly the same weight without ever forming a company.",
    definition:
      "The power imbalance between an individual freelancer and a corporate client is real: they have a legal department, you have yourself, and that sometimes turns into an assumption that you won't be able to push back. But a contract's binding force doesn't depend on whether the signing party is a company or an individual signing with their own identity -- it depends on what was written down and what was kept on record.",
    sections: [
      {
        heading: "The problem isn't your title -- it's your evidence",
        body: [
          "\"You don't have a company, I'm not taking this seriously\" really means: \"I don't think you have a strong record you could use against me.\" Often, they're right -- because the contract lives in a chat history, and the acceptance criteria live in a verbal agreement.",
          "That's a preparation gap, not an unsolvable problem. An individual freelancer with a written contract, explicit acceptance criteria, and a timestamped delivery record is in a far stronger position than a company with none of those.",
        ],
      },
      {
        heading: "When forming a company makes sense, and when it's premature",
        body: [
          "Forming a company has its own cost -- an accountant, mandatory filings, ongoing compliance overhead -- and that cost only pays for itself above a certain income level. Below that level, every month spent on it is money spent on bureaucracy instead of the work itself.",
          "That's a calculation for an accountant, specific to your situation -- we won't give a number here, because this isn't an accounting service. The general rule is: forming a company is a scaling decision, not a protection method. Protection starts today, regardless of income level.",
        ],
      },
      {
        heading: "You can form a binding contract without a company",
        body: [
          "An individual, signing a contract under their own identity, is fully bound by it -- a contract's validity doesn't depend on the signer carrying a company title.",
          "A digitally signed, timestamped contract is no less \"real\" than one printed and signed by hand. What matters is that who agreed to what, and when, is recorded beyond dispute.",
        ],
      },
      {
        heading: "An independent record beats a company title as proof",
        body: [
          "When a dispute happens, the question asked isn't \"is the other side a company\" -- it's \"what were the acceptance criteria, when was it delivered, which of them were met.\" If the answer to those questions sits somewhere independent and timestamped, the title stops mattering at all.",
          "This is exactly what Lancerix does: it verifies, independently of either party, whether the acceptance criteria written into your contract were met, and writes the result into a report that can't be altered afterwards -- whether you're an individual freelancer or a registered agency makes no difference.",
        ],
      },
    ],
    faqHeading: "Frequently asked",
    faq: [
      {
        q: "Can I legally freelance without forming a company?",
        a: "In Turkey, working as an individual under a self-employed registration is a common and legitimate path, distinct from forming a limited company. Which registration is right for your situation depends on your circumstances -- we recommend talking to an accountant; we don't provide accounting or legal services.",
      },
      {
        q: "What if my client says \"you're not a company, this contract doesn't count\"?",
        a: "That isn't true -- a contract an individual signs under their own identity is binding. But proving that in a dispute depends on the contract and the acceptance criteria being written down and timestamped.",
      },
      {
        q: "Do I need to form a company to use Lancerix?",
        a: "No. Lancerix today doesn't require either party to have formed a company -- it supports a contract between an individual freelancer and a corporate client exactly the same way.",
      },
      {
        q: "Do you give tax or accounting advice?",
        a: "No. This guide, and Lancerix itself, focus on contracts and delivery verification -- we don't provide tax, accounting, or legal advice.",
      },
    ],
    ctaTitle: "Put your next contract on the record today",
    ctaBody:
      "You don't need to have formed a company -- a written contract, clear acceptance criteria, and an independent verification layer are enough.",
    ctaPrimary: "Start for free",
    ctaSecondary: "See how it works",
    updated: "2026-09-06",
  },
};
