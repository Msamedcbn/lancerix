import "server-only";

import { isBlockedTarget } from "@/lib/qa/ssrf-guard";

export type DeliveryProbeResult = {
  targetUrl: string;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  isHttps: boolean;
  serverBanner?: string;
  timestamp: string;
  healthy: boolean;
  message: string;
};

/**
 * Actively probes a delivered staging URL to verify that it is live,
 * responsive, and secure. Serves as timestamped uptime and availability evidence
 * during the client's 7-day review window.
 */
export async function probeDeliveryTarget(targetUrl: string): Promise<DeliveryProbeResult> {
  if (await isBlockedTarget(targetUrl)) {
    return {
      targetUrl,
      statusCode: 0,
      statusText: "SSRF_BLOCKED",
      latencyMs: 0,
      isHttps: targetUrl.startsWith("https://"),
      timestamp: new Date().toISOString(),
      healthy: false,
      message: "Hedef adres güvenlik politikaları nedeniyle sorgulanamadı (Yerel/Özel IP).",
    };
  }

  const start = performance.now();
  const isHttps = targetUrl.startsWith("https://");

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Lancerix-ProofGuard/2.0 (Autonomous Technical Verification Probe)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    const latencyMs = Math.round(performance.now() - start);
    const healthy = response.status >= 200 && response.status < 400;
    const serverBanner = response.headers.get("server") ?? undefined;

    return {
      targetUrl,
      statusCode: response.status,
      statusText: response.statusText || (healthy ? "OK" : "ERROR"),
      latencyMs,
      isHttps,
      serverBanner,
      timestamp: new Date().toISOString(),
      healthy,
      message: healthy
        ? `Hedef sistem aktif ve yanıt veriyor (HTTP ${response.status}, ${latencyMs}ms gecikme).`
        : `Hedef sistem hata kodu döndürdü (HTTP ${response.status}).`,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const errMessage = err instanceof Error ? err.message : String(err);

    return {
      targetUrl,
      statusCode: 0,
      statusText: "UNREACHABLE",
      latencyMs,
      isHttps,
      timestamp: new Date().toISOString(),
      healthy: false,
      message: `Hedef sisteme ulaşılamadı (${errMessage}).`,
    };
  }
}
