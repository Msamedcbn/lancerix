/**
 * Lancerix's own terms, accepted by each party at signing time.
 *
 * This is a different agreement from the contract itself: the contract is
 * between the freelancer and the client, these terms are between each party
 * and the platform. Both get recorded at the same moment because that is the
 * moment the user is actually agreeing to anything.
 *
 * TERMS_VERSION is stored on the signature row. Bump it whenever the text
 * below changes materially, so an old signature keeps pointing at the terms
 * that were actually on screen rather than silently inheriting new ones.
 *
 * LEGAL: this text has not been reviewed by a lawyer. Have it reviewed
 * before anyone outside the team signs against it -- same standing caveat as
 * the contract body in document.ts.
 */
export const TERMS_VERSION = "2026-09-01";

export type TermsSection = { heading: string; body: string[] };

export const TERMS_SECTIONS: TermsSection[] = [
  {
    heading: "Lancerix ne yapar",
    body: [
      "Lancerix, freelancer ile işveren arasındaki sözleşmeyi kayda alır, teslimi sözleşmede yazan kabul kriterlerine karşı teknik olarak doğrular ve sonucu zaman damgalı bir rapora yazar.",
      "Platform, taraflar arasındaki işin kendisinin tarafı değildir. İşi yapan freelancer, işi alan işverendir.",
    ],
  },
  {
    heading: "Lancerix ne yapmaz",
    body: [
      "Para tutmaz, tahsil etmez, aktarmaz. Ödeme taraflar arasında doğrudan, bu platformun dışında gerçekleşir.",
      "Fatura veya serbest meslek makbuzu kesmez. Vergisel yükümlülükler taraflara aittir.",
      "Yazılım garantisi vermez. Doğrulama, yalnızca sözleşmede yazılı kabul kriterlerinin karşılanıp karşılanmadığına bakar; güvenlik denetimi veya hatasızlık taahhüdü değildir.",
    ],
  },
  {
    heading: "Doğrulama ve sorumluluk sınırı",
    body: [
      "Doğrulama raporu, sözleşmede tanımlanan kriterlerin test edildiği andaki durumunu gösterir. Raporun olumlu olması, teslim edilen işte hiçbir eksik veya hata bulunmadığı anlamına gelmez.",
      "Lancerix'in bu hizmetten doğan sorumluluğu, ilgili doğrulama için tahsil edilen ücretle sınırlıdır. Dolaylı zararlardan, kâr kaybından veya iş kaybından sorumlu tutulamaz.",
    ],
  },
  {
    heading: "Sessizlik kabul sayılır",
    body: [
      "Teslim müşterinin kontrolüne açıldığında sözleşmede yazan kontrol süresi başlar. Müşteri bu süre içinde gerekçeli itiraz etmez ve onay da vermezse, teslim sözleşme uyarınca kabul edilmiş sayılır ve bu kabul zaman damgasıyla kayda geçer.",
      "Bu hüküm, işin belirsiz süreyle onay beklemesini önlemek için vardır ve sözleşmeyi imzalayan her iki tarafça kabul edilir.",
    ],
  },
  {
    heading: "Kayıt",
    body: [
      "İmzalar, teslimler, doğrulama sonuçları, onaylar ve süre aşımıyla oluşan kabuller; zaman damgası ve belge özeti ile birlikte değiştirilemez bir kayıt defterinde tutulur.",
      "Taraflar bu kaydın, aralarındaki uyuşmazlıkta delil niteliği taşıdığını kabul eder.",
    ],
  },
  {
    heading: "Hesap ve kullanım",
    body: [
      "Hesap bilgilerinin gizliliğinden ve hesabı üzerinden yapılan işlemlerden kullanıcı sorumludur.",
      "Platform, bu şartları ihlal eden hesapları askıya alabilir. Askıya alma, o ana kadar oluşmuş kayıtları silmez.",
    ],
  },
];

/** The same text as one plain string, for embedding or hashing. */
export function renderTermsText(): string {
  return TERMS_SECTIONS.map(
    (s) => `${s.heading.toUpperCase()}\n${s.body.map((p) => `  ${p}`).join("\n\n")}`,
  ).join("\n\n");
}
