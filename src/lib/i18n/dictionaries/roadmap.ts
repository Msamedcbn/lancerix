import type { Locale } from "@/lib/i18n/config";

/**
 * The roadmap page. Version badges (v0.1, v1.0, v2.0) stay as they are in both
 * languages -- they are release identifiers, not prose.
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
    metaTitle: "Yol Haritası ve Özellikler - Lancerix",
    metaDescription: "Lancerix'in dünden bugüne yolculuğu ve gelecekteki hedefleri.",
    heading: "Aracı Değil, Bağımsız Hakemiz",
    intro:
      "Paranızı esir almıyor veya fahiş kesintiler yapmıyoruz. Sadece %10 hizmet bedeliyle projeyi test eden ve sonucu şeffafça raporlayan tarafsız bir hakemiz. İşte Lancerix'in dünden bugüne ve yarına uzanan yolculuğu.",
    past: {
      title: "Nerede Başladık?",
      body: "Sektördeki mevcut platformlar ya yüksek komisyonlarla hem freelancerları hem de müşterileri mağdur ediyor ya da parayı escrow hesaplarında esir alarak süreci hantallaştırıyordu. Adil bir sisteme, gerçek bir bağımsız hakeme ihtiyaç vardı.",
      problemsHeading: "Eski Sorunlar",
      problems: [
        "%20'leri bulan fahiş komisyonlar",
        "Paranın uzun süre içeride kilitli kalması",
        "Kalite denetiminin hiç yapılmaması",
      ],
    },
    present: {
      title: "Neredeyiz?",
      bodyBefore:
        "Bugün Lancerix, paranıza el koymayan, aracı değil tarafsız bir ",
      bodyStrong: "hakem",
      bodyAfter:
        " olarak konumlanıyor. Dünyanın her yerinden ekipler Lancerix'i kullanarak projelerinin sözleşmeye uygunluğunu bağımsız mühendislere test ettiriyor.",
      costTitle: "Şeffaf Maliyet",
      costBody:
        "Hiçbir gizli ücret yok. Sadece alıcıdan tahsil edilen sabit %10 hizmet bedeli karşılığında test yapıyoruz.",
      reportsTitle: "Değiştirilemez Raporlar",
      reportsBody:
        "Proje teslimatları kabul kriterlerine göre QA uzmanları tarafından denetlenir ve blokzincir benzeri şifrelenmiş kayıtlarla güvence altına alınır.",
    },
    future: {
      title: "Gelecek Planlarımız",
      body: "Platformu adım adım, sağlam temeller üzerine inşa ediyoruz. Gelecek sürümlerde Lancerix'i sadece bir denetim platformu olmaktan çıkarıp, tüm sürecin uçtan uca güvenle yönetildiği global bir standarda dönüştüreceğiz.",
      nowBadge: "Mevcut (v0.1)",
      nowTitle: "Bağımsız QA ve Kod Doğrulama",
      nowBody:
        "Şu anki açık beta sürümümüzde; paraya dokunmadan, sözleşme ve hakemlik altyapısı için sadece %10 komisyon alıyoruz. İhtiyaç duyduğunuz QA doğrulama ve kod test süreçleri ise bütçenize göre seçebileceğiniz paketlerle ayrıca fiyatlandırılır.",
      launchBadge: "İlk Çıkış (v1.0)",
      launchTitle: "Otonom Test ve AI Hakemler",
      launchBody:
        "Resmi sürümümüzle birlikte yapay zeka destekli otonom test araçlarını devreye alacağız. Kod analizi ve otomatik görsel testlerle manuel eforu sıfırlayıp, anında tartışmasız uyuşmazlık çözümleri sunacağız.",
      targetBadge: "Hedef (v2.0)",
      targetTitle: "Güvenli Ödeme (Escrow) Altyapısı",
      targetBodyBefore:
        "Bağımsız denetim güvenini kanıtladıktan sonra, v2 ile birlikte tamamen kendi altyapımızla ",
      targetBodyStrong: "Escrow (Güvenli Hesap)",
      targetBodyAfter:
        " sistemini getireceğiz. Para içeride güvenle tutulacak ve yalnızca başarılı QA raporu çıktığında serbest bırakılacak.",
    },
  },
  en: {
    metaTitle: "Roadmap and features — Lancerix",
    metaDescription: "Where Lancerix came from, where it stands today, and where it is going.",
    heading: "A referee, not a middleman",
    intro:
      "We do not hold your money hostage or take a punishing cut. For a flat 10% service fee we test the project and report the result transparently, with no stake in either side. Here is where Lancerix came from and where it is going.",
    past: {
      title: "Where we started",
      body: "The platforms already out there either squeezed both freelancers and clients with high commissions, or held the money hostage in escrow accounts and made the whole process sluggish. What was missing was a fair system with a genuinely independent referee.",
      problemsHeading: "The old problems",
      problems: [
        "Commissions reaching 20%",
        "Money locked away for months",
        "No quality review at all",
      ],
    },
    present: {
      title: "Where we are",
      bodyBefore: "Today Lancerix sits as a neutral ",
      bodyStrong: "referee",
      bodyAfter:
        " rather than a middleman, and never takes custody of your money. Teams around the world use it to have independent engineers test whether a project actually matches the contract.",
      costTitle: "Transparent cost",
      costBody:
        "No hidden charges. We run the verification for a flat 10% service fee, charged to the client and to nobody else.",
      reportsTitle: "Reports that cannot be edited",
      reportsBody:
        "Deliveries are audited by QA specialists against the acceptance criteria, then sealed with cryptographic, blockchain-style records.",
    },
    future: {
      title: "What comes next",
      body: "We are building this one solid layer at a time. In the releases ahead, Lancerix stops being only an audit platform and becomes a global standard for running the whole handover process safely, end to end.",
      nowBadge: "Current (v0.1)",
      nowTitle: "Independent QA and code verification",
      nowBody:
        "In the current open beta we never touch the money: the 10% covers the contract and arbitration infrastructure only. QA verification and code testing are priced separately, through tiers you pick to fit your budget.",
      launchBadge: "First release (v1.0)",
      launchTitle: "Autonomous testing and AI referees",
      launchBody:
        "With the official release we bring AI-driven autonomous test tooling online. Code analysis and automated visual testing cut the manual effort to zero and settle disputes on the spot.",
      targetBadge: "Target (v2.0)",
      targetTitle: "Escrow payment infrastructure",
      targetBodyBefore:
        "Once independent verification has earned its trust, v2 brings ",
      targetBodyStrong: "escrow",
      targetBodyAfter:
        " on infrastructure that is entirely our own. Funds are held safely and released only when a QA report comes back clean.",
    },
  },
};
