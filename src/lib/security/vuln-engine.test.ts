import { describe, expect, it, vi } from "vitest";
import { runSecurityAudit } from "./vuln-engine";

vi.mock("@/lib/qa/ssrf-guard", () => ({
  isBlockedTarget: vi.fn(async (url: string) => url.includes("127.0.0.1") || url.includes("localhost")),
}));

describe("runSecurityAudit", () => {
  it("refuses blocked private/internal targets via SSRF guard", async () => {
    const result = await runSecurityAudit("http://127.0.0.1:8080");
    expect(result).toBeNull();
  });

  it("audits security headers and detects missing CSP and HSTS", async () => {
    // Mock global fetch
    const mockHeaders = new Headers({
      server: "nginx/1.18.0",
      "x-powered-by": "Express",
    });

    const mockResponse = {
      ok: true,
      status: 200,
      url: "https://example.com",
      headers: mockHeaders,
      text: async () => "<!DOCTYPE html><html><head><title>Test</title></head><body>Hello</body></html>",
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes(".git") || urlStr.includes(".env") || urlStr.includes("security.txt")) {
        return { ok: false, status: 404, text: async () => "Not Found" } as Response;
      }
      return mockResponse as unknown as Response;
    });

    try {
      const outcome = await runSecurityAudit("https://example.com");
      expect(outcome).not.toBeNull();
      if (!outcome) return;

      const titles = outcome.vulnerabilities.map((v) => v.title);
      expect(titles).toContain("HSTS (Strict-Transport-Security) Başlığı Eksik");
      expect(titles).toContain("Content-Security-Policy (CSP) Tanımlanmamış");
      expect(titles).toContain("Clickjacking Koruması Eksik (X-Frame-Options Yok)");
      expect(titles).toContain("Teknoloji Yığını İfşası (X-Powered-By)");

      // Check that logs were recorded
      expect(outcome.logs.length).toBeGreaterThan(0);
      expect(outcome.logs.some((l) => l.stepName === "HEADER_AUDIT")).toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
