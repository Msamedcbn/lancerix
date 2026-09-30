export type ComplianceStatus = "PASS" | "FAIL" | "WARN";

export type ComplianceControl = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  status: ComplianceStatus;
  remediation?: string;
  matchingVulnerabilities: string[];
};

export type ComplianceFramework = {
  id: "OWASP_TOP_10" | "SOC_2";
  name: string;
  description: string;
  score: number;
  grade: string;
  passingControls: number;
  totalControls: number;
  controls: ComplianceControl[];
};

export type ComplianceEvaluation = {
  owasp: ComplianceFramework;
  soc2: ComplianceFramework;
  overallComplianceScore: number;
};

/**
 * Evaluates target security audit findings against industry compliance frameworks (OWASP Top 10 & SOC 2).
 */
export function evaluateCompliance(
  vulnerabilities: { title: string; category: string; severity: string }[]
): ComplianceEvaluation {
  // 1. OWASP Top 10 Controls
  const owaspControls: ComplianceControl[] = [
    {
      id: "owasp-a01",
      code: "A01:2021",
      title: "Broken Access Control",
      description: "Yetkisiz kullanıcıların izin verilmeyen kaynaklara ve verilere erişmesini engelleyin.",
      category: "Erişim Denetimi",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "owasp-a02",
      code: "A02:2021",
      title: "Cryptographic Failures",
      description: "Hassas verilerin iletimi ve saklanmasında güçlü şifreleme (TLS/HTTPS) zorunlu tutulmalıdır.",
      category: "Kriptografi",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "owasp-a03",
      code: "A03:2021",
      title: "Injection",
      description: "İstemciden gelen veriler doğrulanmalı ve filtrelenmelidir (XSS, SQLi vb.).",
      category: "Enjeksiyon",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "owasp-a04",
      code: "A04:2021",
      title: "Insecure Design",
      description: "Tasarım düzeyinde güvenlik mimarisi (Clickjacking, iframe tecriti) uygulanmalıdır.",
      category: "Tasarım Güvenliği",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "owasp-a05",
      code: "A05:2021",
      title: "Security Misconfiguration",
      description: "Güvenlik başlıkları (HSTS, CSP, XFO) tam olmalı, sunucu sürümleri gizlenmelidir.",
      category: "Yapılandırma",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "owasp-a06",
      code: "A06:2021",
      title: "Vulnerable Components",
      description: "Kullanılan üçüncü taraf kütüphane ve yazılımlarda bilinen CVE açığı bulunmamalıdır.",
      category: "Bileşenler",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "owasp-a07",
      code: "A07:2021",
      title: "Identification and Auth Failures",
      description: "Oturum çerezleri ve parolalar şifrelenmemiş kanallardan gönderilmemelidir.",
      category: "Kimlik Doğrulama",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "owasp-a08",
      code: "A08:2021",
      title: "Software and Data Integrity Failures",
      description: "Uygulama kaynak kodları ve bağımlılıkların bütünlüğü korunmalıdır.",
      category: "Veri Bütünlüğü",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "owasp-a09",
      code: "A09:2021",
      title: "Security Logging and Monitoring",
      description: "Güvenlik araştırmacıları için security.txt ve denetim kayıtları tutulmalıdır.",
      category: "İzleme & Raporlama",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "owasp-a10",
      code: "A10:2021",
      title: "Server-Side Request Forgery (SSRF)",
      description: "Sunucu tarafı istekler sınırlandırılmalı, dahili ağlar korunmalıdır.",
      category: "Ağ Güvenliği",
      status: "PASS",
      matchingVulnerabilities: [],
    },
  ];

  // Map vulnerabilities into controls
  for (const v of vulnerabilities) {
    const cat = v.category;
    const title = v.title;

    if (cat.includes("A01") || title.includes("CSRF") || title.includes("Access")) {
      const c = owaspControls.find((x) => x.id === "owasp-a01");
      if (c) {
        c.status = v.severity === "CRITICAL" ? "FAIL" : "WARN";
        c.matchingVulnerabilities.push(title);
      }
    }
    if (cat.includes("A02") || cat === "SSL_TLS" || title.includes("HTTPS")) {
      const c = owaspControls.find((x) => x.id === "owasp-a02");
      if (c) {
        c.status = "FAIL";
        c.matchingVulnerabilities.push(title);
      }
    }
    if (cat.includes("A03") || cat === "INJECTION") {
      const c = owaspControls.find((x) => x.id === "owasp-a03");
      if (c) {
        c.status = "FAIL";
        c.matchingVulnerabilities.push(title);
      }
    }
    if (cat.includes("A04") || title.includes("Clickjacking")) {
      const c = owaspControls.find((x) => x.id === "owasp-a04");
      if (c) {
        c.status = "WARN";
        c.matchingVulnerabilities.push(title);
      }
    }
    if (cat.includes("A05") || cat === "SECURITY_HEADERS" || title.includes("HSTS") || title.includes("CSP") || title.includes("Banner")) {
      const c = owaspControls.find((x) => x.id === "owasp-a05");
      if (c) {
        c.status = v.severity === "HIGH" ? "FAIL" : "WARN";
        c.matchingVulnerabilities.push(title);
      }
    }
    if (cat.includes("A07") || title.includes("Şifre") || title.includes("Password")) {
      const c = owaspControls.find((x) => x.id === "owasp-a07");
      if (c) {
        c.status = "FAIL";
        c.matchingVulnerabilities.push(title);
      }
    }
    if (cat.includes("SENSITIVE_DATA_EXPOSURE") || title.includes(".git") || title.includes(".env")) {
      const c = owaspControls.find((x) => x.id === "owasp-a01");
      if (c) {
        c.status = "FAIL";
        c.matchingVulnerabilities.push(title);
      }
    }
  }

  // 2. SOC 2 Trust Services Criteria Controls
  const soc2Controls: ComplianceControl[] = [
    {
      id: "soc2-cc6.1",
      code: "CC6.1",
      title: "Logical Access Security",
      description: "Kullanıcı verilerine ve dahili sistemlere mantıksal erişim sıkı şekilde sınırlandırılmalıdır.",
      category: "Erişim Kontrolü",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "soc2-cc6.6",
      code: "CC6.6",
      title: "Boundary Protection & Defenses",
      description: "Dış ağ saldırılarına karşı sınır savunması (HSTS, Content-Security-Policy, X-Frame-Options) uygulanmalıdır.",
      category: "Saldırı Savunması",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "soc2-cc6.7",
      code: "CC6.7",
      title: "Data Transmission Encryption",
      description: "İnternet üzerinden aktarılan tüm veriler TLS/HTTPS şifrelemesi ile korunmalıdır.",
      category: "Veri Şifreleme",
      status: "PASS",
      matchingVulnerabilities: [],
    },
    {
      id: "soc2-cc7.1",
      code: "CC7.1",
      title: "Continuous Vulnerability Detection",
      description: "Sistemler yeni ortaya çıkan güvenlik açıklarına karşı periyodik ve otonom olarak taranmalıdır.",
      category: "Zafiyet İzleme",
      status: "PASS",
      matchingVulnerabilities: [],
    },
  ];

  // Map into SOC 2
  for (const v of vulnerabilities) {
    if (v.title.includes("HTTPS") || v.category === "SSL_TLS") {
      const c = soc2Controls.find((x) => x.id === "soc2-cc6.7");
      if (c) {
        c.status = "FAIL";
        c.matchingVulnerabilities.push(v.title);
      }
    }
    if (v.category === "SECURITY_HEADERS" || v.title.includes("CSP") || v.title.includes("Clickjacking")) {
      const c = soc2Controls.find((x) => x.id === "soc2-cc6.6");
      if (c) {
        c.status = v.severity === "HIGH" ? "FAIL" : "WARN";
        c.matchingVulnerabilities.push(v.title);
      }
    }
    if (v.category.includes("SENSITIVE") || v.title.includes(".env") || v.title.includes(".git")) {
      const c = soc2Controls.find((x) => x.id === "soc2-cc6.1");
      if (c) {
        c.status = "FAIL";
        c.matchingVulnerabilities.push(v.title);
      }
    }
  }

  const owaspPassing = owaspControls.filter((c) => c.status === "PASS").length;
  const owaspScore = Math.round((owaspPassing / owaspControls.length) * 100);

  const soc2Passing = soc2Controls.filter((c) => c.status === "PASS").length;
  const soc2Score = Math.round((soc2Passing / soc2Controls.length) * 100);

  const overallScore = Math.round((owaspScore + soc2Score) / 2);

  return {
    owasp: {
      id: "OWASP_TOP_10",
      name: "OWASP Top 10 (2021)",
      description: "Web uygulamaları için küresel çapta en kritik 10 güvenlik riski standardı.",
      score: owaspScore,
      grade: owaspScore >= 80 ? "Uygun (Pass)" : "İyileştirme Gerekli",
      passingControls: owaspPassing,
      totalControls: owaspControls.length,
      controls: owaspControls,
    },
    soc2: {
      id: "SOC_2",
      name: "SOC 2 Type II (Security Criteria)",
      description: "Kurumsal B2B müşterileri ve denetçiler için Güvenilirlik & Veri Güvenliği Standardı.",
      score: soc2Score,
      grade: soc2Score >= 80 ? "Denetime Hazır (Ready)" : "Eksikler Mevcut",
      passingControls: soc2Passing,
      totalControls: soc2Controls.length,
      controls: soc2Controls,
    },
    overallComplianceScore: overallScore,
  };
}
