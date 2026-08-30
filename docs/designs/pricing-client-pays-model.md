# Karar: Hizmet bedelini kurumsal müşteri öder

Kaynak: `/plan-ceo-review` · 2026-08-30 · Branch: master · Mod: HOLD SCOPE
Durum: UYGULANDI (2026-08-30) — şema hosted Supabase'e henüz push edilmedi
Oran revizyonu: %7 → %10 (2026-08-30, rakip fiyat kanıtı üzerine)
İlgili: [escrow-prefunding-concierge-test.md](escrow-prefunding-concierge-test.md)

## Problem

Mevcut model komisyonu proje brütünden kesiyor: %15 platform + brütün kalanından
%20 stopaj. 10.000 TL'lik bir aşamada freelancerın eline 6.800 TL geçiyor.

Bu rakamın 2.000 TL'si stopaj — platform olsun olmasın kesilir ve yıllık beyanda
mahsup edilir, yani maliyet değil vergi peşinatıdır. Gerçek platform maliyeti
1.500 TL, brütün %15'i.

Karşılığında satılan tek şey zamandır: 60-90 günlük gecikmenin ortadan kalkması.
Bunun ekonomik tavanı paranın zaman değeridir; TRY ticari kredi maliyeti yıllık
%45-55 bandındayken 75 gün yaklaşık %9-11 eder. **%15, satılan faydanın
üzerinde fiyatlanmıştı.**

İki destekleyici gözlem:

- Tasarım dokümanındaki finansman testi freelancerlara "96% bugün mü, 100% 75
  gün sonra mı?" diye soruyor — yani aynı zaman faydası için %4. Üründe %15
  almak kendi test tasarımıyla çelişiyordu.
- %10-20 bandı marketplace fiyatıdır (Upwork %10, Fiverr %20) ve **müşteriyi
  onlar getirdiği için** savunulabilir. Burada müşteriyi freelancer getiriyor.
  Doğru kıyas Escrow.com: %0,89-3,25.

## Karar

Hizmet bedeli freelancerın brütünden **kesilmez**, brütün **üstüne eklenir** ve
kurumsal müşteri tarafından ödenir.

```
ClientCharge     = Gross + PlatformFee      (müşterinin yatırdığı)
PlatformFee      = Gross * feeRate
FreelancerGross  = Gross                    (kesinti yok)
FreelancerNet    = Gross - Stopaj
```

Korunması gereken özdeşlikler:

- `ClientCharge - PlatformFee == Gross` (tanım gereği tam)
- `Stopaj + FreelancerNet == Gross` (çıkarma ile türetilir, ikinci yüzde yok)

10.000 TL'lik aşamada, %10 oranla:

| Kalem | Tutar |
|---|---|
| Müşterinin yatırdığı | 11.000 |
| Platform hizmet bedeli | 1.000 |
| Freelancer sözleşme bedeli (SMM matrahı) | 10.000 |
| Stopaj (%20) | 2.000 |
| **Freelancerın eline geçen** | **8.000** |

Freelancer, platformsuz T+90'da alacağı tutarın **aynısını** teslimde alır.

## Kararlar ve gerekçeleri

| # | Karar | Seçilen | Gerekçe |
|---|---|---|---|
| F1 | Şema semantiği | `gross` = freelancer bedeli, `client_charge_kurus` generated eklenir | SMM matrahı ile şemadaki `gross` birebir aynı olur; vergi tarafıyla çeviri gerekmez |
| F8 | Oran | %10 tek oran, PSP dahil | Önce %7 seçildi; rakip kanıtı üzerine %10'a çekildi (aşağı bakınız) |
| F3 | Kupon | Şimdilik devre dışı | D'de oran indirimi müşteriye indirim demek; anlamı belirsizleşen mekanizma kullanılmamalı |
| F4 | Küçük tutarlar | Minimum aşama tutarı (500 TL) | `fee = gross * bps` özdeşliğine dokunmadan sıfır-ücretli işlemi imkansız kılar |

## Rakip kanıtı — jobtogo.co (2026-08-30)

Türkiye'de faaliyette olan bir oyuncu, **birebir aynı mimariyi** kuruyor. Kendi SSS
metinlerinden: "Freelancerlardan herhangi bir komisyon almıyoruz. Bunun yerine,
komisyonu müşteriye yansıtarak freelancerlerin kazancını koruma altına alıyoruz.
Freelancerın hizmet bedeli üzerinden **%10 komisyon** yansıtılmaktadır ve müşteriye
tek bir fatura iletilmektedir."

