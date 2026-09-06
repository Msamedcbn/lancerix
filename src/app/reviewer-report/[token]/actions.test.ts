/**
 * The reviewer's no-login report submission (2026-09-06 four-role audit,
 * Finding 1). What's worth proving here is the TS wrapper -- the right RPC
 * name/args, validation blocking before any call, and each RPC error mapped
 * to the right Turkish message. The RPC's own behavior (token single-use,
 * expiry, service-role-only grant) is covered live against the hosted
 * Supabase project, not here -- see the migration's own comments.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { failRpc, mockRpcClient, type RpcImpl } from "@/lib/test-utils/mock-rpc-client";

let rpcImpl: RpcImpl;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockRpcClient((name, args) => rpcImpl(name, args)).client),
}));

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

let capturedCall: { name: string; args: Record<string, unknown> } | null;

beforeEach(() => {
  capturedCall = null;
  rpcImpl = (name, args) => {
    capturedCall = { name, args };
    return { data: null, error: null };
  };
});

const TOKEN = "a".repeat(64);

describe("submitReviewerReport", () => {
  it("refuses findings under 10 characters without calling the RPC", async () => {
    const { submitReviewerReport } = await import("./actions");
    const result = await submitReviewerReport(
      { error: null },
      formData({ token: TOKEN, status: "PASS", findings: "kısa" }),
    );
    expect(result.error).toBeTruthy();
    expect(capturedCall).toBeNull();
  });

  it("calls submit_reviewer_report with the token, status, findings, and a digest", async () => {
    const { submitReviewerReport } = await import("./actions");
    const result = await submitReviewerReport(
      { error: null },
      formData({ token: TOKEN, status: "PASS", findings: "Tüm kriterler karşılandı." }),
    );
    expect(result.error).toBeNull();
    expect(result.ok).toBeTruthy();
    expect(capturedCall?.name).toBe("submit_reviewer_report");
    expect(capturedCall?.args.p_token).toBe(TOKEN);
    expect(capturedCall?.args.p_status).toBe("PASS");
    expect(capturedCall?.args.p_findings).toBe("Tüm kriterler karşılandı.");
    expect(typeof capturedCall?.args.p_document_sha256).toBe("string");
    expect((capturedCall?.args.p_document_sha256 as string).length).toBe(64);
  });

  it("maps an already-used token to a Turkish 'already submitted' message", async () => {
    rpcImpl = failRpc("reviewer token already used");
    const { submitReviewerReport } = await import("./actions");
    const result = await submitReviewerReport(
      { error: null },
      formData({ token: TOKEN, status: "PASS", findings: "Tüm kriterler karşılandı." }),
    );
    expect(result.error).toBe("Bu rapor zaten gönderilmiş.");
  });

  it("maps an expired token to a Turkish 'expired' message", async () => {
    rpcImpl = failRpc("reviewer token expired");
    const { submitReviewerReport } = await import("./actions");
    const result = await submitReviewerReport(
      { error: null },
      formData({ token: TOKEN, status: "PASS", findings: "Tüm kriterler karşılandı." }),
    );
    expect(result.error).toBe("Bu linkin süresi dolmuş.");
  });

  it("maps an unknown token to a Turkish 'invalid link' message", async () => {
    rpcImpl = failRpc("reviewer token not found");
    const { submitReviewerReport } = await import("./actions");
    const result = await submitReviewerReport(
      { error: null },
      formData({ token: TOKEN, status: "PASS", findings: "Tüm kriterler karşılandı." }),
    );
    expect(result.error).toBe("Bu link geçersiz.");
  });

  it("surfaces any other RPC error as a generic Turkish message, logged server-side", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    rpcImpl = failRpc("submit_reviewer_report may only be called with the service role");
    const { submitReviewerReport } = await import("./actions");
    const result = await submitReviewerReport(
      { error: null },
      formData({ token: TOKEN, status: "PASS", findings: "Tüm kriterler karşılandı." }),
    );
    expect(result.error).toBe("Rapor kaydedilemedi. Tekrar dene.");
    expect(consoleError).toHaveBeenCalledWith(
      "[submitReviewerReport]",
      "submit_reviewer_report may only be called with the service role",
    );
    consoleError.mockRestore();
  });
});
