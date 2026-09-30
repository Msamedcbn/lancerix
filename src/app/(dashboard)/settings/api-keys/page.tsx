import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Key } from "lucide-react";
import { listApiKeysAction } from "@/app/(dashboard)/api-key-actions";
import { ApiKeysManager } from "./api-keys-client";

export const metadata: Metadata = {
  title: "API Anahtarları & CI/CD Entegrasyonu — Lancerix",
};

export default async function ApiKeysPage() {
  const keys = await listApiKeysAction();

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
          <Key className="size-6 text-primary" /> API Anahtarları & CI/CD Entegrasyonu
        </h1>
        <p className="text-xs text-muted-foreground">
          Sürekli entegrasyon (CI/CD) süreçlerinize Lancerix otonom sızma testlerini dahil edin, güvensiz kodları üretime çıkmadan engelleyin.
        </p>
      </div>

      <ApiKeysManager initialKeys={keys} />
    </div>
  );
}
