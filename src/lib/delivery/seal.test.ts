import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock ssrf-guard
const isBlockedTargetMock = vi.fn();
vi.mock("@/lib/qa/ssrf-guard", () => ({
  isBlockedTarget: (...args: unknown[]) => isBlockedTargetMock(...args),
}));

import { calculateDeliveryDocumentSha256, probeStagingTarget, type DeliverySealPayload } from "./seal";

describe("calculateDeliveryDocumentSha256", () => {
  const samplePayload: DeliverySealPayload = {
    projectName: "E-Commerce Checkout Milestone",
    targetUrl: "https://staging.acmestore.com",
    criteria: [
      "Stripe checkout test ödemesi başarıyla tamamlanıyor",
      "Mobil menü ve responsive tasarım düzgün",
      "Kullanıcı kayıt ve e-posta doğrulama akışı tamam",
    ],
    gitCommit: "a1b2c3d4",
    proberResult: {
      httpStatus: 200,
      statusText: "OK",
      responseTimeMs: 245,
      sslValid: true,
      pageTitle: "Acme Store Staging",
      metaDescription: "Welcome to Acme Store Staging",
      headers: { server: "vercel" },
      bodySha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      probedAt: "2026-10-07T12:00:00.000Z",
    },
    timestamp: "2026-10-07T12:00:00.000Z",
  };

  it("produces a valid 64-character lowercase hex string", () => {
    const hash = calculateDeliveryDocumentSha256(samplePayload);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is strictly deterministic (identical payload produces identical hash)", () => {
    const hash1 = calculateDeliveryDocumentSha256(samplePayload);
    const hash2 = calculateDeliveryDocumentSha256({ ...samplePayload });
    expect(hash1).toBe(hash2);
  });

  it("detects tampering when criteria text is modified", () => {
    const originalHash = calculateDeliveryDocumentSha256(samplePayload);
    const tamperedPayload = {
      ...samplePayload,
      criteria: [
        "Stripe checkout test ödemesi başarıyla tamamlanıyor",
        "Mobil menü ve responsive tasarım düzgün",
        "Kullanıcı kayıt ve e-posta doğrulama akışı tamam (değiştirildi)",
      ],
    };
    const tamperedHash = calculateDeliveryDocumentSha256(tamperedPayload);
    expect(tamperedHash).not.toBe(originalHash);
  });

  it("detects tampering when HTTP status or body hash changes", () => {
    const originalHash = calculateDeliveryDocumentSha256(samplePayload);
    const modifiedPayload = {
      ...samplePayload,
      proberResult: {
        ...samplePayload.proberResult,
        httpStatus: 500,
      },
    };
    expect(calculateDeliveryDocumentSha256(modifiedPayload)).not.toBe(originalHash);
  });

  it("normalizes leading and trailing whitespace", () => {
    const hash1 = calculateDeliveryDocumentSha256(samplePayload);
    const whitespacePayload = {
      ...samplePayload,
      projectName: "  E-Commerce Checkout Milestone  ",
      criteria: samplePayload.criteria.map((c) => `  ${c}  `),
    };
    const hash2 = calculateDeliveryDocumentSha256(whitespacePayload);
    expect(hash1).toBe(hash2);
  });
});

describe("probeStagingTarget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid or non-http/https protocols", async () => {
    await expect(probeStagingTarget("ftp://ftp.example.com")).rejects.toThrow(/Geçersiz URL formatı/);
    await expect(probeStagingTarget("not-a-url")).rejects.toThrow(/Geçersiz URL formatı/);
  });

  it("rejects SSRF-blocked private IP addresses", async () => {
    isBlockedTargetMock.mockResolvedValueOnce(true);
    await expect(probeStagingTarget("http://169.254.169.254/latest/meta-data")).rejects.toThrow(/SSRF_BLOCKED/);
    expect(isBlockedTargetMock).toHaveBeenCalledWith("http://169.254.169.254/latest/meta-data");
  });

  it("successfully probes a public URL and extracts HTML metadata", async () => {
    isBlockedTargetMock.mockResolvedValueOnce(false);

    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>My Client Staging App</title>
          <meta name="description" content="Staging environment for client review">
        </head>
        <body>
          <h1>Welcome to Delivery</h1>
        </body>
      </html>
    `;

    const mockHeaders = new Headers({
      "content-type": "text/html; charset=utf-8",
      server: "cloudflare",
      "strict-transport-security": "max-age=31536000",
    });

    const fetchMock = vi.fn().mockResolvedValueOnce({
      status: 200,
      statusText: "OK",
      headers: mockHeaders,
      arrayBuffer: async () => Buffer.from(mockHtml, "utf-8"),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await probeStagingTarget("https://staging.example.com");

    expect(result.httpStatus).toBe(200);
    expect(result.statusText).toBe("OK");
    expect(result.sslValid).toBe(true);
    expect(result.pageTitle).toBe("My Client Staging App");
    expect(result.metaDescription).toBe("Staging environment for client review");
    expect(result.headers.server).toBe("cloudflare");
    expect(result.bodySha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);

    vi.unstubAllGlobals();
  });
});
