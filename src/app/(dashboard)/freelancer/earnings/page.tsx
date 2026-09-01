import { formatKurus } from "@/lib/escrow/money";
import { EmptyState, PageHeading, Stat } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { earningsSummary } from "@/lib/data/contracts";

export default async function FreelancerEarningsPage() {
  const session = await requireRole("FREELANCER");
  const summary = await earningsSummary(session.userId);

  const nothingYet = summary.releasedKurus === 0 && summary.lockedKurus === 0;

  return (
    <>
      <PageHeading
        title="Kazanç"
        subtitle="Hesabına geçen, escrow'da bekleyen ve vergi dairesine giden tutarlar"
      />

      {nothingYet ? (
        <EmptyState
          title="Henüz serbest kalan tutar yok"
          description="Bir aşama serbest kaldığında burada kesilen stopajla ve eline geçen netle birlikte listelenir. Hizmet bedeli müşteriden alınır; bu rakamdan düşülmez."
        />
      ) : (
        <>
          {/* Asymmetric on purpose: the figure that matters is what landed, so
              it gets the wide column and the other two share the narrow one. */}
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
            <Stat
              label="Hesabına geçen"
              value={formatKurus(summary.releasedKurus)}
              hint="Serbest kalmış ve ödenmiş aşamalar"
             
            />
            <Stat
              label="Escrow'da bekleyen"
              value={formatKurus(summary.lockedKurus)}
              hint="Fonlanmış, henüz serbest kalmamış"
             
            />
            <Stat
              label="Kesilen stopaj"
              value={formatKurus(summary.withheldKurus)}
              hint="Vergi dairesine yatırıldı"
             
            />
          </div>

          <p className="max-w-[62ch] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Stopaj bu platformun bir maliyeti değil. Sana kim öderse ödesin
            kaynakta kesilir ve yıllık gelir vergisi beyanında mahsup edilir.
          </p>
        </>
      )}
    </>
  );
}
