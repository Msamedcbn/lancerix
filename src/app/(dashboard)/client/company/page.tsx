import { CompanyForm } from "@/app/(dashboard)/client/company/company-form";
import { EmptyState, PageHeading } from "@/components/page-shell";
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
    <>
      <PageHeading
        title="Şirket"
        subtitle="Faturaların kesileceği tüzel kişilik"
      />

      {company ? null : (
        <EmptyState
          title="Kayıtlı şirket yok"
          description="Bu bilgi girilmeden bir freelancer seninle sözleşme kuramaz: sözleşmenin fatura edilecek tüzel kişiliği adıyla göstermesi gerekir ve VKN, vergi dairesinin kontrol algoritmasıyla doğrulanır."
        />
      )}

      <CompanyForm company={company ?? null} />
    </>
  );
}