Üç sonuç:

1. **Mimari doğrulandı.** Müşterinin ödediği model teorik değil; Türkiye'de satılıyor.
   "Müşteriye tek fatura" ifadesi, aşağıdaki açık hukuki sorunun aracılık yapısıyla
   çözülebildiğine dair canlı bir örnek de veriyor.
2. **Piyasa fiyatı %10.** Bizim %7'miz sebepsiz yere altındaydı; oran %10'a çekildi.
3. **Ama asıl kısıt fiyat değil, hacim.** Yayınladıkları rakamlar: aylık 2,5M ₺ işlem
   hacmi (yıllık ~30M ₺), 1 yılda 725 tamamlanmış proje, 12.000+ freelancer havuzu,
   500+ şirket. %10 komisyonla yıllık brüt gelirleri ~3M ₺ — ve bunu bizde olmayan bir
   marketplace'le yapıyorlar. Oranı %7'den %10'a çekmek geliri 1,4 katına çıkarır;
   yatırım alınabilir bir gelir çizgisine mesafe bundan çok daha büyüktür. **Ölçek
   sorusunun cevabı fiyatlamada değil.**

Ortalama proje büyüklükleri ~41 bin ₺ (30M / 725), ki bu dokümanın 20-80k varsayımını
doğruluyor.

**Rekabet boşluğu:** jobtogo timing problemini çözmüyor. Kendi akışları: "Müşterinizden
ödeme gelmesini takip eden Salı günü Jobtogo size ödeme yapsın." Yani müşteri 90 gün
sonra öderse freelancer 90 gün sonra alıyor. Fatura/şirketsizlik problemini çözüyorlar;
ön ödeme ve otomatik serbest bırakma boşta. Tezin farklılaştığı yer tam olarak burası.

Bu rakamlar şirketin kendi pazarlama sayfasındaki beyanlarıdır; veri olarak alındı,
doğrulanmış finansal tablo olarak değil.

## Ölçek sorusu

Yatırım alınabilirlik endişesi (2026-08-30) haklı ama nedeni fiyat değil hacim.
Freelancer başına gelir, o freelancerın kendi bulduğu işle sınırlı olduğu sürece hiçbir
şey birikmiyor — eksik olan bileşik büyüme mekanizması.

### Pazaryeri: REDDEDİLDİ (2026-08-30)

Değerlendirildi ve reddedildi. Gerekçe, üç veri noktası:

1. **Jobtogo'da pazaryeri zaten var ve işe yaramıyor.** 12.000+ freelancer, 500+ şirket,
   yılda 725 proje. Yani şirket başına yılda 1,45 proje ve 16 freelancer başına yılda 1
   proje. Arz havuzu ölü ağırlık. Pazaryerleri arz tarafında değil talep tarafında ölür
   ve bu rakamlar tam olarak o ölümü gösteriyor.
2. **Bionluk pozisyonu zaten tutuyor, escrow'uyla birlikte.** Havuz hesabı yapısıyla
   alıcı ödediğinde para kilitleniyor. "Pazaryeri + emanet hesap" Türkiye'de boş bir
   pozisyon değil; girmek SEO, puanlama, kategori taksonomisi ve soğuk başlangıçla
   savaşmak demek — hiçbiri bu ürünün farklılaştığı yer değil.
3. **Wedge'i yok eder.** Tasarım dokümanının stratejisi açıkça "Not a platform"; kod
   yazmadan pazartesi görüşmelere başlanabilmesinin tek sebebi o.

Ayrıca vazgeçilecek olan asimetri: bugünkü müşteri edinme birimi **müşterisi zaten olan
bir freelancer**. Yani pazaryerlerinin en zor problemi olan talep yaratma hiç çözülmüyor,
freelancer beraberinde getiriyor. Tek kişilik bir ekibin bu pazarda rekabet edebilmesinin
sebebi bu.

### Seçilen yön: genişleme birimi müşteri hesabı

Pazaryeri kurmadan bileşik büyümenin yolu, genişleme biriminin freelancer değil **şirket**
olması:

```
  freelancer  ──getirir──▶  müşteri şirketi  ──zaten çalışıyor──▶  N freelancer daha
```

Talep yaratmadan, içeride yayılarak büyüme. Aşağıdan yukarı yayılma (Deel/Slack şekli),
pazaryeri değil.

