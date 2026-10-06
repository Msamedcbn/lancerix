export interface CriteriaPresetItem {
  id: string;
  description: string;
}

export interface CriteriaPreset {
  id: string;
  category: string;
  title: string;
  description: string;
  badge: string;
  items: CriteriaPresetItem[];
}

export const CRITERIA_PRESETS: CriteriaPreset[] = [
  {
    id: "fintech-ecommerce",
    category: "E-Ticaret & Fintek",
    title: "E-Ticaret, Altın & Fintek Altyapısı",
    description: "Canlı kur motoru, MASAK/AML uyumluluğu, ödeme ağ geçidi ve sepet SLA standartları.",
    badge: "TBK 474 Koruma Paketi",
    items: [
      {
        id: "fin-1",
        description: "Canlı altın/döviz API kur besleme motoru saniyede bir güncellenmeli ve fiyat kayması (slippage) marjı sözleşme limitlerinde çalışmalıdır.",
      },
      {
        id: "fin-2",
        description: "MASAK mevzuatı gereği kullanıcı kimlik/VKN doğrulaması, şüpheli işlem logları ve işlem zaman damgaları değiştirilemez formatta kaydedilmelidir.",
      },
      {
        id: "fin-3",
        description: "Sepet hesaplama, sepet kilit mekanizması ve banka/ödeme ağ geçidi 3D Secure akışı sipariş onayıyla birlikte başarıyla tamamlanmalıdır.",
      },
      {
        id: "fin-4",
        description: "Sunucu ve API uç noktaları SSL TLS 1.3, HTTPS zorunluluğu ve modern HTTP güvenlik başlıkları (HSTS, CSP) standartlarını karşılamalıdır.",
      },
    ],
  },
  {
    id: "saas-web",
    category: "SaaS & Web Uygulaması",
    title: "Modern Web & SaaS Platformu",
    description: "Responsive tasarım, auth akışları, sayfa yükleme performansı ve temel güvenlik hijyeni.",
    badge: "Genel Web Standardı",
    items: [
      {
        id: "web-1",
        description: "Tüm sayfalar Chrome, Safari, Edge ve mobil cihazlarda kırılma olmadan responsive (duyarlı) render edilmelidir.",
      },
      {
        id: "web-2",
        description: "Kullanıcı kayıt, e-posta doğrulama, güvenli giriş (JWT/Session) ve şifre sıfırlama iş akışları eksiksiz çalışmalıdır.",
      },
      {
        id: "web-3",
        description: "Staging/canlı test ortamı 7 gün boyunca %99.5 erişilebilir olmalı, sunucu 500 hatası üretmemeli ve FCP yükleme süresi 2.5 saniyenin altında kalmalıdır.",
      },
      {
        id: "web-4",
        description: "Kullanıcı profil verileri, veri güncelleme formları ve veritabanı CRUD işlemleri veri kaybı olmaksızın doğrulanmalıdır.",
      },
    ],
  },
  {
    id: "api-backend",
    category: "Backend & API",
    title: "REST API & Mikroservis Mimarisi",
    description: "JSON şema uyumluluğu, yanıt süresi (p95 SLA), rol tabanlı yetkilendirme ve hata standartları.",
    badge: "Teknik Mimari",
    items: [
      {
        id: "api-1",
        description: "Tüm API uç noktaları OpenAPI/Swagger şemasına uygun HTTP durum kodları (200, 201, 400, 401, 403, 404) ve JSON gövdeleri döndürmelidir.",
      },
      {
        id: "api-2",
        description: "API p95 yanıt süresi normal yük altında 300ms altında olmalı ve veritabanı sorguları indekslenmiş olmalıdır.",
      },
      {
        id: "api-3",
        description: "Rol tabanlı erişim kontrolü (RBAC) ile yetkisiz kullanıcıların korumalı kaynaklara erişimi kesin olarak engellenmelidir.",
      },
      {
        id: "api-4",
        description: "Girdi doğrulama (Input Validation) ve SQL Injection / NoSQL Injection güvenlik testleri sıfır zafiyetle geçmelidir.",
      },
    ],
  },
  {
    id: "mobile-integration",
    category: "Mobil & Çoklu Platform",
    title: "Mobil Uygulama & Entegrasyon",
    description: "iOS & Android uyumluluğu, offline senkronizasyon, bildirim akışları ve mağaza gereksinimleri.",
    badge: "Cross-Platform",
    items: [
      {
        id: "mob-1",
        description: "Uygulama hem iOS hem de Android test cihazlarında çökme (crash) raporu üretmeden başlatılmalı ve ana akışlar tamamlanmalıdır.",
      },
      {
        id: "mob-2",
        description: "Anlık bildirim (Push Notification) teslimatı cihaz bazında başarıyla tetiklenmeli ve tıklamayla ilgili sayfaya yönlendirmelidir.",
      },
      {
        id: "mob-3",
        description: "İnternet kesintisi durumunda kullanıcıya bilgilendirici arayüz gösterilmeli ve bağlantı geldiğinde veri kaybı olmadan senkronize olunmalıdır.",
      },
    ],
  },
];
