import { Money } from "@/components/money";
import { computeEscrowSplit } from "@/lib/escrow/money";
import { QA_TIER_INFO, type QaTier } from "@/lib/validations/delivery";
import type { ContractRow } from "@/lib/data/contracts";

/**
 * The all-in cost a client is actually looking at when they sign: the
 * freelancer's price, the platform's cut, and the QA package fee, itemized
 * instead of buried in three different panels.
 *
 * Informational only -- Faz 1 has no fund custody. The project amount still
 * settles directly between freelancer and client; the platform fee is still
 * invoiced separately (see STATUS.md); only the QA fee is actually collected
 * through Lancerix today. This total exists so nobody is surprised by the
 * full picture, not to imply Lancerix now sits in the payment flow.
 */
export function TotalCostBreakdown({
  contract,
}: Readonly<{
  contract: Pick<
    ContractRow,
    "project_amount_kurus" | "platform_fee_bps" | "stopaj_bps" | "qa_tier" | "qa_fee_kurus"
  >;
}>) {
  const projectKurus = contract.project_amount_kurus;
  const feePct = contract.platform_fee_bps / 100;
  // Routed through the same computeEscrowSplit() every other ClientCharge =
  // Gross + PlatformFee figure uses (CLAUDE.md: "never a second percentage"),
  // rather than a second, independent applyBps() call -- stopajBps is
  // required by the function's signature but unused here, this component
  // only ever displays the client-facing side of the split.
  //
  // Guarded at zero: project_amount_kurus defaults to 0 at the database
  // level (`contracts.project_amount_kurus ... default 0`), even though the
  // create-contract form's own Zod schema never submits less than
  // MIN_MILESTONE_GROSS_KURUS -- computeEscrowSplit() rejects a zero gross
  // outright, and a contract somehow still at its DB default shouldn't 500
  // this page over it.
  const { platformFeeKurus: commissionKurus, clientChargeKurus } =
    projectKurus > 0
      ? computeEscrowSplit({
          grossKurus: projectKurus,
          platformFeeBps: contract.platform_fee_bps,
          stopajBps: contract.stopaj_bps,
        })
      : { platformFeeKurus: 0, clientChargeKurus: 0 };
  const qaFeeKurus = contract.qa_fee_kurus;
  const qaLabel = contract.qa_tier ? QA_TIER_INFO[contract.qa_tier as QaTier].label : null;
  const totalKurus = clientChargeKurus + (qaFeeKurus ?? 0);

  return (
    <div className="mt-5">
      <dl className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        <div className="flex items-center justify-between py-2">
          <dt className="text-sm text-foreground/80 dark:text-muted-foreground">Proje Bedeli</dt>
          <dd className="tnum text-sm font-semibold text-foreground dark:text-foreground">
            <Money kurus={projectKurus} />
          </dd>
        </div>
        <div className="flex items-center justify-between py-2">
          <dt className="flex items-center gap-2 text-sm text-foreground/80 dark:text-muted-foreground">
            Platform Komisyonu (%{feePct})
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
              Şu an tahsil edilmiyor
            </span>
          </dt>
          <dd className="tnum text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
            <Money kurus={commissionKurus} />
          </dd>
        </div>
        {qaFeeKurus !== null ? (
          <div className="flex items-center justify-between py-2">
            <dt className="text-sm text-foreground/80 dark:text-muted-foreground">
              Test Ücreti{qaLabel ? ` (${qaLabel})` : ""}
            </dt>
            <dd className="tnum text-sm font-semibold text-foreground dark:text-foreground">
              <Money kurus={qaFeeKurus} />
            </dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between pt-3">
          <dt className="text-sm font-bold text-foreground dark:text-foreground">Toplam</dt>
          <dd className="tnum text-base font-bold text-foreground dark:text-foreground">
            <Money kurus={totalKurus} />
          </dd>
        </div>
      </dl>

      {qaFeeKurus === null ? (
        <p className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
          Test paketi henüz seçilmedi — seçildiğinde toplama eklenir.
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
        Proje bedeli için ödeme taraflar arasında doğrudan gerçekleşir. Platform
        komisyonu Lancerix tarafından ayrıca faturalandırılır. Test ücreti bu
        sayfadan tahsil edilir. Yukarıdaki toplam, süreci baştan görebilmen
        için bilgilendirme amaçlıdır.
      </p>
    </div>
  );
}
