import type { Locale } from "@/lib/i18n/config";
import type { PublicVerificationRecord } from "@/lib/data/verification-types";

export const SHOWCASE_KUYUMCU_DATA: PublicVerificationRecord = {
  reference: "LCX-2026-85000-KUYUMCU",
  title: "Altın & Döviz Canlı Fiyatlama Motoru ve MASAK AML Uyum Altyapısı",
  projectAmountKurus: 8500000, // 85.000 TL
  status: "ACCEPTED",
  isTacitlyAccepted: true,
  legalBasis: "TBK m. 477 (Zımni Kabul) & HMK m. 193 (Münhasır Delil Sözleşmesi)",
  freelancerName: "Samed Çoban (Lancerix Kurucusu & Kıdemli Sistem Mimarı)",
  clientName: "Altın & Mücevherat E-Ticaret A.Ş. (Yetkili Temsilci)",
  companyName: "Altın & Mücevherat E-Ticaret A.Ş.",
  createdAt: "2026-09-14T09:00:00Z",
  deliveredAt: "2026-10-06T14:30:00Z",
  contractSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  deliverySha256: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
  stagingUrl: "https://staging-api.kuyumcu-demo.com/v1/health",
  proofGuard: {
    httpStatus: 200,
    latencyMs: 138,
    tlsVersion: "TLS 1.3 / HSTS Aktif",
    serverHeader: "Nginx / Linux 6.1 Cloud",
    verifiedAt: "2026-10-06T14:31:12Z",
    uptimePassed: true,
  },
  criteria: [
    {
      id: "c1",
      title: "Canlı Altın & Döviz Fiyatlama Motoru",
      description: "Piyasa API beslemesi saniyelik çekilmeli, kayma toleransı marj dahilinde tutulmalı ve 1000 eşzamanlı sorguda gecikme <250ms olmalı.",
      met: true,
    },
    {
      id: "c2",
      title: "MASAK Kimlik & VKN Doğrulama Motoru",
      description: "10.000 TL üzeri alımlarda kimlik/vergi no doğrulaması yapılmalı, işlem kütükleri değiştirilemez SHA-256 zaman damgalarıyla saklanmalı.",
      met: true,
    },
    {
      id: "c3",
      title: "Sepet Fiyat Kilitleme & 3D Secure Entegrasyonu",
      description: "Ödeme anında kur dalgalanmalarına karşı sepet 180 saniye kilitlenmeli, ödeme ağ geçidi mutabakatı eksiksiz tamamlanmalı.",
      met: true,
    },
    {
      id: "c4",
      title: "Güvenlik, TLS 1.3 & ProofGuard Doğrulaması",
      description: "TLS 1.3 zorunlu kılınmalı, ProofGuard uptime ve erişilebilirlik testlerinden HTTP 200 alınmalı.",
      met: true,
    },
  ],
  signatures: [
    {
      party: "FREELANCER",
      partyLabel: "Yazılım Geliştirici (Samed Çoban)",
      signedAt: "2026-09-14T09:12:44Z",
      signatureHash: "sha256:7a41ef689bc01a4ef...981c",
    },
    {
      party: "CLIENT",
      partyLabel: "İşveren Temsilcisi",
      signedAt: "2026-09-14T11:04:18Z",
      signatureHash: "sha256:3d92fb011ce499ab...22c7",
    },
  ],
};

export interface PrecedentCaseItem {
  id: string;
  slug: Record<Locale, string>;
  amount: string;
  amountKurus: number;
  category: {
    tr: string;
    en: string;
  };
  tag: {
    tr: string;
    en: string;
  };
  isFounderStory?: boolean;
  date: string;
  docketRef: string;
  legalBasis: string;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  keyConflict: Record<Locale, string>;
  resolution: Record<Locale, string>;
  verificationRecord: PublicVerificationRecord;
  faq: Array<{
    q: Record<Locale, string>;
    a: Record<Locale, string>;
  }>;
}

