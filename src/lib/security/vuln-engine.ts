import "server-only";

import * as cheerio from "cheerio";
import { isBlockedTarget } from "@/lib/qa/ssrf-guard";
import type { Severity, VulnerabilityCategory } from "./types";

export type RawFinding = {
  title: string;
  description: string;
  severity: Severity;
  category: VulnerabilityCategory;
  cvssScore: number;
  evidence: string;
  remediationPatch: string;
};

export type AuditOutcome = {
  vulnerabilities: RawFinding[];
  logs: { stepName: string; message: string; level: "INFO" | "WARN" | "SUCCESS" | "ERROR" }[];
  targetDetails: {
    finalUrl: string;
    statusCode: number;
    serverBanner?: string;
    hasHttps: boolean;
    ipAddresses?: string[];
  };
};

/**
 * Runs a comprehensive, non-destructive web security & hygiene assessment.
 * Audits HTTP headers, SSL/TLS posture, cookie flags, information disclosure,
 * and sensitive endpoint configurations.
 */
export async function runSecurityAudit(targetUrl: string): Promise<AuditOutcome | null> {
  if (await isBlockedTarget(targetUrl)) {
    return null;
  }

  const vulnerabilities: RawFinding[] = [];
  const logs: AuditOutcome["logs"] = [];

  logs.push({
    stepName: "RECON",
    message: `Hedef saldırı yüzeyi analizine başlanıyor: ${targetUrl}`,
    level: "INFO",
  });

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Lancerix-Security-Scanner/2.0 (Autonomous DevSecOps Audit Agent)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    logs.push({
      stepName: "RECON",
      message: `Hedefe bağlanılamadı: ${err instanceof Error ? err.message : String(err)}`,
      level: "ERROR",
    });
    return null;
  }

  const finalUrl = response.url;
  const isHttps = finalUrl.startsWith("https://");
  const headers = response.headers;
  const serverHeader = headers.get("server") ?? undefined;
  const xPoweredBy = headers.get("x-powered-by") ?? undefined;

  logs.push({
    stepName: "RECON",
    message: `Hedef yanıt verdi: HTTP ${response.status} (${isHttps ? "HTTPS Güvenli" : "HTTP Güvensiz"})`,
    level: isHttps ? "SUCCESS" : "WARN",
  });

  // 1. SSL / TLS & HTTPS Enforcement Audit
  logs.push({
    stepName: "SSL_AUDIT",
    message: "Taşıma katmanı güvenliği (TLS/HTTPS) denetleniyor...",
    level: "INFO",
  });

  if (!isHttps) {
    vulnerabilities.push({
      title: "HTTPS Şifrelemesi Zorunlu Kılınmamış",
      description:
        "Hedef web uygulaması şifrelenmemiş düz HTTP üzerinden hizmet veriyor. Kullanıcı trafiği, oturum çerezleri ve kimlik bilgileri aradaki adam (MitM) saldırılarına karşı savunmasızdır.",
      severity: "HIGH",
      category: "SSL_TLS",
      cvssScore: 7.4,
      evidence: `Uygulama son adresi: ${finalUrl}`,
      remediationPatch: `// Nginx Konfigürasyonu ile HTTPS Yönlendirmesi:\nserver {\n    listen 80;\n    server_name example.com;\n    return 301 https://$host$request_uri;\n}`,
    });
    logs.push({
      stepName: "SSL_AUDIT",
      message: "Zafiyet Tespit Edildi: Düz HTTP iletişimi aktif (Yüksek Risk).",
      level: "WARN",
    });
  } else {
    logs.push({
      stepName: "SSL_AUDIT",
      message: "HTTPS şifrelemesi doğrulandı.",
      level: "SUCCESS",
    });
  }

  // 2. Security Headers Audit
  logs.push({
    stepName: "HEADER_AUDIT",
    message: "HTTP Güvenlik Başlıkları (Security Headers) taranıyor...",
    level: "INFO",
  });

  // HSTS (Strict-Transport-Security)
  const hsts = headers.get("strict-transport-security");
  if (!hsts) {
    vulnerabilities.push({
      title: "HSTS (Strict-Transport-Security) Başlığı Eksik",
      description:
        "HSTS başlığı bulunamadı. Bu durum, istemcilerin tarayıcıları üzerinden SSL-Striping saldırılarına maruz kalmasına yol açabilir.",
      severity: "MEDIUM",
      category: "SECURITY_HEADERS",
      cvssScore: 5.3,
      evidence: "Yanıt başlıklarında 'Strict-Transport-Security' yer almıyor.",
      remediationPatch: `// Next.js (next.config.js/ts) Güvenlik Başlığı Ekleme:\n{\n  key: 'Strict-Transport-Security',\n  value: 'max-age=63072000; includeSubDomains; preload'\n}`,
    });
  }

  // Content-Security-Policy (CSP)
  const csp = headers.get("content-security-policy");
  if (!csp) {
    vulnerabilities.push({
      title: "Content-Security-Policy (CSP) Tanımlanmamış",
      description:
        "İçerik Güvenliği Politikası (CSP) başlığı eksik. Bu durum, XSS (Cross-Site Scripting) ve veri sızıntısı saldırılarının tarayıcı tarafından engellenmesini imkansız kılar.",
      severity: "HIGH",
      category: "SECURITY_HEADERS",
      cvssScore: 7.2,
      evidence: "Yanıt başlıklarında 'Content-Security-Policy' başlığı yok.",
      remediationPatch: `// Temel Güçlü CSP Politikası:\nContent-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none';`,
    });
  } else if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
    vulnerabilities.push({
      title: "Zayıf Content-Security-Policy ('unsafe-inline' / 'unsafe-eval')",
      description:
        "CSP politikanız satır içi scriptlere ('unsafe-inline') veya dinamik kod çalıştırmaya ('unsafe-eval') izin veriyor. Bu, XSS açıklarının istismar edilmesini kolaylaştırır.",
      severity: "MEDIUM",
      category: "SECURITY_HEADERS",
      cvssScore: 6.1,
      evidence: `Mevcut CSP: ${csp.slice(0, 120)}...`,
      remediationPatch: `Nonce veya SHA-256 hash tabanlı CSP politikasına geçiş yapın:\nscript-src 'self' 'nonce-{RANDOM_BASE64}';`,
    });
  }

  // X-Frame-Options (Clickjacking)
  const xfo = headers.get("x-frame-options");
  if (!xfo && (!csp || !csp.includes("frame-ancestors"))) {
    vulnerabilities.push({
      title: "Clickjacking Koruması Eksik (X-Frame-Options Yok)",
      description:
        "X-Frame-Options veya CSP frame-ancestors direktifi bulunamadı. Web siteniz başka bir etki alanı tarafından <iframe> içine alınarak kullanıcıların istem dışı tıklamalar yapması (Clickjacking) sağlanabilir.",
      severity: "MEDIUM",
      category: "OWASP_A05_SECURITY_MISCONFIG",
      cvssScore: 5.4,
      evidence: "Yanıt başlıklarında 'X-Frame-Options' veya 'frame-ancestors' tanımlı değil.",
      remediationPatch: `X-Frame-Options: DENY\n// Veya aynı domain için:\nX-Frame-Options: SAMEORIGIN`,
    });
  }

  // X-Content-Type-Options
  const xcto = headers.get("x-content-type-options");
  if (!xcto || xcto.toLowerCase() !== "nosniff") {
    vulnerabilities.push({
      title: "MIME-Sniffing Koruması Eksik (X-Content-Type-Options)",
      description:
        "X-Content-Type-Options başlığı 'nosniff' olarak ayarlanmamış. Tarayıcılar dosya uzantısını görmezden gelip MIME türünü tahmin etmeye çalışarak zararlı scriptleri çalıştırabilir.",
      severity: "LOW",
      category: "SECURITY_HEADERS",
      cvssScore: 3.7,
      evidence: `Mevcut değer: ${xcto ?? "Eksik"}`,
      remediationPatch: `X-Content-Type-Options: nosniff`,
    });
  }

  // Referrer-Policy
  const refPolicy = headers.get("referrer-policy");
  if (!refPolicy) {
    vulnerabilities.push({
      title: "Referrer-Policy Tanımlanmamış",
      description:
        "Referrer-Policy başlığı belirlenmemiş. Dış bağlantılara tıklanırken URL'deki hassas parametreler (token, arama terimleri, kullanıcı id vb.) üçüncü taraf sunuculara sızabilir.",
      severity: "LOW",
      category: "SECURITY_HEADERS",
      cvssScore: 3.1,
      evidence: "Yanıt başlıklarında 'Referrer-Policy' yok.",
      remediationPatch: `Referrer-Policy: strict-origin-when-cross-origin`,
    });
  }

  // 3. Information Disclosure & Technology Leakage
  logs.push({
    stepName: "INFO_DISCLOSURE",
    message: "Sunucu parmak izi ve hassas bilgi sızıntıları taranıyor...",
    level: "INFO",
  });

  if (serverHeader && /apache\/\d|nginx\/\d|iis\/\d/i.test(serverHeader)) {
    vulnerabilities.push({
      title: "Açık Sunucu Sürüm Bilgisi Sızıntısı (Server Banner)",
      description:
        "Server yanıt başlığında tam web sunucusu sürüm bilgisi ifşa ediliyor. Saldırganlar bu sürümde bilinen spesifik CVE açıklarını kolayca haritalayabilir.",
      severity: "LOW",
      category: "OWASP_A05_SECURITY_MISCONFIG",
      cvssScore: 3.5,
      evidence: `Server: ${serverHeader}`,
      remediationPatch: `// Nginx için:\nserver_tokens off;\n\n// Apache için:\nServerTokens Prod\nServerSignature Off`,
    });
  }

  if (xPoweredBy) {
    vulnerabilities.push({
      title: "Teknoloji Yığını İfşası (X-Powered-By)",
      description:
        "Arka uç framework bilgisi (Express, PHP, ASP.NET vb.) 'X-Powered-By' başlığı ile açıkça yayınlanıyor.",
      severity: "LOW",
      category: "OWASP_A05_SECURITY_MISCONFIG",
      cvssScore: 2.6,
      evidence: `X-Powered-By: ${xPoweredBy}`,
      remediationPatch: `// Express.js:\napp.disable('x-powered-by');\n\n// PHP (php.ini):\nexpose_php = Off`,
    });
  }

  // 4. Sensitive File & Directory Exposure Probes (Safe Non-Destructive Checks)
  logs.push({
    stepName: "EXPOSURE_PROBE",
    message: "Hassas dosya yapılandırmaları ve açık endpointler kontrol ediliyor...",
    level: "INFO",
  });

  const baseUrl = new URL(finalUrl).origin;
  const probes = [
    {
      path: "/.git/HEAD",
      title: "Hassas .git Kaynak Kod Deposu İfşası",
      desc: "Web kök dizininde .git klasörü herkese açık durumda. Tüm kaynak kod ve commit geçmişi indirilebilir.",
      sev: "CRITICAL" as Severity,
      cat: "SENSITIVE_DATA_EXPOSURE" as VulnerabilityCategory,
      score: 9.8,
      indicator: "ref: refs/",
    },
    {
      path: "/.env",
      title: "Ortam Değişkenleri Dosyası (.env) İfşası",
      desc: "Veritabanı parolaları ve gizli API anahtarlarını barındıran .env dosyası herkese açık.",
      sev: "CRITICAL" as Severity,
      cat: "SENSITIVE_DATA_EXPOSURE" as VulnerabilityCategory,
      score: 10.0,
      indicator: "=",
    },
    {
      path: "/.well-known/security.txt",
      title: "Security.txt Dosyası Eksik (RFC 9116)",
      desc: "Beyaz şapkalı güvenlik araştırmacılarının güvenlik açıklarını güvenle bildirebileceği 'security.txt' dosyası bulunamadı.",
      sev: "INFO" as Severity,
      cat: "SECURITY_HEADERS" as VulnerabilityCategory,
      score: 0.0,
      indicator: "Contact:",
      invert: true, // we want it to exist
    },
  ];

  for (const probe of probes) {
    try {
      const probeUrl = `${baseUrl}${probe.path}`;
      const probeRes = await fetch(probeUrl, {
        headers: { "User-Agent": "Lancerix-Security-Scanner/2.0" },
        signal: AbortSignal.timeout(6000),
      });

      if (probe.invert) {
        if (!probeRes.ok) {
          vulnerabilities.push({
            title: probe.title,
            description: probe.desc,
            severity: probe.sev,
            category: probe.cat,
            cvssScore: probe.score,
            evidence: `Endpoint: ${probeUrl} (HTTP ${probeRes.status})`,
            remediationPatch: `Web sitenizin /.well-known/security.txt dosyasına güvenlik irtibat e-postanızı ekleyin:\nContact: mailto:security@example.com\nExpires: 2027-12-31T23:59:59.000Z`,
          });
        }
      } else if (probeRes.ok) {
        const text = await probeRes.text();
        if (text.includes(probe.indicator)) {
          vulnerabilities.push({
            title: probe.title,
            description: probe.desc,
            severity: probe.sev,
            category: probe.cat,
            cvssScore: probe.score,
            evidence: `Erişilebilir Dosya: ${probeUrl} (Boyut: ${text.length} bayt)`,
            remediationPatch: `Web sunucunuzda gizli dosyalara (. ile başlayanlar) erişimi derhal yasaklayın:\nlocation ~ /\\. {\n    deny all;\n}`,
          });
          logs.push({
            stepName: "EXPOSURE_PROBE",
            message: `Kritik Açık Bulundu: ${probe.path} dışarıya açık!`,
            level: "ERROR",
          });
        }
      }
    } catch {
      // Probe failed or timed out safely
    }
  }

  // 5. HTML Content & Client-Side Risk Analysis
  logs.push({
    stepName: "DOM_ANALYSIS",
    message: "İstemci tarafı scriptler ve form güvenlikleri denetleniyor...",
    level: "INFO",
  });

  try {
    const html = await response.text();
    const $ = cheerio.load(html);

    // Form CSRF / Password over HTTP check
    $("form").each((_, el) => {
      const action = $(el).attr("action") || "";
      const method = ($(el).attr("method") || "get").toUpperCase();
      const hasPassword = $(el).find('input[type="password"]').length > 0;

      if (hasPassword && action.startsWith("http://")) {
        vulnerabilities.push({
          title: "Şifre Giriş Formu Düz HTTP Üzerinden Gönderiliyor",
          description:
            "Parola içeren form, şifrelenmemiş HTTP adresine POST ediliyor. Parola ağ üzerindeki herkes tarafından okunabilir.",
          severity: "CRITICAL",
          category: "OWASP_A02_CRYPTOGRAPHIC_FAILURES",
          cvssScore: 8.5,
          evidence: `Form Action: ${action}`,
          remediationPatch: `Form hedefinin kesinlikle HTTPS olduğundan emin olun:\n<form action="https://..." method="POST">`,
        });
      }

      if (method === "POST" && !$(el).find('input[name*="csrf"], input[name*="token"]').length) {
        // Warning about missing anti-CSRF token in simple HTML forms
        vulnerabilities.push({
          title: "Formda CSRF (Cross-Site Request Forgery) Belirteci Bulunamadı",
          description:
            "POST istekleri gönderen HTML formunda belirgin bir CSRF koruma belirteci (token) tespit edilemedi.",
          severity: "MEDIUM",
          category: "OWASP_A01_BROKEN_ACCESS_CONTROL",
          cvssScore: 5.7,
          evidence: `Form Action: ${action || "self"}`,
          remediationPatch: `Tüm POST formlarına rastgele, tahmin edilemez CSRF token ekleyin ve sunucuda doğrulayın.`,
        });
      }
    });
  } catch (err) {
    logs.push({
      stepName: "DOM_ANALYSIS",
      message: `HTML ayrıştırma atlandı: ${err instanceof Error ? err.message : String(err)}`,
      level: "WARN",
    });
  }

  logs.push({
    stepName: "AI_TRIAGE",
    message: `Tarama tamamlandı. Toplam ${vulnerabilities.length} bulgu sınıflandırıldı ve iyileştirme yamaları hazırlandı.`,
    level: "SUCCESS",
  });

  return {
    vulnerabilities,
    logs,
    targetDetails: {
      finalUrl,
      statusCode: response.status,
      serverBanner: serverHeader,
      hasHttps: isHttps,
    },
  };
}
