import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/empty-state";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { listDisputes } from "@/lib/data/contracts";

export default async function AdminDisputesPage() {
  await requireRole("ADMIN");
  const disputes = await listDisputes();

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Disputes"
        subtitle="Milestones a party has escalated"
      />

      {disputes.length === 0 ? (
        <EmptyState
          title="No open disputes"
          description="A disputed milestone can only end in a release or a cancellation, and only an administrator may resolve it. Open disputes appear here with both parties' accounts."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {disputes.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    {d.milestone ? (
                      <Link
                        href={`/contracts/${d.milestone.contract_id}`}
                        className="hover:underline"
                      >
                        {d.milestone.title}
                      </Link>
                    ) : (
                      "Milestone"
                    )}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Opened {d.created_at.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{d.status}</Badge>
                  {d.milestone ? <StatusBadge status={d.milestone.status} /> : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm whitespace-pre-wrap">{d.reason}</p>
                {d.milestone ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount at stake</span>
                    <Money kurus={d.milestone.gross_amount_kurus} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