export const SHOWCASE_FINTECH_120K_DATA: PublicVerificationRecord = {
  reference: "LCX-2026-120000-FINTECH",
  title: "Açık Bankacılık & FAST / Havale Mobil SDK Entegrasyonu",
  projectAmountKurus: 12000000, // 120.000 TL
  status: "ACCEPTED",
  isTacitlyAccepted: true,
  legalBasis: "TBK m. 474 (Muayene Külfeti) & HMK m. 193 (Münhasır Delil Sözleşmesi)",
  freelancerName: "Emre T. (Kıdemli Mobile & iOS Architect)",
  clientName: "PaySmart FinTech Çözümleri A.Ş.",
  companyName: "PaySmart FinTech Çözümleri A.Ş.",
  createdAt: "2026-08-10T10:00:00Z",
  deliveredAt: "2026-09-02T16:00:00Z",
  contractSha256: "9a21b476cd8201fa8823758b2e1a3826019a32c25608c028ba491cd3241bc194",
  deliverySha256: "4b87c093a2e389b0274191cfa823485091a4b92c47842601ba908d195f082e61",
  stagingUrl: "https://testflight.apple.com/join/demo-paysmart-sdk",
  proofGuard: {
    httpStatus: 200,
    latencyMs: 165,
    tlsVersion: "TLS 1.3 / Apple StoreKit 2 Ready",
    serverHeader: "Fastlane CI / Xcode 16.0 Build #142",
    verifiedAt: "2026-09-02T16:05:00Z",
    uptimePassed: true,
  },
  criteria: [
    {
      id: "c1",
      title: "iOS & Android TestFlight SDK Derlemesi",
      description: "SDK pod/spm paketleri hatasız derlenmeli, örnek demo uygulamasında FAST transfer testi sıfır crash ile çalışmalı.",
      met: true,
    },
    {
      id: "c2",
      title: "Apple / Google Güvenlik & Sandbox Doğrulaması",
      description: "App Store sandbox testlerinde mTLS 1.3 kimlik doğrulaması ve Keychain token saklama testleri başarıyla geçmeli.",
      met: true,
    },
    {
      id: "c3",
      title: "Zaman Damgalı Build & Teslimat İhbarı",
      description: "TestFlight sürümü işverene yazılı iletilmeli ve 7 günlük TBK 474 muayene penceresi başlatılmalıdır.",
      met: true,
    },
  ],
  signatures: [
    {
      party: "FREELANCER",
      partyLabel: "Yazılımcı (Yüklenici)",
      signedAt: "2026-08-10T10:15:00Z",
      signatureHash: "sha256:88fa12c9103...ee12",
    },
    {
      party: "CLIENT",
      partyLabel: "FinTech İşveren Temsilcisi",
      signedAt: "2026-08-10T14:30:00Z",
      signatureHash: "sha256:44aa0291fc0...339b",
    },
  ],
};

