import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getAgencyBrandingAction, hasActiveAgencySubscription } from "@/app/(dashboard)/agency-branding-actions";
import { WhiteLabelManager } from "./white-label-client";

export const metadata: Metadata = {
  title: "White-Label Ajans Markalama — Lancerix",
};

export default async function WhiteLabelPage() {
  const session = await requireSession();
  const [branding, isSubscribed] = await Promise.all([
    getAgencyBrandingAction(),
    hasActiveAgencySubscription(session.userId),
  ]);

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
          <Sparkles className="size-6 text-primary" /> White-Label Ajans Markalama
        </h1>
        <p className="text-xs text-muted-foreground">
          Müşterilerinize sunduğunuz kamuya açık denetim raporlarında ve rozetlerde Lancerix yerine kendi ajans logonuzu, renklerinizi ve onay mührünüzü kullanın. Ajans planının (₺3.500/ay) bir özelliğidir.
        </p>
      </div>

      {!isSubscribed && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Aktif Ajans aboneliğiniz yok.</span> Aşağıdaki ayarları
          hazırlayabilirsiniz ama etkinleştirmek için önce{" "}
          <Link href="/izleme" className="font-semibold text-primary hover:underline">
            Ajans planına abone olmanız
          </Link>{" "}
          gerekir.
        </div>
      )}

      <WhiteLabelManager initialBranding={branding} isSubscribed={isSubscribed} />
    </div>
  );
}
