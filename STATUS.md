# Lancerix — Durum Özeti

_Son güncelleme: 2026-09-04_

Bu dosya "şu an ne çalışıyor, ne eksik, sırada ne var" sorusuna tek bakışta
cevap vermek için var. Ürün/mimari kararların gerekçesi `CLAUDE.md`'de;
burası daha çok bir kontrol paneli.

## Şu an çalışan (Faz 1)

- Sözleşme oluşturma (freelancer): proje kategorisi, kapsam, proje bedeli,
  iş akışı fazları (her fazda gerçek başlangıç/bitiş tarihi ve alt madde
  listesi — bkz. aşağıdaki "Toplam maliyet ve faz/checklist" bölümü).
- **Sözleşme sayfasında müşteriye kalem kalem toplam maliyet gösteriliyor**:
  Proje Bedeli + Platform Komisyonu (%10) + Test Ücreti = Toplam. Sadece
  bilgilendirme amaçlı — para akışı değişmedi (bkz. aynı bölüm).
- **Admin alanı artık SQL'siz çalışıyor** — tek operatör (founder) `/admin`
  panelinde tek bakışta neyin dikkat gerektirdiğini görüyor (QA kuyruğu,
  bekleyen ödeme/fatura, itiraz, davet — hepsi eskime rengiyle), global
  arama, kullanıcı notları, tüm admin aksiyonları için append-only bir
  aktivite günlüğü ve günlük özet e-postası var (bkz. aşağıdaki "Admin
  operatör araç seti" bölümü).
- **Admin artık kullanıcıları yönetebiliyor**: askıya alma (sadece yeni
  sözleşme oluşturmayı engelliyor, giriş/mevcut iş etkilenmiyor), rol
  değiştirme (ADMIN'e yükseltme yazarak onay gerektiriyor), profil adı
  düzenleme, ve gerçekten boş (sözleşme geçmişi olmayan) hesaplar için
  kalıcı silme (bkz. aşağıdaki "Kullanıcı yönetimi" bölümü).
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

**Bu review sırasında bulunan bir bug** (o oturumda bilerek dışarıda
bırakılmış, bir sonraki oturumda düzeltildi — commit `46b0500`):
`planned_start_date` sözleşme kurulurken isteğe bağlı bir alan — boş
bırakılırsa iki taraf da imzalasa bile teslim asla açılmıyordu
(`work_started_at`'ı set edecek hiçbir yol yoktu). `set_planned_start_date()`
RPC'si eklendi: sözleşme ACTIVE iken ve tarih hâlâ boşken taraflardan
biri bir kere doldurabiliyor, ardından mevcut karşılıklı-onay akışı normal
şekilde devam ediyor. Review sırasında bir NULL-karşılaştırma hatası da
yakalanıp düzeltildi: ilk taslak `IS DISTINCT FROM` ile taraf kontrolü
yapıyordu, bu da anonim bir çağrıyı (`auth.uid()` null) `client_id`'si henüz
hiç atanmamış (F-3 davet akışındaki gibi) bir sözleşmede "eşleşme" sayıyordu
— ikisi de null olduğunda `IS DISTINCT FROM` false dönüyor. Zaten
doğrulanmış `is_contract_party()` yardımcı fonksiyonuna (düz `=` kullanır,
NULL-güvenli) yönlendirilerek düzeltildi. Hosted DB'ye karşı SQL ile
(anon reddi, mutlu yol, ikinci deneme reddi, yabancı reddi) ve tarayıcıda
uçtan uca doğrulandı: tarih girilmeden imzalanan bir sözleşmede yeni kart
çıktı, tarih girildi, iki taraf onayladı, `work_started_at` set edildi,
teslim (önceden kalıcı olarak kilitliydi) başarıyla gönderildi.

## 2026-09-03: Toplam maliyet gösterimi ve faz/checklist geliştirmeleri

Kullanıcının doğrudan isteği: müşteri toplam maliyeti (proje bedeli + %10 +
test ücreti) kalem kalem görmeli; freelancer projeyi fazlara ayırırken her
fazın gerçek başlangıç/bitiş tarihini girebilmeli, fazı maddelere bölüp
tamamladıkça işaretleyebilmeli.

- **Toplam maliyet kartı** (commit `a9f66ce`) — mevcut "Lancerix bu tutar
  üzerinden komisyon almaz" cümlesiyle doğrudan çelişeceği için önce
  kullanıcıya soruldu: bilgilendirme amaçlı mı, yoksa imzada gerçekten
  tahsile mi başlanacak? Cevap: bilgilendirme amaçlı — para akışı
  değişmiyor, Faz 1 kapsamında kalınıyor (fon saklama yok). `contracts`
  tablosunda zaten duran `platform_fee_bps` (%10, her sözleşmede
  günden beri kayıtlı ama hiç gösterilmiyordu) ve `qa_fee_kurus`
  kullanılarak `TotalCostBreakdown` bileşeni eklendi; eski cümle
  gerçeğe uygun şekilde yeniden yazıldı.
- **Faz tarihleri + checklist** (commit `b7f4816`) — `workflow_phases`'a
  `start_date`/`end_date` eklendi (eski `estimated_days` tahminin yerini
  aldı, sütun geriye dönük uyumluluk için tabloda kaldı). Yeni
  `workflow_phase_items` tablosu: her fazın altına serbest sayıda madde,
  freelancer tek tek işaretliyor, müşteri salt-okunur görüyor. RLS,
  `workflow_phases`'ın deseniyle birebir aynı (parti okuyabilir, sadece
  freelancer ekleyip güncelleyebilir).
- **Doğrulama sırasında bir test metodolojisi hatası bulundu**: RLS'i
  `supabase db query`'nin bağlandığı `postgres` rolüyle test etmek RLS'i
  tamamen atlıyor (superuser/tablo sahibi RLS'e tabi değil) — sadece
  `request.jwt.claim.sub` set etmek yetmiyor, `set local role
  authenticated` da gerekiyor. İlk denemede bu yüzden yanlışlıkla "her şey
  yeşil" görünüyordu; düzeltilip doğru şekilde tekrar test edildi.

## 2026-09-04: Admin operatör araç seti

`/plan-ceo-review` + `/plan-eng-review` (tam süreç: sistem denetimi, premise
challenge, karmaşıklık kontrolü, detaylı review, outside-voice zıtlığı,
worktree paralelleştirme stratejisi) — "bizim admin alanımızı iyi
kurgulamamız lazım artık" isteğine karşılık. Karar kaydı:
`~/.gstack/projects/demearac/ceo-plans/2026-09-04-admin-area-operator-toolkit.md`
(status: SHIPPED).

Sistem denetimi 6 çalışan ama görünürlüğü/aksiyonu sınırlı admin sayfası
buldu; en somut bulgu: `markQaOrderPaid()` (LemonSqueezy webhook'u
kaçarsa QA siparişini elle ödendi işaretleme fonksiyonu) yazılmış ve test
edilmişti ama hiçbir UI'a bağlı değildi — ölü kod. 8 madde kabul edildi,
hepsi sevk edildi:

1. **Dashboard + routing** (`06f899b`) — `/admin` artık 5 kartlı özet
   panel (QA kuyruğu, bekleyen QA ödemesi, bekleyen fatura, itiraz,
   davet), `Promise.allSettled` ile bağımsız sorgu başarısızlığı
   (biri çökerse sadece o kart hata rozeti gösterir). Eski içerik
   `/admin/disputes`'a taşındı.
2. **markQaOrderPaid UI'a bağlandı** (`669588d`) — `/admin/qa-queue`'da
   yeni "Bekleyen QA ödemesi" paneli; gerçek bir PENDING siparişle
   canlıda doğrulandı.
3. **Kullanıcı notları** (`a3953c2`) — `admin_user_notes`, is_admin()
   RLS, `/admin/users/[id]`'de zaman damgalı not listesi.
4. **Global arama** (`7b65562`) — sözleşme referansı/e-posta/Lancerix ID.
5. **Aktivite günlüğü** (`099e9af`) — `admin_activity_log`, delivery
   ledger'ın append-only deseniyle birebir (trigger canlıda bir
   superuser UPDATE/DELETE'ini bile reddettiği doğrulandı), tüm 7 admin
   aksiyonuna (`logAdminEvent()` ortak yardımcısıyla) bağlandı. Log
   yazma hatası gerçek aksiyonu asla engellemiyor (yutulup console'a
   loglanıyor).
6. **Günlük özet e-postası** (`6ada63a`) — `admin_digest_sends` ile
   günlük idempotency, sıfır-bekleyen günde gönderilmiyor, dashboard'ın
   kendi sorgularını (`getDashboardCounts()`'a inject edilebilir client
   eklendi) yeniden kullanıyor. Gerçek bir test e-postasıyla uçtan uca
   doğrulandı.

**Bulunan ve düzeltilen bir tutarsızlık:** outside-voice review, activity
log'un kapsamda tutulma gerekçesinin ("ikinci bir admin geldiğinde...")
tam da çoklu-admin yaklaşımını reddetme gerekçesiyle çeliştiğini buldu.
Kullanıcı kapsamı korudu, gerekçe pilotun kendi ihtiyacına (hafızaya
güvenilemeyen an) düzeltildi.

**Bu makinede Vercel CLI oturumu (hollypredator) lancerix projesine bağlı
değil** — proje aslında Msamedcbn'in GitHub'a bağlı ayrı bir Vercel
hesabı üzerinden deploy oluyor. Bu yüzden cron slot kapasitesi (artık 5
günlük cron var) bu oturumdan doğrulanamadı — deploy'dan önce/sonra
Vercel dashboard'undan elle kontrol gerekiyor.

## 2026-09-04: Kullanıcı yönetimi

"Kullanıcıları yönetebilmeyi de eklemek lazım" isteğine karşılık — admin
operatör araç setinin doğal devamı. Şemaya bakılarak kapsam daraltıldı:
`contracts`/`platform_invoices`/`payouts`/`companies`'in `profiles`'a tüm
FK'leri `ON DELETE RESTRICT` — gerçek geçmişi olan bir hesap zaten
silinemez, bu yüzden "silme" isteği "askıya alma" ile karşılandı, gerçek
silme sadece boş hesaplar için var. Ayrıca `guard_profile_role()`
trigger'ı (proje başından beri) zaten admin'in rol değiştirmesine izin
veriyordu — hiç UI'ı yoktu.

- **Askıya alma/kaldırma**: sadece yeni sözleşme oluşturmayı engelliyor
  (tek bir RLS policy'e dokunuldu — `contracts_insert_freelancer`), giriş
  veya devam eden iş etkilenmiyor. 8+ RPC'ye dokunmaktan kaçınıldı.
- **Rol değiştirme**: ADMIN'e yükseltme "ADMIN" yazarak onay gerektiriyor.
- **Profil düzenleme**: sadece ad soyad (e-posta/TCKN/IBAN kapsam dışı).
- **Kalıcı silme**: Lancerix ID'yi yazarak onay, gerçek güvenlik ağı
  veritabanının kendi RESTRICT kısıtları.

**Sevk öncesi yakalanan gerçek bug:** `profiles` tablosunda
`profiles_update_self` (sadece kendi kaydı) vardı ama admin bypass'ı
yoktu — `qa_reviewers`/`qa_tier_orders`/`platform_invoices` gibi diğer
tüm admin-yönetilen tablolarda bu zaten vardı, `profiles`'da hiç
eklenmemişti. Sonuç: yeni yazdığım 4 aksiyonun hepsi (profil düzenleme,
askıya alma, askı kaldırma, rol değiştirme) "başarılı" mesajı döndürüyordu
ama RLS satırı sessizce UPDATE'in dışında bırakıyordu — hiçbir şey
yazılmıyordu. Canlı testte veritabanını doğrudan kontrol ederek
yakalandı, aksiyonun kendi dönüş değerine güvenilerek değil. Eksik
`profiles_update_admin` policy'si eklenerek düzeltildi ve doğru şekilde
yeniden test edildi.

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

**Teyit gerekiyor:** `/api/cron/admin-digest` deploy'dan sonra Vercel
dashboard'unda (Msamedcbn hesabı) 5 günlük cron'un plana sığdığı elle
kontrol edilmeli — bu oturumun CLI'ı o hesaba bağlı değildi, kod
doğrulandı ama slot kapasitesi doğrulanamadı.

## Diğer bilinen gerçekler

- Hosted-only Supabase iş akışı: bu makinede Docker yok, her şema değişikliği
  gerçek (hosted) projeye `supabase db push` ile gidiyor. Yerel/staging DB yok.
- `main` branch üzerinde doğrudan çalışılıyor, ayrı feature branch yok.
- `npm run build` bu makinede Node v25 + webpack uyumsuzluğuyla başarısız
  oluyor gibi görünüyor (typecheck/lint/test/`next dev` hepsi temiz) — bu
  doğrulanmadı, Vercel'de derlenip derlenmediği ayrıca kontrol edilmeli.