export const SHOWCASE_LOGISTICS_210K_DATA: PublicVerificationRecord = {
  reference: "LCX-2026-210000-LOJISTIK",
  title: "Uluslararası Filo & Rota Optimizasyonu B2B ERP Entegrasyonu",
  projectAmountKurus: 21000000, // 210.000 TL
  status: "ACCEPTED",
  isTacitlyAccepted: true,
  legalBasis: "TBK m. 473 & HMK m. 193 (Kapsam Dışı Ek Taleplerin Ayrıştırılması)",
  freelancerName: "Burak K. (Fullstack Cloud & ERP Lead)",
  clientName: "TransLojistik Uluslararası Taşımacılık Ltd.",
  companyName: "TransLojistik Uluslararası Taşımacılık Ltd.",
  createdAt: "2026-07-01T09:00:00Z",
  deliveredAt: "2026-08-20T11:00:00Z",
  contractSha256: "f1a23847cbb02931a29384759283748293847582910293847582910293847582",
  deliverySha256: "c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01234",
  stagingUrl: "https://erp-staging.translojistik-demo.com/health",
  proofGuard: {
    httpStatus: 200,
    latencyMs: 198,
    tlsVersion: "TLS 1.3 / Enterprise Dedicated",
    serverHeader: "Docker Compose / Go Microservices",
    verifiedAt: "2026-08-20T11:04:12Z",
    uptimePassed: true,
  },
  criteria: [
    {
      id: "c1",
      title: "Gümrük & Konşimento API Eşitlemesi",
      description: "Avrupa gümrük portalı XML/JSON entegrasyonu tamamlanmalı, 500 TIR verisi anlık güncellenmeli.",
      met: true,
    },
    {
      id: "c2",
      title: "Telematik & GPS Rota Hesaplama Motoru",
      description: "Harita üzerinde yakıt optimizasyon algoritması çalışmalı ve rota sapmaları anlık uyarılmalı.",
      met: true,
    },
    {
      id: "c3",
      title: "Kapsam Sözleşmesi & Kriter Sınırı",
      description: "Sözleşme harici 18 yeni istek ek protokol olmadan ana hak edişi bloke edemez.",
      met: true,
    },
  ],
  signatures: [
    {
      party: "FREELANCER",
      partyLabel: "Yazılımcı (Yüklenici)",
      signedAt: "2026-07-01T09:20:00Z",
      signatureHash: "sha256:aa2211bb...9988",
    },
    {
      party: "CLIENT",
      partyLabel: "Lojistik Direktörü",
      signedAt: "2026-07-01T15:00:00Z",
      signatureHash: "sha256:bb3344cc...1122",
    },
  ],
};

export const SHOWCASE_ECOMMERCE_45K_DATA: PublicVerificationRecord = {
  reference: "LCX-2026-45000-ECOMMERCE",
  title: "Özel Tasarım E-Ticaret Otomasyonu & Pazaryeri Senkronizasyonu",
  projectAmountKurus: 4500000, // 45.000 TL
  status: "ACCEPTED",
  isTacitlyAccepted: true,
  legalBasis: "TBK m. 477 Fıkra 1 (Eserin Fiilen Kullanımı Zımni Kabul Hükmündedir)",
  freelancerName: "Zeynep S. (Next.js & Shopify Uzmanı)",
  clientName: "ModaTrend Butik & Tekstil Sanayi",
  companyName: "ModaTrend Butik & Tekstil Sanayi",
  createdAt: "2026-08-15T11:00:00Z",
  deliveredAt: "2026-09-01T15:30:00Z",
  contractSha256: "71829384756abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
  deliverySha256: "1029384756abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
  stagingUrl: "https://modatrend-store.vercel.app/api/health",
  proofGuard: {
    httpStatus: 200,
    latencyMs: 95,
    tlsVersion: "TLS 1.3 / Edge Optimized",
    serverHeader: "Vercel Serverless / Next.js 15",
    verifiedAt: "2026-09-01T15:35:00Z",
    uptimePassed: true,
  },
  criteria: [
    {
      id: "c1",
      title: "Trendyol & Hepsiburada Stok Senkronu",
      description: "Ürün stokları 30 saniye aralıkla pazaryerleri arasında çift yönlü senkronize olmalı.",
      met: true,
    },
    {
      id: "c2",
      title: "Ödeme Ağ Geçidi & İyzico Entegrasyonu",
      description: "Kredi kartı ile başarılı ödeme akışı ve anlık e-fatura tetiklemesi eksiksiz çalışmalı.",
      met: true,
    },
    {
      id: "c3",
      title: "Canlı Yayında Fiili Kullanım Denetimi",
      description: "Sitenin canlıya alınıp sipariş toplaması eserin fiilen kabulü sayılır; estetik bahane ile iade istenemez.",
      met: true,
    },
  ],
  signatures: [
    {
      party: "FREELANCER",
      partyLabel: "Yazılımcı (Yüklenici)",
      signedAt: "2026-08-15T11:25:00Z",
      signatureHash: "sha256:ff9988aa...0011",
    },
    {
      party: "CLIENT",
      partyLabel: "Butik Sahibi",
      signedAt: "2026-08-15T16:10:00Z",
      signatureHash: "sha256:ee7766bb...2233",
    },
  ],
};

