import { Timeline } from "@/components/ui/timeline";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHeading } from "@/components/page-shell";

export const metadata = {
  title: "Yol Haritası ve Özellikler - Lancerix",
  description: "Lancerix'in dünden bugüne yolculuğu ve gelecekteki hedefleri.",
};

export default function YolHaritasiPage() {
  const data = [
    {
      title: "Nerede Başladık?",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-8 leading-relaxed">
            Sektördeki mevcut platformlar ya yüksek komisyonlarla hem freelancerları hem de müşterileri mağdur ediyor ya da parayı escrow hesaplarında esir alarak süreci hantallaştırıyordu. Adil bir sisteme, gerçek bir bağımsız hakeme ihtiyaç vardı.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4">
              <h4 className="text-rose-700 dark:text-rose-400 font-bold mb-2">Eski Sorunlar</h4>
              <ul className="text-sm text-rose-600 dark:text-rose-300 space-y-2 list-disc pl-4">
                <li>%20&apos;leri bulan fahiş komisyonlar</li>
                <li>Paranın uzun süre içeride kilitli kalması</li>
                <li>Kalite denetiminin hiç yapılmaması</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Neredeyiz?",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-8 leading-relaxed">
            Bugün Lancerix, paranıza el koymayan, aracı değil tarafsız bir <strong>hakem</strong> olarak konumlanıyor. Dünyanın her yerinden ekipler Lancerix&apos;i kullanarak projelerinin sözleşmeye uygunluğunu bağımsız mühendislere test ettiriyor.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shadow-sm">
              <h4 className="text-brand font-bold mb-2">Şeffaf Maliyet</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Hiçbir gizli ücret yok. Sadece alıcıdan tahsil edilen sabit %10 hizmet bedeli karşılığında test yapıyoruz.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shadow-sm">
              <h4 className="text-brand font-bold mb-2">Değiştirilemez Raporlar</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Proje teslimatları kabul kriterlerine göre QA uzmanları tarafından denetlenir ve blokzincir benzeri şifrelenmiş kayıtlarla güvence altına alınır.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Gelecek Planlarımız",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-8 leading-relaxed">
            Platformu adım adım, sağlam temeller üzerine inşa ediyoruz. Gelecek sürümlerde Lancerix&apos;i sadece bir denetim platformu olmaktan çıkarıp, tüm sürecin uçtan uca güvenle yönetildiği global bir standarda dönüştüreceğiz.
          </p>
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-brand/10 text-brand px-2.5 py-0.5 rounded-full text-xs font-bold">Mevcut (v0.1)</span>
                <h4 className="text-zinc-900 dark:text-zinc-100 font-bold">Bağımsız QA ve Kod Doğrulama</h4>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Şu anki açık beta sürümümüzde; paraya dokunmadan, sözleşme ve hakemlik altyapısı için sadece %10 komisyon alıyoruz. İhtiyaç duyduğunuz QA doğrulama ve kod test süreçleri ise bütçenize göre seçebileceğiniz paketlerle ayrıca fiyatlandırılır.
              </p>
            </div>
            
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold">İlk Çıkış (v1.0)</span>
                <h4 className="text-blue-900 dark:text-blue-100 font-bold">Otonom Test ve AI Hakemler</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300/80">
                Resmi sürümümüzle birlikte yapay zeka destekli otonom test araçlarını devreye alacağız. Kod analizi ve otomatik görsel testlerle manuel eforu sıfırlayıp, anında tartışmasız uyuşmazlık çözümleri sunacağız.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold">Hedef (v2.0)</span>
                <h4 className="text-emerald-900 dark:text-emerald-100 font-bold">Güvenli Ödeme (Escrow) Altyapısı</h4>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300/80 relative z-10">
                Bağımsız denetim güvenini kanıtladıktan sonra, v2 ile birlikte tamamen kendi altyapımızla <strong>Escrow (Güvenli Hesap)</strong> sistemini getireceğiz. Para içeride güvenle tutulacak ve yalnızca başarılı QA raporu çıktığında serbest bırakılacak.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <main className="w-full min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <div className="flex-1 w-full pt-16">
        <Timeline data={data} />
      </div>
      <SiteFooter />
    </main>
  );
}
