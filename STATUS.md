# Lancerix — Durum Özeti

_Son güncelleme: 2026-09-03_

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
- **Sözleşme kurulurken müşterinin Lancerix hesabı olması gerekmiyor artık**
  (bu oturumda eklendi, "F-3") — freelancer, ID bulunamazsa e-posta ile davet
  edebiliyor. `claim_invited_contract()` davetli adres giriş yapınca (yeni
  kayıt ya da zaten var olan hesap fark etmeksizin) sözleşmeyi otomatik
  bağlıyor; `auth.users.email_confirmed_at` kontrolü DB seviyesinde zorunlu.
  Aynı geçişte, `client_id IS NULL` olan bir sözleşmede daha önce fark
  edilmemiş gerçek bir güvenlik açığı da kapatıldı: `reject_contract()`,
  `request_revision()`, `set_qa_selection()`'ın `client_id <> auth.uid()`
  kontrolü NULL-güvenli değildi (`NULL <> x` = NULL = false in PL/pgSQL),
  yani iddiasız bir sözleşmeyi herhangi bir oturum açmış kullanıcı
  reddedebilir/QA paketini değiştirebilirdi. `is distinct from` ile
  düzeltildi.
- Teslim + QA tier: **Tier1 artık 99₺ "doğrulama kaydı ücreti"** (bu
  oturumda eklendi, "D" — önceden ücretsizdi; LemonSqueezy zaten Tier3/4
  reviewer ücretini tahsil ediyordu, bunu Tier1'e de genişletip P-3'ü
  (ödeme isteği var mı) şirket kurmadan test etmek için). **Freelancer'ın
  ilk Tier1/2 seçimi ücretsiz** ("Faz E #4" — yeni ücretin ilk müşteriye
  sürtünme yaratmaması için). Tier3/4 değişmedi (insan inceleme, reviewer
  kendi ücretini belirler → `qa_reviewers.rate_kurus`).
- **Kabul edilen bir QA raporu artık herkese açık, paylaşılabilir bir linkte
  yayınlanabiliyor** ("Faz E #1") — freelancer'ın kendi tercihi, varsayılan
  kapalı, `/report/[token]` (256-bit rastgele token, tahmin edilemez).
  `public_qa_report()` yalnızca güvenli alanları döndürüyor (başlık,
  kategori, kriterler, sonuç, hash) — hiçbir zaman taraf ismi, e-posta,
  TCKN/IBAN veya tutar yok.
- Ana sayfada gerçek kullanım verisinden bir "X sözleşme doğrulandı"
  sayacı var ("Faz E #2") — ama sayı 5'in altındayken hiç gösterilmiyor
  (şu an gösterilmiyor, gerçek sayı çok düşük).
- Müşteri 5 günlük kontrol süresinin bitmesine ~1 gün kala freelancer'a
  hatırlatma e-postası gidiyor ("Faz E #3", günlük cron
  `remind-pending-review`, `deliveries.reminder_sent_at` tekrar
  göndermeyi engelliyor).
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

## 2026-09-03: Faz 1 strateji review'ı ve sonrası

`/plan-ceo-review` — 2026-09-01'deki review'ın reddettiği "sadece rapor,
para hareket etmiyor" modeline (`CLAUDE.md`) sessizce geri dönülmüş
olduğunu buldu (kayıtlı bir karar değişikliği yok). Kapatmak için 4 fazlık
bir plan onaylandı ve hepsi bugün sevk edildi — tam gerekçe/karar kaydı:
`~/.gstack/projects/demearac/ceo-plans/2026-09-03-faz1-strategy-close-payment-gap.md`.

1. **F-4** — `terms.ts`'in "fatura kesmez" iddiası, `confirm_start_date()`'in
   yazdığı `platform_invoices` satırıyla çelişiyordu; metin doğru bilgiye
   göre yeniden yazıldı, kod değişmedi (commit `919c014`).
