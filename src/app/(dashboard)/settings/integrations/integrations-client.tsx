"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Plus,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Globe,
} from "lucide-react";

import {
  createIntegrationAction,
  deleteIntegrationAction,
  testWebhookAction,
  type IntegrationItem,
} from "@/app/(dashboard)/integrations-actions";

export function IntegrationsManager({ initialItems }: { initialItems: IntegrationItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<IntegrationItem[]>(initialItems);
  const [creating, setCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const res = await createIntegrationAction(formData);
    setCreating(false);

    if (res.success) {
      setFeedback("Entegrasyon başarıyla eklendi.");
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      setError(res.error || "Hata oluştu.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu entegrasyonu silmek istediğinize emin misiniz?")) return;
    await deleteIntegrationAction(id);
    setItems(items.filter((i) => i.id !== id));
    router.refresh();
  }

  async function handleTest(id: string) {
    setTestingId(id);
    const res = await testWebhookAction(id);
    setTestingId(null);
    setFeedback(res.message);
  }

  return (
    <div className="space-y-8">
      {feedback && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 font-medium">
          {feedback}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* Add New Integration Form */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-5 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Plus className="size-4 text-primary" /> Yeni Bildirim Kanalı Bağla
          </h2>
          <p className="text-xs text-muted-foreground">
            Kritik güvenlik açıklarında veya tamamlanan taramalarda Slack ya da Discord kanalınıza zengin kartlar gönderin.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Sağlayıcı</label>
              <select
                name="provider"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="SLACK">Slack Incoming Webhook</option>
                <option value="DISCORD">Discord Webhook</option>
                <option value="GENERIC_WEBHOOK">Özel Webhook (Generic JSON)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Kanal / Etiket Adı</label>
              <input
                type="text"
                name="name"
                defaultValue="#security-alerts"
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Webhook URL Adresi</label>
              <input
                type="url"
                name="webhookUrl"
                placeholder="https://hooks.slack.com/services/..."
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              Kanalı Bağla
            </button>
          </div>
        </form>
      </div>

      {/* Connected Integrations List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Bağlı Bildirim Kanalları</h3>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-card/40 p-8 text-center text-xs text-muted-foreground">
            Henüz bir Slack veya Discord webhooku eklenmedi.
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card overflow-hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                      {item.provider}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground truncate max-w-md">
                    {item.webhookUrl}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    onClick={() => handleTest(item.id)}
                    disabled={testingId === item.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-all"
                  >
                    {testingId === item.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3" />
                    )}
                    Test Gönder
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
