# Lancerix — Durum Özeti

_Son güncelleme: 2026-09-02_

Bu dosya "şu an ne çalışıyor, ne eksik, sırada ne var" sorusuna tek bakışta
cevap vermek için var. Ürün/mimari kararların gerekçesi `CLAUDE.md`'de;
burası daha çok bir kontrol paneli.

## Şu an çalışan (Faz 1)

- Sözleşme oluşturma (freelancer): proje kategorisi, kapsam, proje bedeli,
  iş akışı fazları.
- **Kabul kriterleri artık client tarafından belirleniyor** — freelancer değil
  (bu oturumda değişti). İmzalamadan önce en az 1 kriter zorunlu, DB seviyesinde
  garanti altında (`sign_contract()` reddediyor).
- İmza akışı: hizmet koşulları kabul gate'i, parmak izi (hash) kaydı, IP/UA.
- Teslim + QA tier seçimi: Tier1 (ücretsiz, müşteri kendi bakar), Tier3/4
  (insan inceleme, reviewer kendi ücretini belirler → `qa_reviewers.rate_kurus`).
- **Tier2 (Agentic QA) inşa edilmedi** — `available: false`, worker yok.
- QA ücreti tahsilatı: LemonSqueezy (MoR, şirket kurulmadan sabit fiyat
  tahsil edebiliyor) — sadece Tier3/4 reviewer ücreti için, proje bedeli
  için değil.
- Mesajlaşma, faz akış şeması (flowchart), sözleşme PDF görüntüleyici.
- Profil sistemi: herkese açık profil, kategorize "Hizmetler" seçici,
  "Faturalandırma" paneli (TCKN/IBAN topluyor ama **pasif** — Faz 2'ye kadar).
- Platform komisyonu (proje bedelinin %7-10'u): kayıt tutuluyor ama
  **otomatik tahsil edilmiyor** — admin isterse elle fiyatlandırıp Jobtogo
  referansıyla "ödendi" işaretleyebilir.
- E-posta bildirimleri (imza bekleniyor, teslim edildi, QA sonucu,
  otomatik kabul) — bugün yeniden aktif edildi (bkz. "Bugün düzeltilenler").

## Faz 2 (henüz başlamadı, kod yazılmadı)

- PayTR/iyzico marketplace escrow (hold + release).
- Lancerix'in kendi şirketi kurulunca gerçek platform komisyonu faturalama.
- "Freelancer adına faturalandırma" (Jobtogo'nun yaptığına benzer, ama
  Lancerix içinde).

## Bugün düzeltilenler

1. **Kabul kriterleri sahipliği** — freelancer'dan client'a taşındı, RLS +
   `sign_contract()` seviyesinde zorunlu kılındı (bkz. commit `b42baf4`).
2. **Login/register sayfalarından ana sayfaya dönüş yoktu** — "Lancerix"
   yazısı düz metindi, mobilde hiç görünmüyordu bile. Artık tıklanabilir
   logo var (commit `121179f`).
3. **Bildirimler tamamen sessizce kapalıydı** — `notify/email.ts` bir önceki
   oturumda bilinçli olarak no-op yapılmış, geri açılmamış. "Sessizlik kabul
   sayılır" mekaniği olan bir üründe kimseye pencerenin açıldığı
   söylenmiyordu. Gerçek Resend gönderimi geri getirildi (commit `8919ce4`).
4. **Kayıt-rolü bug'ı araştırıldı, doğrulanamadı** — canlı veritabanındaki
   son kayıtlar (CLIENT olarak kayıt olanlar doğru CLIENT çıkıyor) ve trigger
   SQL'i incelendi, bir kod hatası bulunamadı. Önceki rapor muhtemelen test
   sırasında yanlış radyo seçimiydi. Kapatıldı, uydurma bir düzeltme
   yapılmadı.

## Bilinen boşluklar / sıradaki

CEO review'da (2026-09-02) kararlaştırılan 4 fazlık sıra:

| Faz | İş | Durum |
|---|---|---|
| 1 — Güven | Kayıt-rolü bug'ı + bildirim güvenilirliği | ✅ Tamamlandı (bugün) |
| 2 — Ürün | Gerçek Tier2 Agentic QA worker (LLM tabanlı kriter okuma, async kuyruk, düşük güvende Tier3'e otomatik yükseltme) | Başlamadı |
| 3 — Sağlamlık | Son eklenen UI akışları için test kapsamı (`addAcceptanceCriteria`, `payQaOrder`, `ServicesPicker`, `PayoutInfoForm`) | Başlamadı |
| 4 — Gelir | PayTR/iyzico escrow (şirket kuruluşu şart) | Şirket kuruluşuna bağlı |

## Diğer bilinen gerçekler

- Hosted-only Supabase iş akışı: bu makinede Docker yok, her şema değişikliği
  gerçek (hosted) projeye `supabase db push` ile gidiyor. Yerel/staging DB yok.
- `main` branch üzerinde doğrudan çalışılıyor, ayrı feature branch yok.
- `npm run build` bu makinede Node v25 + webpack uyumsuzluğuyla başarısız
  oluyor gibi görünüyor (typecheck/lint/test/`next dev` hepsi temiz) — bu
  doğrulanmadı, Vercel'de derlenip derlenmediği ayrıca kontrol edilmeli.
