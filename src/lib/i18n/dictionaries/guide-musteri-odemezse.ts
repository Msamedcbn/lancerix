import type { GuideCopy } from "@/lib/i18n/dictionaries/guide-shared";
import type { Locale } from "@/lib/i18n/config";

/**
 * Third content pillar. Grew directly out of the most honest question this
 * whole positioning conversation surfaced: a clean verification report does
 * NOT make a client pay -- Faz 1 has no escrow, no fund custody, no
 * enforcement mechanism. This guide exists to answer "so what actually
 * happens if they still don't pay" without pretending the report is a
 * payment guarantee it isn't.
 *
 * Deliberately stays at the level of "what kind of tool exists" (icra
 * takibi, small claims, public reports as reputational leverage) rather
 * than specific legal procedure, cost, or threshold numbers -- none of
 * which this file is positioned to get right or keep current. Every
 * mention of the shareable report links back to toggle_qa_report_share()
 * (Faz E #1), a real, already-shipped feature, not a hypothetical one.
 */
export const GUIDE_MUSTERI_ODEMEZSE_COPY: Record<Locale, GuideCopy> = {
  tr: {
    metaTitle: "Müşteri Ödeme Yapmazsa Ne Yapabilirsin — Lancerix",
    metaDescription:
      "Temiz bir doğrulama raporu tek başına ödeme garantisi değildir. Peki müşteri işi kabul edip yine de ödemezse elinde gerçekte ne olur ve ne yapabilirsin?",
    eyebrow: "REHBER · ÖDEME ALAMAMA",
    title: "Müşteri Ödeme Yapmazsa Ne Yapabilirsin",
    intro:
      "Bunu dolaylı yoldan sormayalım: bağımsız bir doğrulama raporun olması, müşterinin sana parayı otomatik olarak göndereceği anlamına gelmez. Peki rapor temiz çıktı, müşteri hâlâ ödemiyor -- şimdi ne olur?",
    definition:
      "Lancerix bugün (Faz 1) parayı tutmaz, müşteriyi ödemeye zorlamaz -- bunu yapacak escrow altyapısı henüz kurulmadı. Bir doğrulama raporu, \"kriterler karşılandı\" diyen bağımsız ve zaman damgalı bir kanıttır; ödemeyi kendisi tahsil eden bir mekanizma değildir. Bu ayrımı net görmek, elindeki gerçek araçları doğru kullanmanın ilk adımıdır.",
    sections: [
      {
        heading: "Önce elindekini netleştir: kanıtın gerçekten tam mı?",
        body: [
          "İcra sürecine ya da bir tartışmaya girmeden önce şunu kontrol et: sözleşme imzalı mı, kabul kriterleri yazılı ve net mi, teslim zaman damgalı mı, rapor \"kriterler karşılandı\" diyor mu? Bu dördü tamsa, elinde gerçekten güçlü bir dosya var demektir.",
          "Bunlardan biri eksikse (örneğin kriterler hiç yazılmamışsa), önce onu bir sonraki sözleşmende düzelt -- geriye dönük bir eksiği bu aşamada tamamlayamazsın, ama bir daha yaşamamak elinde.",
        ],
      },
      {
        heading: "İcra takibi: yazılı borcun resmi karşılığı",
        body: [
          "Türkiye'de, imzalı bir sözleşme ve ödenmemiş bir bedel üzerinden icra takibi başlatmak yasal bir yoldur -- bu, yazılı bir borcu resmi bir tahsilat sürecine çevirmenin standart mekanizmasıdır.",
          "Bu rehber bir hukuk hizmeti değildir ve süreç, maliyet ya da güncel prosedürler hakkında kesin bilgi vermez -- bunlar zamanla değişir ve senin özel durumuna göre farklılaşır. Somut adım için bir avukata ya da hukuk danışmanına başvurman gerekir. Buradaki tek amaç, böyle bir yolun var olduğunu ve imzalı sözleşme + net kabul kriterleri + zaman damgalı teslimin, o yolu yürürken elinde tuttuğun en değerli belgeler olduğunu göstermek.",
        ],
      },
      {
        heading: "Rapor paylaşımı: yasal olmayan ama gerçek bir baskı aracı",
        body: [
          "Kabul edilen bir doğrulama raporunu, dilersen herkese açık, paylaşılabilir bir bağlantıda yayınlayabilirsin -- bu senin kendi tercihin, varsayılan olarak kapalıdır. Paylaşılan rapor; sözleşme başlığı, proje kategorisi, kabul kriterleri ve sonucu gösterir; taraf isimleri, iletişim bilgisi ya da tutar asla göstermez.",
          "Bu bir tahsilat aracı değildir ama gerçek bir sonucu vardır: bağımsız biri tarafından \"kriterler karşılandı\" diye doğrulanmış bir işi ödemeden bırakan bir müşteri, bunu görünür kılan bir kayıtla karşı karşıya kalır. Bazı anlaşmazlıklarda, ödemeyi hızlandıran şey mahkeme değil, bu görünürlüktür.",
        ],
      },
      {
        heading: "Bir sonraki sefer için: riski baştan azaltmak",
        body: [
          "En güçlü \"ödenmeme\" çözümü, ödenmemeyi zorlaştıran bir sözleşme yapısıdır: işe başlamadan önce bir ön ödeme istemek, büyük projeleri aşamalara bölüp her aşamayı ayrı ayrı teslim etmek, ve her aşama için ayrı kabul kriterleri yazmak -- bunların hiçbiri Lancerix'e özel değil, genel freelance pratiğidir, ama bu platformdaki sözleşme ve kabul kriteri akışıyla doğrudan uyumludur.",
          "Kabul kriterlerinin sözleşme imzalanmadan önce, iki tarafça da onaylanmış olması şart -- imzadan sonra eklenen ya da değiştirilen bir kriter, tam da bir anlaşmazlık anında \"bu zaten yoktu\" itirazıyla karşılaşır.",
        ],
      },
    ],
    faqHeading: "Sık sorulanlar",
    faq: [
      {
        q: "Lancerix ödenmeyen param için tahsilat yapar mı?",
        a: "Hayır. Lancerix bugün fon tutmaz ya da tahsilat yapmaz -- bağımsız bir doğrulama raporu ve imzalı bir sözleşme sağlar. Tahsilat, hukuki yollarla senin (veya avukatının) yürüteceğin ayrı bir süreçtir.",
      },
      {
        q: "Temiz bir rapor mahkemede kanıt sayılır mı?",
        a: "Bu bir hukuki tavsiye değildir ve kesin cevabı bir avukat vermelidir. Genel olarak söylenebilecek şey: imzalı, zaman damgalı ve değiştirilemez bir kayıt, sözlü ya da mesajlaşmaya dağılmış bir anlaşmadan daha güçlü bir belgedir.",
      },
      {
        q: "Raporu herkese açık paylaşmak müşteriyle ilişkimi tamamen bitirir mi?",
        a: "Muhtemelen evet, bu sert bir adımdır ve öyle kullanılmalıdır -- son çare olarak, ilişkinin zaten bittiği durumlarda. Rapor kimseyi kötüleyen bir yorum içermez, sadece kriterlerin karşılandığını gösterir.",
      },
      {
        q: "Bunu önceden nasıl önlerim?",
        a: "Ön ödeme istemek, projeyi aşamalara bölmek ve her aşama için ayrı, imzadan önce kilitlenmiş kabul kriterleri yazmak -- bunların hiçbiri garanti vermez ama riski gözle görülür şekilde azaltır.",
      },
    ],
    ctaTitle: "Bir sonraki sözleşmeni bugün daha sağlam kur",
    ctaBody: "Net kabul kriterleri ve bağımsız bir doğrulama katmanı, ödenmeme riskini ortadan kaldırmaz ama elindeki kanıtı gözle görülür şekilde güçlendirir.",
    ctaPrimary: "Ücretsiz başla",
    ctaSecondary: "Nasıl çalıştığını gör",
    updated: "2026-09-06",
  },
  en: {
    metaTitle: "What To Do If A Client Doesn't Pay — Lancerix",
    metaDescription:
      "A clean verification report is not, by itself, a payment guarantee. So if a client accepts the work and still doesn't pay, what do you actually have -- and what can you do?",
    eyebrow: "GUIDE · NOT GETTING PAID",
    title: "What To Do If A Client Doesn't Pay",
    intro:
      "Let's not dance around it: having an independent verification report doesn't mean the client's payment shows up automatically. So the report comes back clean and the client still isn't paying -- now what?",
    definition:
      "Lancerix today (Faz 1) doesn't hold funds and can't force a client to pay -- the escrow infrastructure that would do that hasn't been built yet. A verification report is independent, timestamped evidence that the criteria were met; it isn't a payment-collection mechanism. Seeing that distinction clearly is the first step to using the tools you actually have.",
    sections: [
      {
        heading: "First, check whether your evidence is actually complete",
        body: [
          "Before pursuing any legal process or confrontation, check: is the contract signed, are the acceptance criteria written and clear, is the delivery timestamped, does the report say the criteria were met? If all four are true, you have a genuinely strong file.",
          "If one of them is missing (say, criteria were never written down), fix that in your next contract -- you can't retroactively complete a past gap, but you can make sure you never hit it again.",
        ],
      },
      {
        heading: "Formal debt collection: the official route for a written debt",
        body: [
          "In Turkey, starting a formal debt-collection process (icra takibi) over a signed contract and an unpaid amount is a legitimate legal route -- it's the standard mechanism for turning a written debt into an official collection process.",
          "This guide is not legal advice and doesn't state exact procedures, costs, or current thresholds -- those change and depend on your specific situation. For concrete next steps you need a lawyer or legal advisor. The only point here is that this route exists, and a signed contract plus clear acceptance criteria plus a timestamped delivery are the most valuable documents you'll be carrying into it.",
        ],
      },
      {
        heading: "Sharing the report: not a legal tool, but a real one",
        body: [
          "You can choose to publish an accepted verification report on a public, shareable link -- off by default, entirely your call. The shared version shows the contract title, project category, acceptance criteria, and the result; it never shows either party's name, contact details, or the amount involved.",
          "It isn't a collection mechanism, but it has a real effect: a client who leaves independently-verified, criteria-met work unpaid now faces a visible record of that. In some disputes, what moves payment along isn't a courtroom -- it's that visibility.",
        ],
      },
      {
        heading: "For next time: reducing the risk up front",
        body: [
          "The strongest fix for non-payment is a contract structure that makes it harder in the first place: asking for an upfront payment before starting, splitting large projects into stages delivered separately, and writing separate acceptance criteria for each stage. None of this is specific to Lancerix -- it's general freelance practice -- but it fits directly into how contracts and criteria already work here.",
          "Acceptance criteria have to be agreed by both sides before the contract is signed -- a criterion added or changed afterward runs straight into \"that was never part of the deal\" the moment a dispute happens.",
        ],
      },
    ],
    faqHeading: "Frequently asked",
    faq: [
      {
        q: "Does Lancerix collect unpaid money on my behalf?",
        a: "No. Lancerix today doesn't hold funds or run collections -- it provides an independent verification report and a signed contract. Collection is a separate legal process you (or your lawyer) would pursue.",
      },
      {
        q: "Does a clean report count as evidence in court?",
        a: "This isn't legal advice, and only a lawyer can give you a definitive answer. What can be said generally: a signed, timestamped, tamper-proof record is a stronger document than an agreement scattered across conversation and messages.",
      },
      {
        q: "Does publishing the report publicly end the relationship with that client?",
        a: "Probably, yes -- it's a firm step and should be treated as one, used as a last resort where the relationship is already over. The report doesn't say anything negative about anyone; it only shows that the criteria were met.",
      },
      {
        q: "How do I prevent this ahead of time?",
        a: "Asking for an upfront payment, splitting the project into stages, and writing separate acceptance criteria locked in before signing -- none of it is a guarantee, but each measurably lowers the risk.",
      },
    ],
    ctaTitle: "Set your next contract up stronger, today",
    ctaBody: "Clear acceptance criteria and an independent verification layer don't eliminate the risk of not getting paid, but they measurably strengthen the evidence you'd be holding if it happens.",
    ctaPrimary: "Start for free",
    ctaSecondary: "See how it works",
    updated: "2026-09-06",
  },
};
