import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, ArrowRight } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Severity, VulnerabilityCategory } from "@/lib/security/types";
import { VulnerabilityCard } from "@/app/(dashboard)/scans/[id]/scan-terminal";

export const metadata: Metadata = {
  title: "Zafiyetler & Yamalar — Lancerix",
};

export default async function VulnerabilitiesPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: vulns, error } = await supabase
    .from("security_vulnerabilities")
    .select(`
      id,
      title,
      description,
      severity,
      category,
      cvss_score,
      affected_url,
      evidence,
      remediation_patch,
      status,
      created_at,
      security_targets (
        id,
        name,
        target_url
      )
    `)
    .eq("status", "OPEN")
    .order("cvss_score", { ascending: false });

  const list = vulns || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Zafiyetler & Otomatik Yamalar
        </h1>
        <p className="text-sm text-muted-foreground">
          Tüm hedeflerinizde tespit edilen açıklar ve Lancerix AI tarafından üretilen kod düzeyinde onarım önerileri.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-12 text-center">
          <ShieldCheck className="size-12 text-emerald-400" />
          <h2 className="mt-4 text-base font-semibold text-foreground">Açık Güvenlik Zafiyeti Bulunmuyor</h2>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Sistemleriniz temiz görünüyor. Yeni bir hedef ekleyerek veya mevcut hedeflerde tarama başlatarak durumu güncel tutabilirsiniz.
          </p>
          <Link
            href="/targets"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Hedefleri Yönet
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((v) => (
            <VulnerabilityCard
              key={v.id}
              vuln={{
                ...v,
                severity: v.severity as Severity,
                category: v.category as VulnerabilityCategory,
                cvss_score: v.cvss_score ?? 0,
                evidence: v.evidence ?? undefined,
                remediation_patch: v.remediation_patch ?? undefined,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