**N, Stage 1'de ölçülüyor.** Mülakatlara üçüncü bir soru eklendi: "Şirketiniz yılda kaç
farklı freelancerla çalışıyor, toplamda ne kadar ödüyor?" Medyan N ≥ 10 ise müşteri hesabı
çarpandır ve pazaryerine ihtiyaç yoktur; N ≤ 3 ise genişleme baştan düşünülmelidir. Bu bir
kill gate değil — düşük N ön ödemeyi ya da otomatik serbest bırakmayı geçersiz kılmaz,
sadece büyümenin başka yerden gelmesi gerektiğini söyler.

Bunun ürün karşılığı (şirket tarafına davet akışı, bir şirketin birden çok freelancerını
yönetmesi) henüz yazılmadı ve Stage 1 sonucuna kadar yazılmayacak.

### Hâlâ açık, karar verilmedi

- **Sınır ötesi:** Türk freelancer + yurtdışı müşteri. Stopaj yok, vadeler daha uzun,
  tutarlar döviz; hacim tavanı Türk KOBİ bütçelerinden kopar.
- **Finansman kolunu yeniden açmak:** aynı hacimde kat kat yüksek marj, BDDK ve bilanço
  karşılığında.

## Kapsam (HOLD SCOPE)

- `src/lib/escrow/money.ts` — bölüşüm yönü, `clientChargeKurus`, taşma koruması
- `supabase/migrations/` — generated sütunlar, `client_charge_kurus`, minimum tutar kontrolü
- `escrow_transactions` — `client_charge_kurus` snapshot sütunu
- `CLAUDE.md` — "Money" bölümündeki pazarlık dışı kurallar
- `src/app/nasil-calisir/system-flow.tsx` — para dağılımı bölümü ve 05 numaralı kart
- Tasarım dokümanı Soru 1 — ücret rakamı mülakat sorusuna girmeli

## Kapsam DIŞI

- Kademeli/tavanlı oran yapısı — doğrulanmamış müşteri dağılımına göre optimizasyon
- İki yönlü kupon altyapısı — platformdan freelancera para akışı yeni bir yön, ayrı kapsam
- Ücrete taban (minimum fee) — minimum aşama tutarı aynı problemi özdeşlik bozmadan çözüyor
- Abonelik / SaaS fiyatlama — reddedildi, doğrulanmamış üründe peşin ücret en zor satış

## Hâlâ açık: hangi hukuki yapı?

`CLAUDE.md` komisyonu "platform tarafından freelancera fatura edilen" diye
tanımlıyor, ama kod stopajı komisyon sonrası tutardan hesaplıyordu. Bu ikisi
aynı anda doğru olamaz. Yeni model bu çelişkiyi ortadan kaldırıyor — freelancer
tam 10.000 üzerinden SMM keser, platform 1.000 TL'lik hizmet bedelini **müşteriye**
fatura eder — ama bu, platformun müşteriyle doğrudan sözleşen taraf olmasını
gerektirir.

**Mali müşavire sorulacak tek soru:** platform hizmet bedelini müşteriye fatura
ederken, freelancerın SMM'si ile platform faturası aynı işlem için iki ayrı belge
olarak durabilir mi, yoksa aracılık yapısı mı kurulmalı? Bu cevap KDV ve 6493
pozisyonunu belirler. Aritmetik her iki durumda da yukarıdaki gibidir.

## Riskler

- **%10 itiraz çeker.** Müşteri hem 90 günlük bedava vadeden vazgeçiyor hem ücret
  ödüyor. Rakip aynı oranı alıyor ama karşılığında ön ödeme istemiyor — yani bizim
  ricamız daha büyük. Stage 1 mülakatları bunu ücretiyle birlikte sormalı, yoksa yanlış
  soruya alınmış bir "evet" ile karar verilir.
- **PSP oranı sabit değil.** Kart tipi ve taksit oranı değiştirir. Marjın
  izlenebilmesi için gerçekleşen PSP kesintisi işlem bazında kaydedilmeli.
- **Eski test özdeşliği ölmüştü** (`fee + freelancerGross == gross`). Testler
  yamalanmadı, yeniden yazıldı; ayrıca `schema-mirror.test.ts` TS ile SQL'in aynı
  sayıyı ürettiğini doğruluyor ve 12 mutasyonla kırmızı yandığı kanıtlandı.
- **Şema hâlâ push edilmedi.** `init.sql` yerinde düzenlendi; daha önce hosted bir
  projeye push edildiyse o veritabanı dosyayla uyuşmuyor ve ya branch DB sıfırlanmalı
  ya da ayrı bir ALTER migration yazılmalı.
