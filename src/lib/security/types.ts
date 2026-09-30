export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type VulnerabilityCategory =
  | "OWASP_A01_BROKEN_ACCESS_CONTROL"
  | "OWASP_A02_CRYPTOGRAPHIC_FAILURES"
  | "OWASP_A03_INJECTION"
  | "OWASP_A04_INSECURE_DESIGN"
  | "OWASP_A05_SECURITY_MISCONFIG"
  | "OWASP_A06_VULNERABLE_COMPONENTS"
  | "OWASP_A07_IDENTIFICATION_AUTH_FAILURES"
  | "OWASP_A08_SOFTWARE_DATA_INTEGRITY"
  | "OWASP_A09_LOGGING_MONITORING_FAILURES"
  | "OWASP_A10_SSRF"
  | "SECURITY_HEADERS"
  | "SSL_TLS"
  | "SENSITIVE_DATA_EXPOSURE"
  | "CORS_MISCONFIG"
  | "API_SECURITY";

export type VerificationMethod = "DNS_TXT" | "META_TAG" | "MANUAL_EXEMPT";

export type ScanType = "QUICK" | "FULL_AUDIT" | "OWASP_DEEP" | "API_SECURITY";

export type ScanStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export type SecurityTarget = {
  id: string;
  userId: string;
  name: string;
  targetUrl: string;
  verificationMethod: VerificationMethod;
  verificationToken: string;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SecurityVulnerability = {
  id: string;
  scanId: string;
  targetId: string;
  title: string;
  description: string;
  severity: Severity;
  category: VulnerabilityCategory;
  cvssScore: number;
  affectedUrl: string;
  evidence?: string;
  remediationPatch?: string;
  status: "OPEN" | "RESOLVED" | "FALSE_POSITIVE";
  createdAt: string;
};

export type SecurityScan = {
  id: string;
  targetId: string;
  userId: string;
  scanType: ScanType;
  status: ScanStatus;
  healthScore: number;
  // Matches exactly what startSecurityScanAction (security-actions.ts) and
  // POST /api/v1/scan both write -- durationSeconds/checksRun were never
  // actually written by either path and have been dropped rather than left
  // as a type that claimed fields no real row has.
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount?: number;
    totalFindings: number;
    targetDetails?: {
      finalUrl: string;
      statusCode: number;
      serverBanner?: string;
      hasHttps: boolean;
      ipAddresses?: string[];
    };
  };
  documentSha256?: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  vulnerabilities?: SecurityVulnerability[];
};

export type AgentLogLevel = "INFO" | "WARN" | "SUCCESS" | "ERROR";

export type AgentLog = {
  id: string;
  scanId: string;
  stepName: string;
  message: string;
  level: AgentLogLevel;
  createdAt: string;
};

export const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bg: string; border: string; scoreImpact: number }
> = {
  CRITICAL: {
    label: "Kritik",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    scoreImpact: 35,
  },
  HIGH: {
    label: "Yüksek",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    scoreImpact: 20,
  },
  MEDIUM: {
    label: "Orta",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    scoreImpact: 10,
  },
  LOW: {
    label: "Düşük",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    scoreImpact: 4,
  },
  INFO: {
    label: "Bilgi",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    scoreImpact: 0,
  },
};

export function calculateHealthScore(vulnerabilities: { severity: Severity }[]): number {
  let score = 100;
  for (const v of vulnerabilities) {
    score -= SEVERITY_CONFIG[v.severity].scoreImpact;
  }
  return Math.max(0, Math.min(100, score));
}

export function getGradeFromScore(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "A+", color: "text-emerald-400" };
  if (score >= 80) return { grade: "A", color: "text-emerald-500" };
  if (score >= 70) return { grade: "B", color: "text-blue-400" };
  if (score >= 60) return { grade: "C", color: "text-amber-400" };
  if (score >= 40) return { grade: "D", color: "text-orange-400" };
  return { grade: "F", color: "text-red-500" };
}