export const PRECEDENT_CASES: PrecedentCaseItem[] = [
  {
    id: "85k-kuyumculuk-tahkim",
    slug: {
      tr: "/vaka/85k-kuyumculuk-tahkim",
      en: "/en/case-study/85k-arbitration",
    },
    amount: "85.000 ₺",
    amountKurus: 8500000,
    category: {
      tr: "FinTech & Kurumsal API",
      en: "FinTech & Enterprise API",
    },
    tag: {
      tr: "KURUCUNUN GERÇEK VAKASI",
      en: "FOUNDER'S OWN CASE",
    },
    isFounderStory: true,
    date: "14 Ekim 2026",
    docketRef: "LCX-2026-85000-KUYUMCU",
    legalBasis: "TBK m. 477 (Zımni Kabul) & HMK m. 193",
    title: {
      tr: "85.000 ₺ Kapalıçarşı Kuyumculuk & MASAK Uyuşmazlığı — Lancerix'i Doğuran Yangın",
      en: "85,000 ₺ Grand Bazaar Jewelry & MASAK Arbitration — The Fire That Built Lancerix",
    },
    summary: {
      tr: "Lancerix kurucusu Samed Çoban'ın birebir yaşadığı uyuşmazlık: Kapalıçarşı kuyumcusu için canlı WebSocket altın kuru motoru ve MASAK AML altyapısı geliştirildi. Staging'e hatasız teslim edildikten sonra işveren 7 gün sessiz kaldı, ardından 'Altın düştü, tasarımı beğenmedik' diyerek faturayı ödemedi. Lancerix TBK m. 477 ve HMK m. 193 delil kalkanıyla 85.000 ₺ kuruşu kuruşuna tahsil edildi.",
      en: "The lived experience of Lancerix founder Samed Çoban: Live WebSocket gold rates and MASAK AML API delivered with zero errors. After 7 days of silence, the client claimed 'Gold prices fluctuated and we dislike the design' to evade invoice payment. TBK Art. 477 and HMK Art. 193 evidence seals secured the entire 85,000 ₺ fee.",
    },
    keyConflict: {
      tr: "İşveren 7 günlük yasal muayene süresince tek bir teknik kusur bildirmedi; ödeme günü gelince sübjektif estetik bahanelerle sözleşmeyi feshetmeye kalkıştı.",
      en: "The client logged zero technical defects during the 7-day statutory review window, then cited subjective aesthetic excuses at payout deadline to cancel the contract.",
    },
    resolution: {
      tr: "ProofGuard SHA-256 zaman damgalı HTTP 200/TLS 1.3 logları ve 7 günlük sessizliğin TBK m. 477 gereği eseri zımnen kabul ettirdiği ispatlandı. Tahkim heyeti 85.000 ₺'nin derhal ödenmesine hükmetti.",
      en: "ProofGuard cryptographic timestamps proved HTTP 200 uptime, and silence triggered statutory acceptance under Art. 477. The tribunal ordered immediate release of 85,000 ₺.",
    },
    verificationRecord: SHOWCASE_KUYUMCU_DATA,
    faq: [
      {
        q: {
          tr: "Müşteri 'tasarımı beğenmedim' diyerek sözleşmeyi tek taraflı feshedebilir mi?",
          en: "Can a client unilaterally cancel a contract citing 'we dislike the design'?",
        },
        a: {
          tr: "Hayır. TBK m. 477 ve Yargıtay yerleşik içtihatlarına göre, objektif kabul kriterleri karşılanan ve süresinde kusur bildirimi yapılmayan yazılım eserlerinde sübjektif estetik bahaneler fesih sebebi olamaz.",
          en: "No. Under Turkish Code of Obligations Art. 477, subjective aesthetic dislike is not grounds for cancellation once objective criteria are met and the inspection deadline lapses.",
        },
      },
      {
        q: {
          tr: "Lancerix'in SHA-256 damgalı telemetri raporu Türk mahkemelerinde delil sayılır mı?",
          en: "Does Lancerix's SHA-256 sealed telemetry report qualify as valid legal evidence in Turkish courts?",
        },
        a: {
          tr: "Evet. 6100 sayılı HMK m. 193 (Delil Sözleşmesi) gereğince tarafların sözleşmede kabul ettiği dijital loglar ve Lancerix doğrulama raporları münhasır delil teşkil eder.",
          en: "Yes. Under Civil Procedure Law Art. 193 (Evidence Agreement), cryptographic logs and verification records stipulated in the contract constitute binding exclusive evidence.",
        },
      },
    ],
  },
  {
    id: "120k-fintech-mobil-app",
    slug: {
      tr: "/vaka/120k-fintech-mobil-app",
      en: "/en/case-study/120k-fintech-mobile-app",
    },
    amount: "120.000 ₺",
    amountKurus: 12000000,
    category: {
      tr: "Mobil Uygulama & FinTech",
      en: "Mobile App & FinTech",
    },
    tag: {
      tr: "APP STORE GECİKMESİ BAHANESİ",
      en: "APP STORE DELAY EXCUSE",
    },
    isFounderStory: false,
    date: "02 Eylül 2026",
    docketRef: "LCX-2026-120000-FINTECH",
    legalBasis: "TBK m. 474 (Muayene Külfeti) & HMK m. 193",
    title: {
      tr: "120.000 ₺ FinTech Mobil Uygulama — 'Apple Onayı Gecikti, Fatura Ödenmez' Uyuşmazlığı",
      en: "120,000 ₺ FinTech Mobile SDK — 'Apple Store Review Delayed, Won't Pay' Dispute",
    },
    summary: {
      tr: "Mobil yazılımcı açık bankacılık ve FAST para transferi SDK'sını eksiksiz geliştirip TestFlight üzerinden canlıya teslim etti. İşveren, Apple'ın 14 günlük inceleme sürecini yazılımcının hatası gibi göstererek faturayı 45 gün ödemedi. Lancerix CI/CD build mührü ile Apple gecikmesinin yazılımcıya yüklenemeyeceği kanıtlandı.",
      en: "The mobile engineer developed and delivered the open banking FAST transfer SDK via TestFlight. The client attempted to blame Apple's 14-day app review latency on the developer, freezing the invoice for 45 days. Lancerix's sealed CI/CD build proved developer delivery was pristine.",
    },
    keyConflict: {
      tr: "İşveren 3. taraf platformların (Apple App Store / Google Play) inceleme gecikmesini yazılımcının eseri teslim etmemesi gibi gösterip hakedişi bloke etti.",
      en: "The client treated third-party app store review turnaround times as a delivery default by the contractor to block payment.",
    },
    resolution: {
      tr: "Sözleşmedeki kabul kriterinin 'TestFlight derlemesi ve Sandbox testi' olduğu, mağaza onayının münhasır geliştirici sorumluluğu olmadığı Lancerix delil kaydıyla belgelendi. 120.000 ₺ derhal serbest bırakıldı.",
      en: "The evidentiary ledger established that the contract benchmark was TestFlight deployment, not external store approval. Full 120,000 ₺ funds were awarded to the engineer.",
    },
    verificationRecord: SHOWCASE_FINTECH_120K_DATA,
    faq: [
      {
        q: {
          tr: "Apple veya Google'ın inceleme gecikmesi yazılımcının sorumluluğunda mıdır?",
          en: "Is the contractor liable for Apple or Google app store review delays?",
        },
        a: {
          tr: "Hayır. Sözleşmede teslimat kriteri TestFlight/Sandbox olarak belirlenmişse, mağaza moderatörlerinin inceleme takvimi mücbir ve harici bir süreçtir.",
          en: "No. If acceptance criteria specify TestFlight/Sandbox delivery, store moderator timelines are independent external processes outside the developer's SLA.",
        },
      },
    ],
  },
  {
    id: "210k-lojistik-erp-kapsam",
    slug: {
      tr: "/vaka/210k-lojistik-erp-kapsam",
      en: "/en/case-study/210k-logistics-erp-scope",
    },
    amount: "210.000 ₺",
    amountKurus: 21000000,
    category: {
      tr: "Kurumsal B2B & ERP",
      en: "Enterprise B2B & ERP",
    },
    tag: {
      tr: "KAPSAM ŞANTAJI (SCOPE CREEP)",
      en: "SCOPE CREEP BLACKMAIL",
    },
    isFounderStory: false,
    date: "20 Ağustos 2026",
    docketRef: "LCX-2026-210000-LOJISTIK",
    legalBasis: "TBK m. 473 & HMK m. 193 (Kapsam Ayrıştırması)",
    title: {
      tr: "210.000 ₺ Lojistik ERP Entegrasyonu — '18 Yeni Özellik Yapmazsan Hak Edişi Yakacağız' Kapsam Şantajı",
      en: "210,000 ₺ Logistics ERP Integration — 'Build 18 Extra Features or Forfeit Pay' Scope Blackmail",
    },
    summary: {
      tr: "500 araçlık filo ve gümrük portalı entegrasyonu tamamlandı. İşveren teslimat toplantısında 'Bunlar zaten olması gereken şeylerdi' diyerek sözleşme dışı 18 yeni istek dayattı ve ana hak edişi bloke etti. Lancerix kriter matrisi ile ek talepler ayrıştırıldı, 210.000 ₺ ana bedel kuruşu kuruşuna kurtarıldı.",
      en: "Fleet logistics and customs API integration completed for 500 trucks. At handover, the client demanded 18 uncontracted feature additions under threat of non-payment. Lancerix's criteria matrix isolated scope creep, protecting the full 210,000 ₺ fee.",
    },
    keyConflict: {
      tr: "İşveren proje bittikten sonra sözleşme kapsamına dahil olmayan 18 ek özellik talep etti ve yapılması zorunluymuş gibi hak edişi rehin tuttu.",
      en: "The employer demanded 18 new out-of-scope features after project completion, holding the milestone payment hostage.",
    },
    resolution: {
      tr: "Lancerix'in dijital kabul kriteri tablosu HMK m. 193 gereğince bağlayıcı sayıldı. Ek isteklerin yeni bir ek protokole tabi olduğu, ana sözleşmenin eksiksiz ifa edildiği tescillendi. 210.000 ₺ ödendi.",
      en: "The sealed acceptance criteria table was deemed legally binding. Additional requests were classified as separate revisions, and the 210,000 ₺ baseline fee was fully released.",
    },
    verificationRecord: SHOWCASE_LOGISTICS_210K_DATA,
    faq: [
      {
        q: {
          tr: "Müşterinin 'bu özellik de olmalıydı' diyerek ödemeyi tutması hukuki midir?",
          en: "Can a client hold back payment claiming 'this feature should have been included'?",
        },
        a: {
          tr: "Hayır. Eser sözleşmesinde yüklenicinin borcu sözleşmede ve teknik şartnamede yazılı olan edimlerdir. Kapsam dışı istekler için ek bütçe ve süre gerekir.",
          en: "No. Under contract law, the developer's obligation is strictly defined by the agreed specifications. Out-of-scope requests require separate quotes and timelines.",
        },
      },
    ],
  },
  {
    id: "45k-e-ticaret-otomasyon",
    slug: {
      tr: "/vaka/45k-e-ticaret-otomasyon",
      en: "/en/case-study/45k-ecommerce-automation",
    },
    amount: "45.000 ₺",
    amountKurus: 4500000,
    category: {
      tr: "E-Ticaret & Pazaryeri",
      en: "E-Commerce & Marketplace",
    },
    tag: {
      tr: "FİİLİ KULLANIM ZIMNİ KABULÜ",
      en: "DE FACTO ACCEPTANCE",
    },
    isFounderStory: false,
    date: "01 Eylül 2026",
    docketRef: "LCX-2026-45000-ECOMMERCE",
    legalBasis: "TBK m. 477 Fıkra 1 (Fiilen Kullanılan Eser Kabul Edilmiştir)",
    title: {
      tr: "45.000 ₺ E-Ticaret Otomasyonu — Canlıda 14 Gün Satış Yapıp Ciro Aldıktan Sonra 'Beğenmedim, İade Et' İddiası",
      en: "45,000 ₺ E-Commerce Automation — 14 Days of Live Sales, Then 'We Dislike It, Refund' Dispute",
    },
    summary: {
      tr: "Butik tekstil firması Next.js tabanlı özel e-ticaret sitesini ve pazaryeri entegrasyonunu canlıya alıp 14 gün boyunca 850 sipariş ve ciro topladı. Ardından 'Tasarım beklentimizi karşılamadı, sözleşmeyi feshediyoruz' diyerek ücret iadesi istedi. Sitenin fiilen kullanıldığı kanıtlanarak TBK m. 477 uyarınca itiraz çürütüldü.",
      en: "A boutique retailer deployed the custom Next.js e-commerce engine, processing 850 live orders over 14 days. They subsequently claimed 'The layout underperformed our taste, refund our fees.' Proof of de facto commercial usage under Art. 477 defeated the refund demand.",
    },
    keyConflict: {
      tr: "İşveren sistemi 2 hafta boyunca ticari kazanç elde etmek için kullandıktan sonra estetik gerekçelerle parayı iade almaya kalkıştı.",
      en: "The client operated the platform for commercial gain for two weeks, then demanded a refund citing subjective aesthetic dissatisfaction.",
    },
    resolution: {
      tr: "Eserin ticari olarak fiilen kullanılması TBK m. 477 fıkra 1 uyarınca açık zımni kabul hükmündedir. Delil dosyası ile sitenin aktif ciro topladığı kanıtlandı, işverenin iade talebi reddedildi.",
      en: "Commercial operation constitutes de facto statutory acceptance under TBK Art. 477. Evidence proved active live revenue collection, dismissing the refund claim.",
    },
    verificationRecord: SHOWCASE_ECOMMERCE_45K_DATA,
    faq: [
      {
        q: {
          tr: "Müşteri yazılımı canlıya alıp kullandıktan sonra 'beğenmedim' diyerek parayı geri alabilir mi?",
          en: "Can a client demand a refund citing dislike after running the software in production?",
        },
        a: {
          tr: "Hayır. Yargıtay Hukuk Genel Kurulu kararlarına göre, teslim edilen yazılımı ticari faaliyetinde fiilen kullanan işveren, eseri zımnen kabul etmiş sayılır; estetik iade hakkı düşer.",
          en: "No. Turkish Supreme Court jurisprudence firmly holds that putting delivered software into commercial production constitutes statutory tacit acceptance.",
        },
      },
    ],
  },
];

export function getPrecedentCaseById(id: string): PrecedentCaseItem | undefined {
  return PRECEDENT_CASES.find((c) => c.id === id);
}

export function getPrecedentCaseBySlug(slug: string, locale: Locale): PrecedentCaseItem | undefined {
  return PRECEDENT_CASES.find((c) => c.slug[locale] === slug || c.slug.tr === slug || c.slug.en === slug);
}
