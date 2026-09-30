import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BellRing } from "lucide-react";
import { listIntegrationsAction } from "@/app/(dashboard)/integrations-actions";
import { IntegrationsManager } from "./integrations-client";

export const metadata: Metadata = {
  title: "Bildirim & Webhook Entegrasyonları — Lancerix",
};

export default async function IntegrationsPage() {
  const items = await listIntegrationsAction();

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Güvenlik Merkezine Dön
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <BellRing className="size-6 text-primary" /> Webhook & Bildirim Entegrasyonları
        </h1>
        <p className="text-xs text-muted-foreground">
          Slack, Discord veya özel webhook uç noktalarınıza kritik zafiyet uyarılarını ve otonom tarama sonuçlarını anlık aktarın.
        </p>
      </div>

      <IntegrationsManager initialItems={items} />
    </div>
  );
}
