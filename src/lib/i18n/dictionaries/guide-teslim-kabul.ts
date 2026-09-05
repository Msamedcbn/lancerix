import type { Locale } from "@/lib/i18n/config";
import type { GuideCopy } from "@/lib/i18n/dictionaries/guide-shared";

/**
 * The first pillar page in the content strategy: the single highest-intent
 * problem Lancerix solves ("delivered but not accepted / accepted but not
 * sure") gets one thorough, self-contained answer, in both languages.
 *
 * `definition` is written to survive being quoted alone, out of context --
 * the one paragraph a search snippet or an AI answer is most likely to lift
 * verbatim. Keep it a complete claim on its own, not a sentence fragment that
 * depends on the paragraph before it.
 */
export const GUIDE_DELIVERY_ACCEPTANCE_COPY: Record<Locale, GuideCopy> = {
  tr: {
    metaTitle: "Freelance Teslim ve Kabul Rehberi — Lancerix",
    metaDescription:
      "İş teslim edildi ama kabul belirsiz mi kaldı? Kabul kriteri nasıl yazılır, anlaşmazlık çıkarsa ne yapılır ve 'sessizlik kabul sayılır' maddesi ne anlama gelir — adım adım rehber.",
    eyebrow: "REHBER · TESLİM & KABUL",
    title: "Freelance Teslim ve Kabul Rehberi",
    intro:
      "Serbest çalışan işi bitirdi, müşteri hâlâ “bir bakayım” diyor — ya da müşteri işi teslim aldı ama gerçekten istediği gibi çalıştığından emin değil. İkisi de aynı kökten geliyor: teslim ile kabul arasında yazılı, ölçülebilir bir çizgi yok.",
    definition:
      "Bir yazılım projesinde “teslim” ile “kabul” aynı an değildir. Teslim, freelancer'ın işi bitirip müşteriye ulaştırmasıdır; kabul ise üzerinde önceden anlaşılan kriterlerin sağlandığının doğrulanmasıdır. Bu iki adım arasına yazılı bir kriter listesi ve bir süre sınırı konmadıkça, anlaşmazlık ihtimali işin bir parçası hâline gelir.",
    sections: [
      {
        heading: "Sorun: “bitti” ile “kabul edildi” aynı şey değil",
        body: [
          "Freelancer'a göre iş bitmiştir: kod yazılmış, test edilmiş, teslim edilmiştir. Müşteriye göre henüz bir şey bitmemiştir — “bir gözden geçireyim”, “ekiple konuşayım”, “birkaç gün deneyeyim” süreci başlar ve bir bitiş tarihi taşımaz.",
          "Bu belirsizliğin kaynağı çoğu zaman kötü niyet değil, netlik eksikliğidir: sözleşmede “işi bitince ödeme yapılır” yazar ama “bitmiş” sayılmanın somut, ölçülebilir bir tarifi yoktur. Taraflardan biri bu boşluğu doldurmadıkça, ikisi de kendi açısından haklı hisseder.",
        ],
      },
      {
        heading: "Kabul kriteri nedir, neden her sözleşmede olmalı",
        body: [
          "Kabul kriteri, işin “tamam” sayılması için sağlanması gereken, nesnel ve doğrulanabilir bir maddedir. “İşi güzel yapsın” bir kabul kriteri değildir; “ödeme formu Visa, Mastercard ve Troy kartlarını kabul etmeli” bir kabul kriteridir.",
          "İyi bir kriterin üç özelliği vardır: ölçülebilir olmalı (evet/hayır ile cevaplanabilmeli), teslimden önce yazılmış olmalı ve iki tarafın da imzasını taşımalı. Sözleşme imzalandıktan sonra kriter eklemek ya da değiştirmek, tarafların üzerinde anlaştığı zemini kaydırır.",
          "Teknik bilginiz olmasa da kriter yazabilirsiniz — kritik olan kriterin “ne” istendiğini net söylemesidir; “nasıl” doğrulanacağını çözmek doğrulayan tarafın işidir.",
        ],
      },
      {
        heading: "Teslim anında yapılması gerekenler",
        body: [
          "Bir staging adresi veya test edilebilir bir bağlantı paylaşılmalı — “kaynak kodu gönderdim” demek, müşterinin kendi başına deneyebileceği bir şey değilse yeterli değildir.",
          "Kriter listesi tek tek, madde madde işaretlenmeli: hangisi sağlandı, hangisi sağlanmadı, hangisi kapsam dışı kaldı. Genel bir “her şey tamam” cümlesi, bir anlaşmazlık anında hiçbir şey ispatlamaz.",
          "Teslim anı zaman damgalanmalı. Sonradan “ne zaman teslim edildiği” tartışması, çoğu anlaşmazlığın kimin haklı olduğundan önce gelen gerçek kaynağıdır.",
        ],
      },
      {
        heading: "Anlaşmazlık çıkarsa: adım adım",
        body: [
          "Önce kriter listesine dönün. Tartışılan şey kriterlerden biri mi, yoksa kriterlerde hiç yer almayan yeni bir talep mi? İkincisiyse bu bir revizyon talebidir — orijinal teslimin reddi değil.",
          "Taraflar kendi aralarında anlaşamıyorsa, bağımsız bir üçüncü göz devreye girmeli. Kilit kelime bağımsız: işi yapan tarafın kendi değerlendirmesi ya da işi isteyen tarafın tek taraflı kararı değil, ikisinin de üzerinde anlaştığı kriterlere bakan tarafsız bir doğrulama.",
          "Bir süre sınırı olmalı. Süresiz açık kalan bir itiraz, pratikte “asla ödeme yapmama” hakkına dönüşür — bu da kriter yazmak kadar önemli bir korumadır, ama bu sefer freelancer'ı korur.",
        ],
      },
      {
        heading: "“Sessizlik kabul sayılır” maddesi ne anlama gelir",
        body: [
          "Bu madde şunu söyler: teslim yapıldıktan sonra belirlenen süre içinde açık bir itiraz gelmezse, iş kabul edilmiş sayılır. Karmaşık değildir — taraflardan birine sonsuza kadar “bakıyorum” deme hakkı tanımamaktır.",
          "Bu, müşteriyi aceleye getirmek için değildir; süre makul ve önceden bellidir. Amaç, gözden geçirmenin de tıpkı teslimin sahip olduğu gibi bir son tarihi olmasıdır.",
          "Bu maddenin işe yaraması iki şarta bağlı: sürenin taraflarca önceden bilinmesi ve teslim anının tartışmasız biçimde kayıt altında olması. İkisi de yoksa madde kâğıt üzerinde kalır.",
        ],
      },
      {
        heading: "Bağımsız bir üçüncü göz nasıl yardımcı olur",
        body: [
          "Lancerix burada tarafları değil, kriterleri temsil eder: sözleşmeye yazılan kabul kriterlerinin karşılanıp karşılanmadığını hiçbir tarafa bağlı kalmadan doğrular ve sonucu zaman damgalı, değiştirilemez bir rapora yazar.",
          "Bu bir escrow hizmeti değildir — para Lancerix üzerinden geçmez, taraflar arasında doğrudan çözülür. Bir hukuk hizmeti de değildir — kabul kriterli bir sözleşme şablonu sunar, avukatlık yapmaz. Ve bir güvenlik denetimi değildir — yazılan kriterleri doğrular; sızma testi ya da hatasızlık garantisi vermez.",
          "Sınırların bu kadar net olması bilinçli bir tercih: neyin doğrulandığı belirsizse, doğrulamanın kendisi yeni bir anlaşmazlık kaynağına dönüşür.",
        ],
      },
    ],
    faqHeading: "Sık sorulanlar",
    faq: [
      {
        q: "Kabul kriterleri sözleşme imzalandıktan sonra değiştirilebilir mi?",
        a: "Hayır. Taraflardan biri imzaladığı anda kriter listesi kilitlenir ve değiştirilemez — bu yüzden imzalamadan önce net ve eksiksiz olmaları önemlidir.",
      },
      {
        q: "Kabul kriteri yazmak için teknik bilgim olması gerekir mi?",
        a: "Hayır. Kriterin “ne” istendiğini net söylemesi yeterlidir; doğrulama yöntemine karar vermek doğrulayan tarafın işidir.",
      },
      {
        q: "Lancerix ödemeyi kendi üzerinden mi geçiriyor?",
        a: "Hayır. Lancerix parayı tutmaz; ödeme taraflar arasında doğrudan çözülür. Lancerix yalnızca teknik doğrulama raporunu sağlar.",
      },
      {
        q: "Doğrulama raporu sonradan değiştirilebilir mi?",
        a: "Hayır. Rapor oluşturulduğu anda kriptografik olarak zaman damgalanır ve değiştirilemez hâle gelir.",
      },
    ],
    ctaTitle: "İşinizi şansa bırakmayın",
    ctaBody: "Bir sonraki sözleşmenize kabul kriterleri ve bağımsız bir doğrulama katmanı ekleyin.",
    ctaPrimary: "Ücretsiz başla",
    ctaSecondary: "Nasıl çalıştığını gör",
    updated: "2026-09-06",
  },
  en: {
    metaTitle: "Freelance Delivery & Acceptance Guide — Lancerix",
    metaDescription:
      "Delivered the work but acceptance is still unclear? How to write acceptance criteria, what to do when a dispute happens, and what a “silence counts as acceptance” clause actually means.",
    eyebrow: "GUIDE · DELIVERY & ACCEPTANCE",
    title: "Freelance Delivery & Acceptance Guide",
    intro:
      "A freelancer finishes the work and the client keeps saying “let me take a look” — or a client receives the work and isn't sure it actually does what they asked for. Both come from the same root: there's no written, measurable line between delivery and acceptance.",
    definition:
      "In a software project, delivery and acceptance are not the same moment. Delivery is the freelancer finishing the work and handing it over; acceptance is confirming that the criteria agreed on beforehand have actually been met. Without a written list of criteria and a time limit between those two steps, a dispute becomes part of the job by default.",
    sections: [
      {
        heading: "The problem: “done” and “accepted” aren't the same thing",
        body: [
          "To the freelancer, the work is done: written, tested, delivered. To the client, nothing is finished yet — “let me take a look”, “let me check with the team”, “let me try it for a few days” begins, and it carries no end date.",
          "The cause is usually not bad faith but a lack of clarity: the contract says “payment on completion”, but there's no concrete, measurable definition of what “complete” means. Until one side fills that gap, both feel justified.",
        ],
      },
      {
        heading: "What an acceptance criterion is, and why every contract needs one",
        body: [
          "An acceptance criterion is an objective, verifiable statement that has to be true for the work to count as done. “Make it look nice” is not an acceptance criterion; “the payment form must accept Visa, Mastercard and Troy cards” is.",
          "A good criterion has three properties: it's measurable (answerable yes/no), it's written before delivery, and it carries both parties' sign-off. Adding or changing a criterion after the contract is signed shifts the ground both sides agreed to stand on.",
          "You don't need technical knowledge to write one — what matters is stating clearly what is wanted; deciding how to verify it is the verifier's job.",
        ],
      },
      {
        heading: "What to do at the moment of delivery",
        body: [
          "Share a staging URL or a link the client can actually try — “I sent the source code” isn't enough if the client can't run it themselves.",
          "Check off the criteria list one by one: what was met, what wasn't, what fell out of scope. A blanket “everything's done” proves nothing once a dispute starts.",
          "Timestamp the moment of delivery. A later argument over when something was delivered is the real source behind most disputes — before who was right even comes up.",
        ],
      },
      {
        heading: "If a dispute happens: step by step",
        body: [
          "Go back to the criteria list first. Is the disagreement about one of the listed criteria, or a new request that was never in it? If it's the latter, that's a revision request — not a rejection of the original delivery.",
          "If the two sides can't agree, bring in an independent third eye. The key word is independent: not the delivering side's own judgment, and not the requesting side's unilateral decision — a neutral check against the criteria both sides already signed.",
          "There has to be a time limit. An objection window left open indefinitely turns, in practice, into a right to never pay — a protection just as important as writing the criteria in the first place, only this time it protects the freelancer.",
        ],
      },
      {
        heading: "What a “silence counts as acceptance” clause actually means",
        body: [
          "The clause says: if no explicit objection arrives within an agreed window after delivery, the work counts as accepted. It isn't complicated — it just refuses to let either side say “I'm still looking at it” forever.",
          "It isn't there to rush the client; the window is reasonable and known in advance. The point is that review has a deadline, the same way delivery does.",
          "The clause only works under two conditions: the window is known to both sides ahead of time, and the moment of delivery is recorded beyond dispute. Without either, it stays a sentence on paper.",
        ],
      },
      {
        heading: "How an independent third eye actually helps",
        body: [
          "Lancerix represents the criteria here, not either party: it verifies whether the acceptance criteria written into the contract were met, without favoring either side, and writes the result into a timestamped, unchangeable report.",
          "It is not an escrow service — money never passes through Lancerix; payment is settled directly between the parties. It is not a legal service — it provides a contract template with acceptance criteria built in, not legal counsel. And it is not a security audit — it verifies the criteria that were written, not a penetration test or a guarantee of bug-free code.",
          "Being this explicit about the boundaries is deliberate: when what's being verified is unclear, the verification itself becomes a new source of dispute.",
        ],
      },
    ],
    faqHeading: "Frequently asked",
    faq: [
      {
        q: "Can acceptance criteria be changed after the contract is signed?",
        a: "No. Once either party signs, the criteria list locks and can't be changed — which is exactly why they need to be clear and complete before signing.",
      },
      {
        q: "Do I need technical knowledge to write acceptance criteria?",
        a: "No. Stating clearly what is wanted is enough; deciding how to verify it is the verifier's job.",
      },
      {
        q: "Does Lancerix hold or move the payment itself?",
        a: "No. Lancerix never holds funds; payment is settled directly between the parties. Lancerix only provides the technical verification report.",
      },
      {
        q: "Can a verification report be changed after it's issued?",
        a: "No. The report is cryptographically timestamped the moment it's created and becomes unchangeable.",
      },
    ],
    ctaTitle: "Don't leave your work to chance",
    ctaBody: "Add acceptance criteria and an independent verification layer to your next contract.",
    ctaPrimary: "Start for free",
    ctaSecondary: "See how it works",
    updated: "2026-09-06",
  },
};
