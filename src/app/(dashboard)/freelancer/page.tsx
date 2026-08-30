import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/empty-state";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { listContracts } from "@/lib/data/contracts";

export default async function FreelancerProjectsPage() {
  const session = await requireRole("FREELANCER");
  const contracts = await listContracts("freelancer", session.userId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeading title="Projects" subtitle="Contracts you are delivering" />
        <Button asChild size="sm">
          <Link href="/freelancer/new">New contract</Link>
        </Button>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Draw up a contract with a client and it appears here. Each of its milestones is funded and released on its own, so a delay on one does not hold up the others."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {contracts.map((contract) => {
            const total = contract.milestones.reduce(
              (sum, m) => sum + m.gross_amount_kurus,
              0,
            );

            return (
              <Card key={contract.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="hover:underline"
                      >
                        {contract.title}
                      </Link>
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {contract.reference} &middot; with {contract.counterpartyName}
                    </p>
                  </div>
                  <Money kurus={total} className="font-medium" />
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {contract.milestones.map((m) => (
                    <StatusBadge key={m.id} status={m.status} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
