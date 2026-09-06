import type { GuideCopy } from "@/lib/i18n/dictionaries/guide-shared";
import type { Locale } from "@/lib/i18n/config";

/**
 * The trust-architecture content pillar -- what actually enforces the
 * "you can trust this report" claim, at the database level, not just in
 * marketing copy. Written for a technical evaluator (an investor's
 * technical advisor, an accelerator's review panel) who will not take
 * "we're secure" at face value and would rather see the actual mechanism.
 *
 * Every claim here is verifiable directly against CLAUDE.md's non-negotiable
 * rules and the migrations in supabase/migrations/ -- nothing in this file
 * describes a Faz 2 feature as live, and nothing claims a security audit or
 * usage scale that has not happened. If either of those ever becomes false,
 * this page is wrong and needs fixing before anything else does.
 */
export const GUVEN_MIMARISI_COPY: Record<Locale, GuideCopy> = {
  tr: {
    metaTitle: "Güven Mimarisi — Lancerix",
    metaDescription:
      "Lancerix'in doğrulama raporlarını güvenilir kılan şey bir söz değil, veritabanı seviyesinde zorunlu kılınan somut mimari kararlardır. Hepsi burada.",
    eyebrow: "GÜVEN MİMARİSİ",
    title: "Güven bir söz değil, bir mimari kararlar bütünüdür.",
    intro:
      "\"Güvenilir\" demek kolay. Burada onun yerine, bir raporun neden sonradan değiştirilemediğini, bir hesabın neden başka birinin verisini göremediğini ve bir tutarın neden yuvarlama hatasıyla kaybolmadığını -- veritabanı seviyesinde -- tek tek gösteriyoruz.",
    definition:
      "Lancerix'te güven, uygulama kodunun \"iyi niyetli\" davranmasına değil, Postgres'in kendisinin belirli işlemleri reddetmesine dayanır: yetkisiz bir satır okunamaz, imzalanmış bir kayıt silinemez, parasal bir tutar asla ondalıklı bir sayı olarak saklanamaz. Bu sayfa, o kısıtların her birinin nerede ve nasıl uygulandığını anlatır.",
    sections: [
      {
        heading: "Para, hiçbir noktada ondalıklı bir sayı olarak var olmaz",
        body: [
          "Her tutar kuruş cinsinden bir tam sayıdır (BIGINT), hiçbir zaman float değil. Oranlar baz puan cinsindendir (1000 = %10,00). Bu, kayan noktalı sayıların klasik hatasını -- 0,1 + 0,2'nin tam olarak 0,3 etmemesi -- para hesaplarından tamamen çıkarır.",
          "Platform komisyonu, freelancer'ın net kazancından değil, müşterinin üstüne eklenen tutardan hesaplanır; müşteri ücreti ve freelancer net kazancı ikisi de tek bir brüt tutardan çıkarma yoluyla türetilir, ikinci bir yüzde hesabıyla değil -- böylece iki taraf da aynı toplam üzerinde asla anlaşamama riski taşımaz.",
          "Bu mantık iki dilde ayrı ayrı yazılmaz: TypeScript tarafındaki hesaplama fonksiyonu ile Postgres'teki STORED GENERATED kolonlar birebir aynı yuvarlama kuralını (yarıdan büyükse yukarı) uygular ve otomatik testlerle karşılaştırılır.",
        ],
      },
      {
        heading: "Bir durum değişikliği yalnızca tek bir kapıdan geçebilir",
        body: [
          "Bir teslimatın veya bir ödeme aşamasının durumu, uygulama kodunda herhangi bir yerden değil, yalnızca tek bir veritabanı fonksiyonu üzerinden değişebilir. Hangi durumdan hangi duruma geçilebileceği ayrı bir tabloda tanımlıdır; tanımsız bir geçiş veritabanı tarafından reddedilir.",
          "Bu fonksiyon, durum değişikliğini ve o değişikliği açıklayan kayıt defteri satırını aynı veritabanı işlemi (transaction) içinde yazar -- yarıda kesilen bir işlem, açıklaması olmayan bir durum değişikliği bırakamaz.",
          "Bir tetikleyici (trigger), bu fonksiyonun dışından yapılan hiçbir durum güncellemesini kabul etmez -- uygulama kodunda bir hata olsa bile, veritabanı kuralı çiğnenemez.",
        ],
      },
      {
        heading: "Kayıt defteri yalnızca eklenebilir, asla silinemez veya değiştirilemez",
        body: [
          "Her durum değişikliği, her doğrulama raporu, kalıcı bir kayıt defterine yazılır. Bu tablolarda UPDATE veya DELETE için hiçbir izin (policy) tanımlı değildir -- ayrıca bunu engelleyen ayrı bir tetikleyici de vardır. Bu, uygulamanın en yetkili hesabı (admin) için bile geçerlidir.",
          "Bir doğrulama raporunun kriptografik özeti (SHA-256), o raporun tam olarak hangi metni içerdiğinin değiştirilemez kanıtıdır -- rapor sonradan \"düzeltilirse\", özet artık eşleşmez ve bu fark açıkça görülür. Bu bir blokzincir değildir; dağıtık bir ağ yerine, tek bir güvenilir tarafın (Lancerix) veritabanı seviyesinde uyguladığı bir değiştirilemezlik garantisidir -- ama garantinin kendisi gerçektir, pazarlama süsü değildir.",
        ],
      },
      {
        heading: "Erişim, uygulama kodunda değil veritabanının kendisinde zorunlu kılınır",
        body: [
          "Her tabloda satır seviyesi güvenlik (Row Level Security) açıktır, istisnasız. Bir freelancer yalnızca kendi kayıtlarını, bir müşteri yalnızca kendi kayıtlarını görebilir -- bu kural uygulama kodunun bir sorguyu doğru yazmasına değil, Postgres'in kendisinin her sorguyu bu kurala göre süzmesine dayanır.",
          "Bunun pratik sonucu şu: uygulama katmanında bir yetkilendirme hatası olsa bile (yanlış bir sorgu, unutulmuş bir kontrol), veritabanı yine de yetkisiz bir satırı döndürmez. Yetkilendirme, tek bir yerde, tek bir şekilde uygulanır.",
        ],
      },
      {
        heading: "Kimlik alanları, yazıldıkları anda doğrulanır",
        body: [
          "TCKN (11 haneli) ve VKN (10 haneli) alanları, hem tarayıcıda hem veritabanına yazılırken kendi resmi doğrulama algoritmalarıyla (checksum) kontrol edilir. Rastgele 11 haneli bir sayı sisteme kaydedilemez.",
        ],
      },
    ],
    faqHeading: "Sık sorulanlar",
    faq: [
      {
        q: "Bu bir blokzincir mi?",
        a: "Hayır. Blokzincir, birbirine güvenmeyen çok sayıda tarafın ortak bir kayıt üzerinde anlaşmasını sağlayan dağıtık bir sistemdir. Lancerix'te tek bir güvenilir taraf (Lancerix'in kendi veritabanı) var; değiştirilemezlik garantisi dağıtık konsensüsten değil, o veritabanının kendi erişim kurallarından ve kriptografik özetlerden gelir. Daha basit bir sistemdir, ama gerçek ve doğrulanabilir bir garantidir.",
      },
      {
        q: "Bağımsız bir güvenlik denetiminden geçtiniz mi?",
        a: "Henüz hayır. Bu sayfada anlatılan mimari, şu ana kadar kendi iç disiplinimiz ve kod incelemelerimizle sürdürüldü. Bağımsız bir üçüncü taraf denetimi, Faz 2'nin (gerçek fon saklama) kapsamına girmeden önce atmayı planladığımız somut bir adım.",
      },
      {
        q: "Bu mimari Faz 2'de (escrow) nasıl genişleyecek?",
        a: "Aynı üç ilke -- tam sayı para birimi, tek kapılı durum makinesi, değiştirilemez kayıt defteri -- escrow hesap bakiyeleri için de kullanılacak. Faz 2 yeni bir güven modeli icat etmiyor, Faz 1'de zaten kanıtlanmış olanı gerçek fon hareketine genişletiyor.",
      },
      {
        q: "Kaynak kodu inceleyebilir miyim?",
        a: "Şu an için hayır, kaynak kod kapalı. Bu sayfa, kodu göstermeden mimarinin hangi kararları ve hangi garantileri içerdiğini olabildiğince somut anlatmak için var.",
      },
    ],
    ctaTitle: "Mekanizmayı canlı görmek ister misin?",
    ctaBody:
      "Örnek bir doğrulama raporuna bakabilir ya da doğrudan bir sözleşme oluşturup akışın tamamını deneyebilirsin.",
    ctaPrimary: "Ücretsiz başla",
    ctaSecondary: "Ana sayfaya dön",
    updated: "2026-09-06",
  },
  en: {
    metaTitle: "Trust Architecture — Lancerix",
    metaDescription:
      "What makes a Lancerix verification report trustworthy isn't a promise -- it's concrete architectural decisions enforced at the database level. All of them, here.",
    eyebrow: "TRUST ARCHITECTURE",
    title: "Trust here isn't a promise. It's a set of architectural decisions.",
    intro:
      "\"Trustworthy\" is easy to say. Instead, this page shows exactly why a report can't be edited after the fact, why one account can never see another's data, and why an amount can't quietly vanish to a rounding error -- at the database level.",
    definition:
      "At Lancerix, trust doesn't rest on the application code behaving well -- it rests on Postgres itself refusing certain operations outright: an unauthorized row cannot be read, a signed record cannot be deleted, a monetary amount can never be stored as a decimal. This page walks through where and how each of those constraints is actually enforced.",
    sections: [
      {
        heading: "Money never exists as a decimal, anywhere",
        body: [
          "Every amount is an integer of the smallest currency unit (kuruş), never a float. Rates are stored as basis points (1000 = 10.00%). This removes the classic floating-point failure mode -- 0.1 + 0.2 not quite equaling 0.3 -- from money math entirely.",
          "The platform fee is computed from the amount added on top of what the client pays, not subtracted from the freelancer's earnings; the client's charge and the freelancer's net payout are both derived from one gross amount by subtraction, never by a second percentage calculation -- so the two sides can never end up disagreeing about the total.",
          "This logic isn't written twice in two languages that can drift apart: the TypeScript calculation function and Postgres's own generated columns apply the identical rounding rule (half away from zero) and are checked against each other by automated tests.",
        ],
      },
      {
        heading: "A status can only change through one door",
        body: [
          "A delivery's or a payment milestone's status can change from exactly one database function, never from anywhere in the application code directly. Which status can move to which is defined in its own table; an undefined transition is rejected by the database itself.",
          "That function writes the status change and the ledger row explaining it inside the same database transaction -- a request that fails partway through can never leave a status change with no record of why it happened.",
          "A trigger rejects any status update attempted outside that function -- even a bug in the application code cannot bypass the rule, because the database enforces it independently.",
        ],
      },
      {
        heading: "The ledger is append-only, full stop",
        body: [
          "Every status change and every verification report is written to a permanent ledger. Those tables have no UPDATE or DELETE policy at all -- backed by a separate trigger that blocks it outright. That includes the platform's own admin account.",
          "A verification report's cryptographic digest (SHA-256) is tamper-evident proof of exactly what text that report contained -- if the report were ever \"corrected\" after the fact, the digest would no longer match, and that mismatch is immediately visible. This is not a blockchain: instead of a distributed network, it's an immutability guarantee enforced at the database level by one trusted party (Lancerix) -- but the guarantee itself is real, not a marketing flourish.",
        ],
      },
      {
        heading: "Access is enforced in the database, not the application",
        body: [
          "Row Level Security is on for every table, no exceptions. A freelancer can only see their own records, a client only theirs -- not because the application code happens to write a correct query, but because Postgres itself filters every query against that rule.",
          "The practical effect: even if the application layer had an authorization bug (a wrong query, a missing check), the database still would not return an unauthorized row. Authorization is enforced in exactly one place, exactly one way.",
        ],
      },
      {
        heading: "Identity fields are validated the moment they're written",
        body: [
          "Turkish national ID (11 digits) and tax ID (10 digits) fields are checksum-validated against their official algorithms, both in the browser and again when written to the database. A random 11-digit number cannot be saved into the system.",
        ],
      },
    ],
    faqHeading: "Frequently asked",
    faq: [
      {
        q: "Is this a blockchain?",
        a: "No. A blockchain is a distributed system that lets many mutually-untrusting parties agree on one shared record. Lancerix has one trusted party (its own database); the immutability guarantee comes from that database's own access rules and cryptographic digests, not from distributed consensus. It's a simpler system, but a real and independently verifiable guarantee.",
      },
      {
        q: "Have you had an independent security audit?",
        a: "Not yet. The architecture described on this page has so far been maintained through our own internal discipline and code review. An independent third-party audit is a concrete step we plan to take before Faz 2 (real fund custody) is in scope.",
      },
      {
        q: "How does this architecture extend into Faz 2 (escrow)?",
        a: "The same three principles -- integer-only currency, single-door state machines, an append-only ledger -- carry directly over to escrow account balances. Faz 2 doesn't invent a new trust model; it extends the one already proven in Faz 1 to real fund movement.",
      },
      {
        q: "Can I review the source code?",
        a: "Not at this time -- the source is closed. This page exists to describe, as concretely as possible without the code itself, exactly which decisions and guarantees the architecture contains.",
      },
    ],
    ctaTitle: "Want to see the mechanism live?",
    ctaBody:
      "Look at an example verification report, or set up a contract yourself and try the whole flow.",
    ctaPrimary: "Start free",
    ctaSecondary: "Back to home",
    updated: "2026-09-06",
  },
};
