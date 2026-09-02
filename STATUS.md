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
- **QA paketini artık client imza aşamasında seçiyor** — freelancer teslimden
  sonra değil (bu oturumda değişti, bkz. "Bugün düzeltilenler"). Denetlenen
  tarafın kendi denetim sıkılığını seçmesi çıkar çatışmasıydı. Tier3/4 için
  reviewer da aynı adımda seçiliyor. Seçim, imza atılana kadar client
  tarafından değiştirilebilir; ilk imzadan sonra kilitleniyor
  (`set_qa_selection()` RPC, DB seviyesinde reddediyor). Teslim artık tek bir
  atomik RPC (`submit_qa_delivery()`): teslim satırı, durum geçişi ve
  `qa_tier_orders` kaydı aynı transaction'da oluşuyor, kısmi başarısızlıkta
  sahipsiz kayıt kalmıyor.
- Teslim + QA tier: Tier1 (ücretsiz, müşteri kendi bakar), Tier3/4
  (insan inceleme, reviewer kendi ücretini belirler → `qa_reviewers.rate_kurus`).
- **Tier2 (Agentic QA) artık ayrı bir worker/hosting gerektirmiyor** —
  `src/lib/qa/agent.ts`, aynı Vercel deployment'ı içinde normal bir fonksiyon
  çağrısı olarak çalışıyor (Playwright: `@sparticuz/chromium` +
  `playwright-core`; LLM: gpt-4o-mini). `chooseQaTier()` sonrası `after()` ile
  anında tetikleniyor, günlük bir cron (`process-tier2-qa`) da kaçanları
  yakalıyor. Düşük güvende (`confidenceScore < 80`) Tier3'e escalate ediyor.
  **Hâlâ `available: false`** — Vercel'e `OPENAI_API_KEY` eklenip gerçek bir
  staging sitesiyle test edilmeden canlıya alınmamalı.
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
5. **Antigravity'nin Tier2 worker + landing page redesign'i review edildi ve
   düzeltildi** (commit `402eab0`) — antigravity'nin yaptığı değişiklikler
   commit edilmeden önce incelendi, gerçek buglar bulundu ve düzeltildi:
   - `auto_escalate_qa_tier()` sadece `is_admin()` kontrol ediyordu; worker
     service-role ile çağırdığında `auth.uid()` null olduğu için bu her
     zaman false dönüyor, escalation sessizce hep başarısız oluyordu.
   - Aynı fonksiyon, reviewer atanmamış ve ücreti 0 olan yetim bir TIER3
     kaydı oluşturuyordu — kimse fark etmez, kimse faturalanmazdı. Artık
     sadece mevcut siparişi `ESCALATED` işaretliyor, `/admin/qa-queue`'da
     zaten görünür oluyor.
   - `worker/index.ts`'te sipariş alma select-then-update'ti (yarış durumu
     riski) — atomik `UPDATE ... WHERE agent_status IS NULL` yapıldı.
   - LLM prompt'una, freelancer'ın kontrol ettiği sayfa içeriğinin
     (`domContent`) güvenilmez veri olduğunu belirten bir çerçeve eklendi
     (prompt injection'a karşı temel bir önlem).
   - Fiyatlandırma `$29`'a ve Tier1'e "%10 Hizmet Bedeli" ibaresine
     gerilemişti (bugünkü Faz1/Faz2 kararıyla çelişiyordu) — 250₺'ye ve
     "Ücretsiz"e geri alındı.
   - `site-footer.tsx`'te var olmayan `/gizlilik`, `/sozlesme` linkleri ve
     "Lancerix Inc." ibaresi (şirket henüz yok) kaldırıldı.
   - `actions.ts`'te tanımsız `session` değişkeninden kaynaklanan iki
     typecheck hatası düzeltildi.
6. **QA paketi seçimi client'a, imza aşamasına taşındı** — "client sözleşme
   onaylarken test tipini seçti mi" sorusu üzerine: önceki akışta freelancer
   teslimden *sonra* kendi QA sıkılığını (Tier1-4) ve Tier3/4 için reviewer'ı
   seçiyordu — denetlenen taraf kendi denetimini seçiyordu, bariz bir çıkar
   çatışması. Yeni akışta:
   - `set_qa_selection()` RPC'si (yeni migration
     `20260902070000_client_selects_qa_tier.sql`) client'ın imza öncesi
     paket+reviewer seçimini `contracts.qa_tier/qa_reviewer_id/qa_fee_kurus`'a
     yazıyor, herhangi bir imzadan sonra reddediyor.
   - `sign_contract()` artık QA_ONLY sözleşmede `qa_tier is not null`'ı da
     zorunlu kılıyor (kabul kriterleri gate'iyle aynı desende).
   - `submit_qa_delivery()` RPC'si eski `choose_qa_tier()`'ın yerini aldı:
     freelancer artık *seçmiyor*, sadece teslim ediyor — sipariş, sözleşmede
     zaten kilitli olan tier/reviewer/ücretle aynı transaction'da açılıyor.
   - Uçtan uca canlı doğrulama yapıldı (2 test hesabıyla): Tier1 akışı ve
     Tier3+Senior reviewer akışı ayrı ayrı imzalandı, teslim edildi; her
     ikisinde de oluşan `qa_tier_orders` satırının tier/reviewer/ücreti
     sözleşmedeki seçimle birebir eşleşti (SQL ile doğrulandı).
   - Not: bu doğrulama sırasında ayrı/önceden var olan bir gate'e rastlandı —
     `submitQaDelivery` iş başlamış olmasını (`work_started_at`) şart koşuyor,
     bu da her iki tarafın `planned_start_date`'i onaylamasına bağlı; test
     sözleşmesinde `planned_start_date` hiç girilmemişti (freelancer'ın
     sözleşme formunda alan isteğe bağlı bırakılmış), bu yüzden onay kartı
     hiç görünmüyordu. Bu oturumun konusu değil, dokunulmadı — ama gerçek bir
     sözleşmede freelancer bu tarihi girmezse teslim hiç açılmayabilir; ayrı
     bir bakış gerekebilir.

## Bilinen boşluklar / sıradaki

CEO review'da (2026-09-02) kararlaştırılan 4 fazlık sıra:

| Faz | İş | Durum |
|---|---|---|
| 1 — Güven | Kayıt-rolü bug'ı + bildirim güvenilirliği | ✅ Tamamlandı (bugün) |
| 2 — Ürün | Tier2 Agentic QA | Kod hazır ve Vercel'e entegre (ayrı hosting gerekmiyor) — Vercel'e `OPENAI_API_KEY` eklenip gerçek bir teslimatla uçtan uca test edilmeden `available: true` yapılmamalı |
| 3 — Sağlamlık | Son eklenen UI akışları için test kapsamı (`addAcceptanceCriteria`, `payQaOrder`, `ServicesPicker`, `PayoutInfoForm`) | Başlamadı |
| 4 — Gelir | PayTR/iyzico escrow (şirket kuruluşu şart) | Şirket kuruluşuna bağlı |

## Diğer bilinen gerçekler

- Hosted-only Supabase iş akışı: bu makinede Docker yok, her şema değişikliği
  gerçek (hosted) projeye `supabase db push` ile gidiyor. Yerel/staging DB yok.
- `main` branch üzerinde doğrudan çalışılıyor, ayrı feature branch yok.
- `npm run build` bu makinede Node v25 + webpack uyumsuzluğuyla başarısız
  oluyor gibi görünüyor (typecheck/lint/test/`next dev` hepsi temiz) — bu
  doğrulanmadı, Vercel'de derlenip derlenmediği ayrıca kontrol edilmeli.
