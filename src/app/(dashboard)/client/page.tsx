import { EmptyState, PageHeading } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function ClientPaymentsPage() {
  const session = await requireRole("CLIENT");

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title="Payments" subtitle={`${session.email}`} />
      <EmptyState
        title="Nothing to fund"
        description="Milestones waiting to be funded appear here with the amount, the service fee added on top, and the total to transfer into escrow."
      />
    </div>
  );
}
