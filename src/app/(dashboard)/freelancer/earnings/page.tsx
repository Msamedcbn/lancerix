import { EmptyState, PageHeading } from "@/components/empty-state";
import { Money } from "@/components/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { earningsSummary } from "@/lib/data/contracts";

function Stat({
  label,
  kurus,
}: Readonly<{ label: string; kurus: number }>) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-normal">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Money kurus={kurus} className="text-2xl font-semibold" />
      </CardContent>
    </Card>
  );
}

export default async function FreelancerEarningsPage() {
  const session = await requireRole("FREELANCER");
  const summary = await earningsSummary(session.userId);

  const nothingYet = summary.releasedKurus === 0 && summary.lockedKurus === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Earnings"
        subtitle="What has been released, and what is still locked"
      />

      {nothingYet ? (
        <EmptyState
          title="Nothing released yet"
          description="Released milestones are listed here with the stopaj withheld and the net paid out. The service fee is charged to the client and never comes out of this figure."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Paid out" kurus={summary.releasedKurus} />
            <Stat label="Locked in escrow" kurus={summary.lockedKurus} />
            <Stat label="Stopaj withheld" kurus={summary.withheldKurus} />
          </div>

          <p className="text-muted-foreground text-sm">
            Stopaj is not a cost of using this platform. It is withheld at
            source by whoever pays you, and it is credited against your annual
            income tax.
          </p>
        </>
      )}
    </div>
  );
}
