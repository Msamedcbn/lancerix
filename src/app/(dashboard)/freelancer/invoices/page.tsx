import { EmptyState, PageHeading } from "@/components/empty-state";
import { Money } from "@/components/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { earningsSummary, kurus } from "@/lib/data/contracts";

export default async function FreelancerInvoicesPage() {
  const session = await requireRole("FREELANCER");
  const { released } = await earningsSummary(session.userId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Invoices"
        subtitle="Serbest meslek makbuzu basis, per released milestone"
      />

      {released.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="An e-SMM is issued for the full contract amount when a milestone is released. Until the e-invoicing integration exists these rows are the basis to issue one from, which is what a concierge run needs."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {released.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{m.title}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {m.contract.reference}
                  {m.released_at
                    ? ` · released ${m.released_at.slice(0, 10)}`
                    : ""}
                </p>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-1 text-sm sm:grid-cols-3">
                  <div className="flex justify-between sm:pr-6">
                    <dt className="text-muted-foreground">SMM amount</dt>
                    <dd>
                      <Money kurus={m.gross_amount_kurus} />
                    </dd>
                  </div>
                  <div className="flex justify-between sm:px-3">
                    <dt className="text-muted-foreground">Stopaj</dt>
                    <dd>
                      <Money
                        kurus={kurus(
                          m.tax_withholding_kurus,
                          "tax_withholding_kurus",
                        )}
                      />
                    </dd>
                  </div>
                  <div className="flex justify-between font-medium sm:pl-6">
                    <dt>Net</dt>
                    <dd>
                      <Money
                        kurus={kurus(
                          m.freelancer_net_kurus,
                          "freelancer_net_kurus",
                        )}
                      />
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
