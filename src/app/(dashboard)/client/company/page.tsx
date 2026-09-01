import { Building2 } from "lucide-react";

import { CompanyForm } from "@/app/(dashboard)/client/company/company-form";
import { EmptyState, PageHeading, Panel } from "@/components/page-shell";
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

  const billingComplete = Boolean(company?.vkn && company?.tax_office && company?.address);
  const initial = company?.legal_name?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <>
      <PageHeading
        title="Şirket"
        subtitle="Faturaların kesileceği tüzel kişilik"
      />

      {company ? (
        <div className="fade-in flex flex-col gap-5 rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-4">
            <span className="bg-brand text-brand-foreground flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold">
              {initial}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {company.legal_name}
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {company.vkn ? `VKN ${company.vkn}` : "VKN girilmedi"}
                {company.tax_office ? ` · ${company.tax_office}` : ""}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              billingComplete
                ? "bg-brand-muted text-brand"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
            }`}
          >
            {billingComplete ? "Fatura bilgileri tam" : "Fatura bilgileri eksik"}
          </span>
        </div>
      ) : (
        <div className="fade-in flex items-center gap-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/20">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <Building2 className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
              Kayıtlı şirket yok
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Aşağıdaki formu doldurarak ekle.
            </p>
          </div>
        </div>
      )}

      {company ? null : (
        <EmptyState
          title="Neden gerekli?"
          description="En azından ticaret unvanı girilmeden bir freelancer seninle sözleşme kuramaz: sözleşme bu tüzel kişilik adına düzenlenir. VKN, vergi dairesi ve fatura adresi QA testi için gerekmez — fatura kesilmeye başlandığında istenir."
        />
      )}

      <Panel title={company ? "Bilgileri düzenle" : "Şirket ekle"}>
        <CompanyForm company={company ?? null} />
      </Panel>
    </>
  );
}
