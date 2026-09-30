import "server-only";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { RawFinding } from "./vuln-engine";

export type RemediationAdvice = {
  summary: string;
  codeSnippet: string;
  frameworkTip: string;
};

/**
 * Uses LLM reasoning to tailor an actionable fix for a discovered security vulnerability,
 * producing concrete code snippets (e.g. Next.js, Express, Nginx) so developers can fix it immediately.
 */
export async function generateRemediationPatch(params: {
  title: string;
  description: string;
  evidence?: string;
  affectedUrl: string;
}): Promise<RemediationAdvice> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: "Zafiyetin kapatılması için ilgili güvenlik başlığını veya yapılandırmayı uygulayın.",
      codeSnippet: "// Güvenlik konfigürasyonunu sunucu veya uygulama middleware düzeyinde etkinleştirin.",
      frameworkTip: "Next.js / Node.js veya ters vekil (Nginx/Cloudflare) ayarlarınızı kontrol edin.",
    };
  }

  try {
    const prompt = `Sen kıdemli bir DevSecOps ve Web Güvenliği uzmanısın.
Aşağıda bir web uygulamasında tespit edilen bir güvenlik açığı verilmiştir.
Geliştiricinin bu açığı doğrudan kopyalayıp yapıştırarak kapatabileceği kesin, modern ve hatasız bir kod yaması (Remediation Patch) üret.

Başlık: ${params.title}
Açıklama: ${params.description}
Kanıt: ${params.evidence || "Belirtilmemiş"}
URL: ${params.affectedUrl}

Lütfen şu formatta JSON döndür:
{
  "summary": "1-2 cümlelik Türkçe kısa onarım özeti",
  "codeSnippet": "Doğrudan kullanılabilecek kod veya sunucu konfigürasyonu",
  "frameworkTip": "Next.js, Node.js veya Nginx için özel tavsiye"
}`;

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.2,
    });

    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return {
      summary: parsed.summary || "Güvenlik açığını kapatmak için önerilen adımları uygulayın.",
      codeSnippet: parsed.codeSnippet || "// Konfigürasyon güncellendi",
      frameworkTip: parsed.frameworkTip || "Framework güvenlik rehberine başvurun.",
    };
  } catch (err) {
    console.error("[remediation-agent] LLM generation failed, using fallback:", err);
    return {
      summary: "Güvenlik kuralını uygulayın ve değişiklikleri test edin.",
      codeSnippet: "// Örnek güvenlik kuralı",
      frameworkTip: "Güvenlik başlıklarını güncelleyin.",
    };
  }
}

function formatRemediationPatch(advice: RemediationAdvice): string {
  return `${advice.summary}\n\n${advice.codeSnippet}\n\n// ${advice.frameworkTip}`;
}

/**
 * Replaces each finding's static remediationPatch (a fixed string hardcoded
 * per finding type in vuln-engine.ts) with an LLM-generated one tailored to
 * the specific URL and evidence -- this was previously unused dead code, so
 * every scan shipped the same handful of generic patches regardless of what
 * was actually found. Runs in parallel; generateRemediationPatch already
 * falls back to a static message on a missing API key or an LLM error, so
 * this never throws and never blocks a scan from completing.
 */
export async function enrichFindingsWithRemediation(
  findings: RawFinding[],
  affectedUrl: string,
): Promise<RawFinding[]> {
  return Promise.all(
    findings.map(async (finding) => {
      const advice = await generateRemediationPatch({
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        affectedUrl,
      });
      return { ...finding, remediationPatch: formatRemediationPatch(advice) };
    }),
  );
}
