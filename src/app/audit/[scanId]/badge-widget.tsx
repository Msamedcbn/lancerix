"use client";

import { useState } from "react";
import { Copy, Check, Code, Printer, Shield } from "lucide-react";

export function PublicAuditBadgeWidget({
  targetId,
  targetName,
  score,
  grade,
}: {
  targetId: string;
  targetName: string;
  score: number;
  grade: string;
}) {
  const [copiedType, setCopiedType] = useState<"html" | "markdown" | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://lancerix.com";
  const badgeUrl = `${baseUrl}/api/badge/${targetId}`;
  const reportUrl = typeof window !== "undefined" ? window.location.href : `${baseUrl}/audit`;

  const htmlSnippet = `<a href="${reportUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${badgeUrl}" alt="${targetName} Lancerix Security Grade" />\n</a>`;
  const mdSnippet = `[![${targetName} Lancerix Security](${badgeUrl})](${reportUrl})`;

  function copyCode(text: string, type: "html" | "markdown") {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Sitenize Güvenlik Rozeti Ekleyin</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Web sitenizin altbilgisine (footer) veya README dosyanıza canlı güvenlik skorunuzu gösteren mühür rozetini ekleyin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
          >
            <Printer className="size-3.5" /> PDF Yazdır
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <div className="rounded-lg border border-border bg-background p-2">
          {/* Live badge preview */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgeUrl} alt="Lancerix Badge Preview" className="h-6" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => copyCode(htmlSnippet, "html")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-all"
          >
            {copiedType === "html" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            HTML Kodu Kopyala
          </button>

          <button
            onClick={() => copyCode(mdSnippet, "markdown")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-all"
          >
            {copiedType === "markdown" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            Markdown Kodu Kopyala
          </button>
        </div>
      </div>
    </div>
  );
}
