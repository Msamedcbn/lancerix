import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type WebhookPayload = {
  userId: string;
  targetName: string;
  targetUrl: string;
  scanId: string;
  healthScore: number;
  grade: string;
  criticalCount: number;
  highCount: number;
  reportUrl: string;
};

/**
 * Dispatches real-time security alerts to configured Slack, Discord, or generic webhooks.
 */
export async function dispatchSecurityWebhook(payload: WebhookPayload): Promise<void> {
  const admin = createAdminClient();

  const { data: integrations, error } = await admin
    .from("security_integrations")
    .select("provider, webhook_url, notify_on_critical, notify_on_scan_complete")
    .eq("user_id", payload.userId)
    .eq("is_active", true);

  if (error || !integrations || integrations.length === 0) {
    return;
  }

  for (const item of integrations) {
    // Check filters
    if (payload.criticalCount > 0 && !item.notify_on_critical) continue;
    if (payload.criticalCount === 0 && !item.notify_on_scan_complete) continue;

    try {
      if (item.provider === "SLACK") {
        const slackBody = {
          text: `🚨 Lancerix Güvenlik Uyarısı: ${payload.targetName} üzerinde ${payload.criticalCount} kritik açık tespit edildi!`,
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: "🛡️ Lancerix Otonom Pentest Raporu" },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Hedef:*\n\`${payload.targetUrl}\`` },
                { type: "mrkdwn", text: `*Güvenlik Skoru:*\n%${payload.healthScore} (${payload.grade})` },
                { type: "mrkdwn", text: `*Kritik Açıklar:*\n${payload.criticalCount}` },
                { type: "mrkdwn", text: `*Yüksek Risk:*\n${payload.highCount}` },
              ],
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "Raporu & Yamaları İncele" },
                  url: payload.reportUrl,
                  style: "primary",
                },
              ],
            },
          ],
        };

        await fetch(item.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackBody),
          signal: AbortSignal.timeout(6000),
        });
      } else if (item.provider === "DISCORD") {
        const discordBody = {
          content: `🚨 **Lancerix Güvenlik Uyarısı:** ${payload.targetName}`,
          embeds: [
            {
              title: "Otonom Pentest Denetimi Tamamlandı",
              url: payload.reportUrl,
              color: payload.criticalCount > 0 ? 0xef4444 : 0x10b981,
              fields: [
                { name: "Hedef URL", value: payload.targetUrl, inline: true },
                { name: "Güvenlik Skoru", value: `%${payload.healthScore} (${payload.grade})`, inline: true },
                { name: "Kritik Bulgular", value: `${payload.criticalCount}`, inline: true },
              ],
              footer: { text: "Lancerix Autonomous Security Agent" },
            },
          ],
        };

        await fetch(item.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordBody),
          signal: AbortSignal.timeout(6000),
        });
      } else {
        // Generic Webhook
        await fetch(item.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(6000),
        });
      }
    } catch (err) {
      console.error(`[dispatchSecurityWebhook] Failed to send to ${item.provider}:`, err);
    }
  }
}
