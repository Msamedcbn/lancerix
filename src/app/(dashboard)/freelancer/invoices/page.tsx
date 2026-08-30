import { EmptyState, PageHeading } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function FreelancerInvoicesPage() {
  await requireRole("FREELANCER");

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title="Invoices" subtitle={`Serbest meslek makbuzu history`} />
      <EmptyState
        title="No invoices yet"
        description="An e-SMM is issued for the full contract amount when a milestone is released. The documents and their status will be listed here."
      />
    </div>
  );
}
