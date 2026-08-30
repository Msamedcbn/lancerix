import { EmptyState, PageHeading } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function ClientInvoicesPage() {
  await requireRole("CLIENT");

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title="Invoices" subtitle={`Documents issued to your company`} />
      <EmptyState
        title="No invoices yet"
        description="One invoice per released milestone, issued to the company on the contract, covering both the freelancer's fee and the platform's service fee."
      />
    </div>
  );
}
