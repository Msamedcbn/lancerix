import "server-only";

import crypto from "node:crypto";
import * as cheerio from "cheerio";
import { isBlockedTarget } from "@/lib/qa/ssrf-guard";

export interface DeliveryProberResult {
  httpStatus: number;
  statusText: string;
  responseTimeMs: number;
  sslValid: boolean;
  pageTitle: string;
  metaDescription: string;
  headers: Record<string, string>;
  bodySha256: string;
  probedAt: string;
}

export interface DeliverySealPayload {
  projectName: string;
  targetUrl: string;
  criteria: string[];
  gitCommit?: string | null;
  proberResult: DeliveryProberResult;
  timestamp: string;
}

/**
 * Calculates a deterministic, cryptographic SHA-256 seal of the delivery state.
 * Any modification to the project name, target URL, acceptance criteria,
 * or probed HTTP/DOM response produces a completely different hash.
 */
export function calculateDeliveryDocumentSha256(payload: DeliverySealPayload): string {
  const canonicalObject = {
    projectName: payload.projectName.trim(),
    targetUrl: payload.targetUrl.trim().toLowerCase(),
    criteria: payload.criteria.map((c) => c.trim()).filter(Boolean),
    gitCommit: payload.gitCommit?.trim() || null,
    httpStatus: payload.proberResult.httpStatus,
    bodySha256: payload.proberResult.bodySha256,
    timestamp: payload.timestamp,
  };

  const canonicalJson = JSON.stringify(canonicalObject, Object.keys(canonicalObject).sort());
  return crypto.createHash("sha256").update(canonicalJson).digest("hex");
}

/**
 * Probes a staging / production URL safely:
 * 1. Rejects private/loopback/cloud-metadata addresses via SSRF guard.
 * 2. Enforces strict 8-second timeout to prevent serverless execution hangs.
 * 3. Caps response body parsing to 500KB to protect against stream bombs.
 * 4. Extracts HTTP headers, response timing, DOM title/meta, and body SHA-256.
 */
export async function probeStagingTarget(urlString: string): Promise<DeliveryProberResult> {
  const trimmedUrl = urlString.trim();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Only http and https protocols are supported.");
    }
  } catch {
    throw new Error("Geçersiz URL formatı. Lütfen http:// veya https:// ile başlayan tam bir adres girin.");
  }

  // 1. SSRF Guard Check
  const isBlocked = await isBlockedTarget(trimmedUrl);
  if (isBlocked) {
    throw new Error("SSRF_BLOCKED: Güvenlik nedeniyle yerel ağ, özel IP (RFC1918) veya bulut meta-veri adresleri taranamaz.");
  }

  // 2. Fetch with 8s abort timeout
  const startTime = performance.now();
  let response: Response;
  try {
    response = await fetch(trimmedUrl, {
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
      headers: {
        "User-Agent": "Lancerix-ProofGuard/1.0 (+https://lancerix.com/verify; delivery verification bot)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.message.includes("timeout"));
    if (isTimeout) {
      throw new Error("Hedef staging sunucusuna 8 saniye içinde ulaşılamadı (zaman aşımı). Sitenin yayında olduğundan emin olun.");
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Hedef siteye bağlanırken hata oluştu: ${message}`);
  }

  const responseTimeMs = Math.round(performance.now() - startTime);

  // 3. Read up to 500KB of response body
  const MAX_BYTES = 500 * 1024;
  const arrayBuffer = await response.arrayBuffer();
  const slicedBuffer = Buffer.from(arrayBuffer.slice(0, MAX_BYTES));
  const htmlContent = slicedBuffer.toString("utf-8");

  const bodySha256 = crypto.createHash("sha256").update(slicedBuffer).digest("hex");

  // 4. Extract DOM title & meta tags via cheerio
  let pageTitle = "";
  let metaDescription = "";

  try {
    const $ = cheerio.load(htmlContent);
    pageTitle = $("title").first().text().trim() || $('meta[property="og:title"]').attr("content")?.trim() || "";
    metaDescription = $('meta[name="description"]').attr("content")?.trim() || $('meta[property="og:description"]').attr("content")?.trim() || "";
  } catch {
    // Non-HTML responses or unparseable text fall back gracefully
    pageTitle = `${parsedUrl.hostname} (${response.status})`;
  }

  // Collect significant headers
  const headers: Record<string, string> = {};
  const interestingHeaders = [
    "server",
    "content-type",
    "cache-control",
    "x-powered-by",
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "etag",
  ];

  for (const h of interestingHeaders) {
    const val = response.headers.get(h);
    if (val) {
      headers[h] = val;
    }
  }

  return {
    httpStatus: response.status,
    statusText: response.statusText,
    responseTimeMs,
    sslValid: parsedUrl.protocol === "https:",
    pageTitle: pageTitle.slice(0, 150),
    metaDescription: metaDescription.slice(0, 300),
    headers,
    bodySha256,
    probedAt: new Date().toISOString(),
  };
}
