import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading, Row, Rows } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth/session";
import { listContracts } from "@/lib/data/contracts";

export default async function FreelancerProjectsPage() {
  const session = await requireRole("FREELANCER");
  const contracts = await listContracts("freelancer", session.userId);

  return (
    <>
      <PageHeading
        title="Projeler"
        subtitle="Teslim ettiğin işler ve aşamalarının durumu"
        action={
          <Link
            href="/freelancer/new"
            className="bg-brand text-brand-foreground inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 active:scale-[0.98]"
          >
            Yeni sözleşme
          </Link>
        }
      />

      {contracts.length === 0 ? (
        <EmptyState
          title="Henüz proje yok"
          description="Bir müşteriyle sözleşme kurduğunda burada görünür. Her aşama kendi başına fonlanır ve kendi başına serbest kalır; birindeki gecikme diğerlerini bekletmez."
        >
          <Link
            href="/freelancer/new"
            className="text-brand text-sm font-medium hover:underline"
          >
            İlk sözleşmeni kur
          </Link>
        </EmptyState>
      ) : (
        <Rows>
          {contracts.map((contract, index) => {
            const total = contract.milestones.reduce(
              (sum, m) => sum + m.gross_amount_kurus,
              0,
            );
            const done = contract.milestones.filter(
              (m) => m.status === "RELEASED",
            ).length;

            return (
              <Row key={contract.id} index={index}>
                <Link
                  href={`/contracts/${contract.id}`}
                  className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {contract.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {contract.counterpartyName} · {contract.reference} ·{" "}
                      {done}/{contract.milestones.length} aşama tamamlandı
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:justify-end">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {contract.milestones.map((m) => (
                        <StatusBadge key={m.id} status={m.status} />
                      ))}
                    </div>
                    <Money
                      kurus={total}
                      className="text-sm font-medium text-zinc-950 dark:text-zinc-50"
                    />
                  </div>
                </Link>
              </Row>
            );
          })}
        </Rows>
      )}
    </>
  );
}
