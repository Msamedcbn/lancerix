import { EmptyState, PageHeading } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function ClientApprovalsPage() {
  await requireRole("CLIENT");

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title="Approvals" subtitle={`Delivered work waiting on you`} />
      <EmptyState
        title="Nothing waiting"
        description="A delivery lands here with the time left to object. If the window passes without an objection the payment is released automatically -- that clock is the point of the contract."
      />
    </div>
  );
}
