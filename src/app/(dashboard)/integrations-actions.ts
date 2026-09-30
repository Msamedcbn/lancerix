"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dispatchSecurityWebhook } from "@/lib/notify/webhook";

export type IntegrationItem = {
  id: string;
  provider: "SLACK" | "DISCORD" | "GENERIC_WEBHOOK";
  name: string;
  webhookUrl: string;
  isActive: boolean;
  notifyOnCritical: boolean;
  notifyOnScanComplete: boolean;
  createdAt: string;
};

export async function listIntegrationsAction(): Promise<IntegrationItem[]> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("security_integrations")
    .select("id, provider, name, webhook_url, is_active, notify_on_critical, notify_on_scan_complete, created_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id,
    provider: d.provider as IntegrationItem["provider"],
    name: d.name,
    webhookUrl: d.webhook_url,
    isActive: d.is_active,
    notifyOnCritical: d.notify_on_critical,
    notifyOnScanComplete: d.notify_on_scan_complete,
    createdAt: d.created_at,
  }));
}

export async function createIntegrationAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();
  const provider = (String(formData.get("provider") || "SLACK") as "SLACK" | "DISCORD" | "GENERIC_WEBHOOK");
  const name = String(formData.get("name") || "Security Alerts").trim();
  const webhookUrl = String(formData.get("webhookUrl") || "").trim();

  if (!webhookUrl.startsWith("http://") && !webhookUrl.startsWith("https://")) {
    return { success: false, error: "Geçerli bir webhook URL adresi giriniz." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("security_integrations").insert({
    user_id: session.userId,
    provider,
    name,
    webhook_url: webhookUrl,
    is_active: true,
    notify_on_critical: true,
    notify_on_scan_complete: true,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/integrations");
  return { success: true };
}

export async function deleteIntegrationAction(id: string): Promise<{ success: boolean }> {
  const session = await requireSession();
  const supabase = await createClient();

  await supabase
    .from("security_integrations")
    .delete()
    .eq("id", id)
    .eq("user_id", session.userId);

  revalidatePath("/settings/integrations");
  return { success: true };
}

export async function testWebhookAction(id: string): Promise<{ success: boolean; message: string }> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("security_integrations")
    .select("provider, webhook_url")
    .eq("id", id)
    .eq("user_id", session.userId)
    .single();

  if (!item) return { success: false, message: "Entegrasyon bulunamadı." };

  await dispatchSecurityWebhook({
    userId: session.userId,
    targetName: "Test Target",
    targetUrl: "https://example.com",
    scanId: "test-scan",
    healthScore: 92,
    grade: "A",
    criticalCount: 0,
    highCount: 1,
    reportUrl: "https://lancerix.com",
  });

  return { success: true, message: "Test bildirimi gönderildi!" };
}
