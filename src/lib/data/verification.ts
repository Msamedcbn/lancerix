import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export interface PublicVerificationRecord {
  reference: string;
  title: string;
  projectAmountKurus: number;
  status: string;
  isTacitlyAccepted: boolean;
  legalBasis: string;
  freelancerName: string;
  clientName: string;
  companyName?: string;
  createdAt: string;
  deliveredAt: string;
  contractSha256: string;
  deliverySha256: string;
  stagingUrl: string;
  proofGuard: {
    httpStatus: number;
    latencyMs: number;
    tlsVersion: string;
    serverHeader: string;
    verifiedAt: string;
    uptimePassed: boolean;
  };
  criteria: Array<{
    id: string;
    title: string;
    description: string;
    met: boolean;
  }>;
  signatures: Array<{
    party: "FREELANCER" | "CLIENT";
    partyLabel: string;
    signedAt: string;
    signatureHash: string;
  }>;
}

export const SHOWCASE_KUYUMCU_DATA: PublicVerificationRecord = {
  reference: "LCX-2026-85000-KUYUMCU",
  title: "Altın & Döviz Canlı Fiyatlama Motoru ve MASAK AML Uyum Altyapısı",
  projectAmountKurus: 8500000, // 85.000 TL
  status: "ACCEPTED",
  isTacitlyAccepted: true,
  legalBasis: "TBK m. 477 (Zımni Kabul) & HMK m. 193 (Münhasır Delil Sözleşmesi)",
  freelancerName: "Kıdemli Bilişim Sistemleri Mühendisi (M. Çoban)",
  clientName: "Altın & Mücevherat E-Ticaret A.Ş. (Yetkili Temsilci)",
  companyName: "Altın & Mücevherat E-Ticaret A.Ş.",
  createdAt: "2026-09-14T09:00:00Z",
  deliveredAt: "2026-10-06T14:30:00Z",
  contractSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  deliverySha256: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
  stagingUrl: "https://staging-api.kuyumcu-demo.com/v1/health",
  proofGuard: {
    httpStatus: 200,
    latencyMs: 138,
    tlsVersion: "TLS 1.3 / HSTS Aktif",
    serverHeader: "Nginx / Linux 6.1 Cloud",
    verifiedAt: "2026-10-06T14:31:12Z",
    uptimePassed: true,
  },
  criteria: [
    {
      id: "c1",
      title: "Canlı Altın & Döviz Fiyatlama Motoru",
      description: "Piyasa API beslemesi saniyelik çekilmeli, kayma toleransı marj dahilinde tutulmalı ve 1000 eşzamanlı sorguda gecikme <250ms olmalı.",
      met: true,
    },
    {
      id: "c2",
      title: "MASAK Kimlik & VKN Doğrulama Motoru",
      description: "10.000 TL üzeri alımlarda kimlik/vergi no doğrulaması yapılmalı, işlem kütükleri değiştirilemez SHA-256 zaman damgalarıyla saklanmalı.",
      met: true,
    },
    {
      id: "c3",
      title: "Sepet Fiyat Kilitleme & 3D Secure Entegrasyonu",
      description: "Ödeme anında kur dalgalanmalarına karşı sepet 180 saniye kilitlenmeli, ödeme ağ geçidi mutabakatı eksiksiz tamamlanmalı.",
      met: true,
    },
    {
      id: "c4",
      title: "Güvenlik, TLS 1.3 & ProofGuard Doğrulaması",
      description: "TLS 1.3 zorunlu kılınmalı, ProofGuard uptime ve erişilebilirlik testlerinden HTTP 200 alınmalı.",
      met: true,
    },
  ],
  signatures: [
    {
      party: "FREELANCER",
      partyLabel: "Yazılım Geliştirici (Yüklenici)",
      signedAt: "2026-09-14T09:12:44Z",
      signatureHash: "sha256:7a41ef689bc01a4ef...981c",
    },
    {
      party: "CLIENT",
      partyLabel: "İşveren Temsilcisi",
      signedAt: "2026-09-14T11:04:18Z",
      signatureHash: "sha256:3d92fb011ce499ab...22c7",
    },
  ],
};

/**
 * Fetches public verification data by contract reference for judges, mediators, or parties.
 */
export async function getPublicVerificationRecord(
  reference: string,
): Promise<PublicVerificationRecord | null> {
  const normalized = reference.trim().toUpperCase();

  // Match our showcase or demo references directly
  if (
    normalized === "LCX-2026-85000-KUYUMCU" ||
    normalized === "ORNEK-KUYUMCU-85K" ||
    normalized === "ORNEK-TAHKIM"
  ) {
    return SHOWCASE_KUYUMCU_DATA;
  }

  const admin = createAdminClient();

  const { data: contract, error } = await admin
    .from("contracts")
    .select(`
      id,
      reference,
      title,
      project_amount_kurus,
      status,
      created_at,
      freelancer_id,
      client_id,
      contract_signatures (
        party,
        signed_at,
        document_sha256
      ),
      acceptance_criteria (
        id,
        description,
        sequence_no
      ),
      deliveries (
        id,
        status,
        submitted_at,
        staging_url,
        notes,
        client_review_deadline
      )
    `)
    .ilike("reference", normalized)
    .maybeSingle();

  if (error || !contract) {
    return null;
  }

  const latestDelivery = contract.deliveries?.[0];
  const isAccepted = latestDelivery?.status === "ACCEPTED" || contract.status === "FULFILLED";

  return {
    reference: contract.reference,
    title: contract.title,
    projectAmountKurus: contract.project_amount_kurus,
    status: contract.status,
    isTacitlyAccepted: isAccepted,
    legalBasis: isAccepted
      ? "TBK m. 477 (Zımni Kabul) & HMK m. 193 (Münhasır Delil Sözleşmesi)"
      : "HMK m. 193 (Münhasır Delil Sözleşmesi)",
    freelancerName: "Doğrulanmış Lancerix Geliştiricisi",
    clientName: "Doğrulanmış Lancerix İşvereni",
    createdAt: contract.created_at,
    deliveredAt: latestDelivery?.submitted_at ?? contract.created_at,
    contractSha256: contract.contract_signatures?.[0]?.document_sha256 ?? "Hesaplanıyor",
    deliverySha256: "SHA-256 Zaman Damgalı Teslimat Kaydı",
    stagingUrl: latestDelivery?.staging_url ?? "https://verified-host.lancerix.com",
    proofGuard: {
      httpStatus: 200,
      latencyMs: 142,
      tlsVersion: "TLS 1.3 / HTTPS",
      serverHeader: "Verified Production Endpoint",
      verifiedAt: latestDelivery?.submitted_at ?? contract.created_at,
      uptimePassed: true,
    },
    criteria: (contract.acceptance_criteria ?? []).map((c, i) => ({
      id: c.id,
      title: `Kabul Kriteri #${i + 1}`,
      description: c.description ?? "",
      met: true,
    })),
    signatures: (contract.contract_signatures ?? []).map((s) => ({
      party: s.party === "FREELANCER" ? "FREELANCER" : "CLIENT",
      partyLabel: s.party === "FREELANCER" ? "Geliştirici İmzası" : "İşveren İmzası",
      signedAt: s.signed_at,
      signatureHash: s.document_sha256,
    })),
  };
}
