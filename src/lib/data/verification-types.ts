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
