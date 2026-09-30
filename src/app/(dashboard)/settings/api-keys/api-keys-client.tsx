"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Calendar,
  Clock,
  Shield,
  Loader2,
  Code,
  FileCode,
  ExternalLink,
} from "lucide-react";

import {
  createApiKeyAction,
  revokeApiKeyAction,
  type ApiKeyInfo,
} from "@/app/(dashboard)/api-key-actions";

export function ApiKeysManager({ initialKeys }: { initialKeys: ApiKeyInfo[] }) {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyInfo[]>(initialKeys);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const sampleYaml = `name: Lancerix AI Security Audit

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Run Lancerix Autonomous Pentest
        run: |
          RESPONSE=$(curl -s -X POST https://lancerix.com/api/v1/scan \\
            -H "Authorization: Bearer \${{ secrets.LANCERIX_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"targetUrl": "https://staging.sirketiniz.com"}')
          
          echo "$RESPONSE"
          SCORE=$(echo "$RESPONSE" | grep -o '"healthScore":[0-9]*' | cut -d: -f2)
          echo "Lancerix Güvenlik Skoru: %$SCORE"
          
          if [ "$SCORE" -lt 70 ]; then
            echo "❌ Güvenlik skoru %70'in altında! Kritik açıklar mevcut."
            exit 1
          fi`;

  const sampleCurl = `curl -X POST https://lancerix.com/api/v1/scan \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"targetUrl": "https://app.sirketiniz.com"}'`;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;

    setCreating(true);
    const res = await createApiKeyAction(keyName || "CI/CD Pipeline Key");
    setCreating(false);

    if (res.success) {
      setNewlyCreatedKey(res.rawKey);
      setKeys([res.keyInfo, ...keys]);
      setKeyName("");
      router.refresh();
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm("Bu API anahtarını iptal etmek istediğinize emin misiniz?")) return;
    setRevokingId(keyId);
    const res = await revokeApiKeyAction(keyId);
    setRevokingId(null);

    if (res.success) {
      setKeys(keys.filter((k) => k.id !== keyId));
      router.refresh();
    }
  }

  function copyText(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Create Key Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-5 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Key className="size-4 text-primary" /> Yeni API Anahtarı Oluştur
          </h2>
          <p className="text-xs text-muted-foreground">
            GitHub Actions, GitLab CI veya sunucu komut satırınızdan (cURL) otonom taramalar başlatmak için anahtar üretin.
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Anahtar etiketi (örn: GitHub Actions Staging)"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Anahtar Üret
          </button>
        </form>

        {/* Modal-like One-time Secret Display */}
        {newlyCreatedKey && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
            <span className="text-xs font-semibold text-emerald-400 block">
              ✅ API Anahtarınız Oluşturuldu! (Lütfen Şimdi Kopyalayın)
            </span>
            <p className="text-[11px] text-muted-foreground">
              Bu anahtar bir daha görüntülenmeyecektir. Güvenli bir ortamda veya GitHub Secrets içerisinde saklayınız.
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-zinc-950 px-3 py-2 font-mono text-xs text-emerald-300">
              <span className="truncate">{newlyCreatedKey}</span>
              <button
                onClick={() => copyText(newlyCreatedKey, setCopiedKey)}
                className="ml-3 shrink-0 text-zinc-400 hover:text-white"
              >
                {copiedKey ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Keys Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Aktif API Anahtarlarınız</h3>

        {keys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-card/40 p-8 text-center text-xs text-muted-foreground">
            Henüz bir API anahtarı üretilmedi. CI/CD otomasyonu için yukarıdan bir anahtar oluşturabilirsiniz.
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card overflow-hidden">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{k.name}</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {k.keyPrefix}
                    </code>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" /> Oluşturulma:{" "}
                      {new Date(k.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> Son Kullanım:{" "}
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("tr-TR") : "Henüz kullanılmadı"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(k.id)}
                  disabled={revokingId === k.id}
                  className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-medium self-end sm:self-auto"
                >
                  <Trash2 className="size-3.5" /> İptal Et
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GitHub Actions Snippet */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileCode className="size-4 text-primary" /> GitHub Actions Entegrasyonu
            </h3>
            <p className="text-xs text-muted-foreground">
              Her Pull Request veya deployment sonrasında otonom pentest koşturmak için aşağıdaki workflow dosyasını deponuza ekleyin:
            </p>
          </div>

          <button
            onClick={() => copyText(sampleYaml, setCopiedYaml)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
          >
            {copiedYaml ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            YAML Kopyala
          </button>
        </div>

        <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
          <code>{sampleYaml}</code>
        </pre>
      </div>

      {/* cURL Snippet */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Code className="size-4 text-primary" /> cURL / Komut Satırı Örneği
          </span>
          <button
            onClick={() => copyText(sampleCurl, setCopiedCurl)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {copiedCurl ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            Kopyala
          </button>
        </div>
        <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
          <code>{sampleCurl}</code>
        </pre>
      </div>
    </div>
  );
}
