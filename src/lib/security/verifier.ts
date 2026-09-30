import "server-only";

import dns from "node:dns/promises";
import * as cheerio from "cheerio";
import { isBlockedTarget } from "@/lib/qa/ssrf-guard";

export type VerificationResult = {
  verified: boolean;
  message: string;
  foundValue?: string;
};

/**
 * Verifies that the user owns or controls the target domain before running audits.
 * Supports DNS TXT record or HTML meta tag verification.
 */
export async function verifyTargetOwnership(
  targetUrl: string,
  verificationToken: string,
  method: "DNS_TXT" | "META_TAG" | "MANUAL_EXEMPT"
): Promise<VerificationResult> {
  if (method === "MANUAL_EXEMPT") {
    return { verified: true, message: "Manuel muafiyet doğrulandı." };
  }

  let hostname: string;
  try {
    hostname = new URL(targetUrl).hostname;
  } catch {
    return { verified: false, message: "Geçersiz hedef URL." };
  }

  // Prevent SSRF on verification requests
  if (await isBlockedTarget(targetUrl)) {
    return { verified: false, message: "Hedef özel veya yerel bir ağ adresine çözümleniyor." };
  }

  if (method === "DNS_TXT") {
    const recordName = `_lancerix-challenge.${hostname}`;
    try {
      const records = await dns.resolveTxt(recordName);
      const flattened = records.map((entry) => entry.join(""));
      const expectedPrefix = `lancerix-verify=${verificationToken}`;

      const matched = flattened.find((r) => r.trim() === expectedPrefix || r.includes(verificationToken));
      if (matched) {
        return { verified: true, message: "DNS TXT kaydı başarıyla doğrulandı.", foundValue: matched };
      }
      return {
        verified: false,
        message: `${recordName} üzerinde beklenen DNS TXT kaydı ('${expectedPrefix}') bulunamadı.`,
      };
    } catch (err: unknown) {
      const errCode = (err as { code?: string })?.code;
      if (errCode === "ENOTFOUND" || errCode === "ENODATA") {
        return {
          verified: false,
          message: `${recordName} için DNS TXT kaydı henüz tespit edilemedi (DNS yayılımı 5-15 dakika sürebilir).`,
        };
      }
      return {
        verified: false,
        message: `DNS sorgulama hatası: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (method === "META_TAG") {
    try {
      const res = await fetch(targetUrl, {
        headers: { "User-Agent": "Lancerix-Security-Verification/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        return { verified: false, message: `Hedef web sitesine erişilemedi (HTTP ${res.status}).` };
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const tagContent = $('meta[name="lancerix-site-verification"]').attr("content");

      if (tagContent && tagContent.trim() === verificationToken) {
        return { verified: true, message: "HTML meta etiketi başarıyla doğrulandı." };
      }

      return {
        verified: false,
        message:
          'HTML sayfa başlığında (<head>) <meta name="lancerix-site-verification" content="' +
          verificationToken +
          '" /> etiketi bulunamadı.',
      };
    } catch (err: unknown) {
      return {
        verified: false,
        message: `Web sayfası çekilemedi: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  return { verified: false, message: "Bilinmeyen doğrulama yöntemi." };
}
