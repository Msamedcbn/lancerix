import { CompanyForm } from "@/app/(dashboard)/client/company/company-form";
import { EmptyState, PageHeading } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function ClientCompanyPage() {
  await requireRole("CLIENT");

  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id, legal_name, vkn, tax_office, address")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Company"
        subtitle="The legal entity every invoice is billed to"
      />

      {company ? null : (
        <EmptyState
          title="No company on file"
          description="A freelancer cannot draw up a contract with you until this exists: the contract has to name the entity that will be invoiced, and its VKN is checked against the tax office's checksum."
        />
      )}

      <CompanyForm company={company ?? null} />
    </div>
  );
}