2. **F-3** — yukarıda (davetle sözleşme kurma). İki üretim hatası bulundu ve
   düzeltildi *deploy anında*: (a) `contracts_select_party` RLS policy'si
   `auth.users`'ı doğrudan sorguluyordu — `authenticated` rolünün o tabloda
   SELECT izni yok, ve Postgres OR dallarını soldan sağa garanti kısa
   devre yapmıyor, bu yüzden HER sözleşme okuması "permission denied for
   table users" ile patladı. (b) İlk düzeltme (`is_contract_party(id)`
   üzerinden yönlendirme) bu sefer freelancer'ın kendi sözleşmesini
   oluştururken INSERT...RETURNING'i kırdı — kendi tablosuna geri
   sorgu atan bir fonksiyon, aynı statement içinde henüz eklenmekte olan
   satırı güvenilir şekilde göremiyor. Üçüncü migration'da (orijinal terk
   edilmiş migration'ın deseni geri getirilerek) düzeltildi (commit `3bbec32`).
3. **D** — Tier1/2 sembolik ücret (commit `75cab1d`).
4. **Faz E** — 4 genişleme, hepsi kabul edildi ve sevk edildi:
   ilk-sözleşme-ücretsiz (`b44bcd3` — bir kaçağı da bulup düzeltti: ücreti
   0'a bağlamak sonsuz ücretsiz döngüsü açıyordu, seçime bağlamak
   gerekiyordu), ana sayfa sayacı (`1531af1`), freelancer hatırlatması
   (`3a9dd0e`), paylaşılabilir rapor linki (`e7cc810` — bu son commit
   ayrıca `/report` VE `/sartlar`'ın `middleware.ts`'in genel-erişim
   listesinde hiç olmadığını buldu: ikisi de oturum açmamış ziyaretçiyi
   `/login`'e yönlendiriyordu, "herkese açık" olmaları gerekirken).

Her faz için: hosted DB'ye karşı doğrudan SQL ile (gerçek/atılabilir test
verisiyle) uçtan uca doğrulama + tarayıcıda canlı test + typecheck/lint/test
temiz, commit ve push edildi.

**Bu review sırasında bulunan, bilerek bu oturuma dahil edilmeyen bir bug**
(ayrı bir arka plan görevi olarak işaretlendi): `planned_start_date`
sözleşme kurulurken isteğe bağlı bir alan — boş bırakılırsa iki taraf da
imzalasa bile teslim asla açılmıyor (`work_started_at`'ı set edecek hiçbir
yol yok). Bir freelancer bu tarihi girmeyi unutursa sözleşme kalıcı olarak
kilitli kalıyor.

## Bilinen boşluklar / sıradaki

CEO review'da (2026-09-02) kararlaştırılan 4 fazlık sıra:

| Faz | İş | Durum |
|---|---|---|
| 1 — Güven | Kayıt-rolü bug'ı + bildirim güvenilirliği | ✅ Tamamlandı |
| 2 — Ürün | Tier2 Agentic QA | Kod hazır ve Vercel'e entegre (ayrı hosting gerekmiyor) — Vercel'e `OPENAI_API_KEY` eklenip gerçek bir teslimatla uçtan uca test edilmeden `available: true` yapılmamalı |
| 3 — Sağlamlık | Son eklenen UI akışları için test kapsamı (`addAcceptanceCriteria`, `payQaOrder`, `ServicesPicker`, `PayoutInfoForm`) | Başlamadı |
| 4 — Gelir | PayTR/iyzico escrow (şirket kuruluşu şart) | Şirket kuruluşuna bağlı |

2026-09-03 CEO review'ının kararlaştırdığı, TODOS.md'ye eklenen ayrı
kalemler: LemonSqueezy webhook rekonsiliasyon sweep'i (P2), davet süresi
dolma mekanizması (P3, gerçek davet hacmi birikince tekrar bakılacak).

## Diğer bilinen gerçekler

- Hosted-only Supabase iş akışı: bu makinede Docker yok, her şema değişikliği
  gerçek (hosted) projeye `supabase db push` ile gidiyor. Yerel/staging DB yok.
- `main` branch üzerinde doğrudan çalışılıyor, ayrı feature branch yok.
- `npm run build` bu makinede Node v25 + webpack uyumsuzluğuyla başarısız
  oluyor gibi görünüyor (typecheck/lint/test/`next dev` hepsi temiz) — bu
  doğrulanmadı, Vercel'de derlenip derlenmediği ayrıca kontrol edilmeli.
