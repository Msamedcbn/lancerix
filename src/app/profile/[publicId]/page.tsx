import { notFound } from "next/navigation";
import { User, Briefcase, Calendar, Hash, MapPin, Globe, CheckCircle2, Star } from "lucide-react";
import { PageHeading } from "@/components/page-shell";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  
  // This page is public and the admin client bypasses RLS, so the select is a
  // hand-written allow-list rather than `*`. A profiles row carries the TCKN
  // and the IBAN; naming the columns is what keeps them from ever being read
  // here, the same reason party_display_names() and contract_company() select
  // columns instead of rows.
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "public_id, full_name, role, created_at, companies(id, legal_name, vkn, tax_office)",
    )
    .eq("public_id", publicId)
    .single();

  if (!profile) {
    notFound();
  }

  const roleText = profile.role === "FREELANCER" ? "Freelancer" : 
                   profile.role === "CLIENT" ? "Müşteri" : "Yönetici";

  return (
    <div className="flex flex-col gap-8 pb-12 fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/90 p-8 sm:p-12 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:shadow-zinc-950/40">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-50"></div>
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-3xl font-bold text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 shadow-inner">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand dark:bg-brand/20 mb-3">
              <Star className="size-3.5 fill-current" />
              <span>Doğrulanmış Profil</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
              {profile.full_name}
            </h1>
            <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400 flex items-center justify-center sm:justify-start gap-4">
              <span className="flex items-center gap-1.5"><Briefcase className="size-4" /> {roleText}</span>
              <span className="flex items-center gap-1.5"><Hash className="size-4" /> {profile.public_id}</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Bento Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <div className="group relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/30 to-zinc-100/50 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-md dark:border-zinc-800/80 dark:from-zinc-900/90 dark:via-zinc-900/50 dark:to-zinc-950 md:col-span-1">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            <User className="size-5 text-brand" /> 
            Genel Bilgiler
          </h2>
          <dl className="grid grid-cols-1 gap-y-5">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Hash className="size-4" /> ID
              </dt>
              <dd className="font-mono text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {profile.public_id}
              </dd>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Calendar className="size-4" /> Katılım
              </dt>
              <dd className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {new Date(profile.created_at).toLocaleDateString("tr-TR")}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <CheckCircle2 className="size-4" /> Durum
              </dt>
              <dd className="text-sm font-medium text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-md">
                Aktif
              </dd>
            </div>
          </dl>
        </div>

        {/* Companies Grid */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            <Briefcase className="size-5 text-brand" /> 
            Bağlı Şirketler
          </h2>
          
          {profile.companies && profile.companies.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.companies.map((company) => (
                <div 
                  key={company.id} 
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:border-brand/40"
                >
                  <div className="absolute -right-4 -top-4 size-16 rounded-full bg-brand/5 transition-transform duration-300 group-hover:scale-150"></div>
                  <h3 className="font-semibold text-zinc-950 dark:text-zinc-50 line-clamp-1 mb-4 relative z-10">
                    {company.legal_name}
                  </h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm relative z-10">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg">
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-1">
                        VKN / TCKN
                      </dt>
                      <dd className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{company.vkn || "-"}</dd>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg">
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-1">
                        Vergi Dairesi
                      </dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{company.tax_office || "-"}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200/80 bg-zinc-50/50 p-12 text-center dark:border-zinc-800/80 dark:bg-zinc-900/20">
              <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                <Briefcase className="size-6 opacity-50" />
              </div>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Bu profile bağlı bir şirket bulunmuyor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
