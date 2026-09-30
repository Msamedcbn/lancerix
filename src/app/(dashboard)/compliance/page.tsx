import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Plus, ArrowRight } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { evaluateCompliance } from "@/lib/security/compliance";
import { ComplianceView } from "./compliance-client";

export const metadata: Metadata = {
  title: "Uyumluluk & Standartlar Matrisi (SOC 2 / OWASP) — Lancerix",
};

export default async function CompliancePage() {
  const session = await requireSession();
  const supabase = await createClient();

  // Fetch user targets
  const { data: targets } = await supabase
    .from("security_targets")
    .select(`
      id,
      name,
      target_url,
      is_verified,
      security_scans (
        id,
        health_score,
        status,
        created_at,
        security_vulnerabilities (
          title,
          category,
          severity
        )
      )
    `)
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const targetList = targets || [];

  if (targetList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
        <ShieldCheck className="size-14 text-muted-foreground" />
        <h2 className="mt-4 text-base font-semibold text-foreground">Uyumluluk Denetimi İçin Hedef Ekleyin</h2>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          SOC 2 ve OWASP Top 10 uyumluluk değerlendirmesini hesaplamak için önce bir web uygulaması veya API hedefi tanımlayınız.
        </p>
        <Link
          href="/targets/new"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="size-4" /> Hedef Tanımla
        </Link>
      </div>
    );
  }

  const primaryTarget = targetList[0]!;
  const latestScan = primaryTarget.security_scans?.[0];
  const vulns = (latestScan?.security_vulnerabilities || []) as {
    title: string;
    category: string;
    severity: string;
  }[];

  const evaluation = evaluateCompliance(vulns);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
          Kurumsal Denetim Standartları (SOC 2 & OWASP)
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Uyumluluk & Standartlar Matrisi
        </h1>
        <p className="text-xs text-muted-foreground">
          Sistemlerinizin SOC 2 Type II güvenlik kriterlerine ve OWASP Top 10 standartlarına uyumluluk hazırlığı.
        </p>
      </div>

      <ComplianceView
        evaluation={evaluation}
        targetName={primaryTarget.name}
        targetUrl={primaryTarget.target_url}
      />
    </div>
  );
}
