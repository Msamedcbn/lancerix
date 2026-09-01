/**
 * Admin QA-desk actions. submitQaReport was the three-network-call chain
 * flagged in the eng review (QA_DONE -> insert report -> AWAITING_CLIENT,
 * any one of which could fail leaving the delivery stranded); it is now one
 * submit_qa_report() RPC (20260901160000_atomic_qa_writes.sql). What's left
 * to prove in TS is the digest computation (still done client-side, since it
 * doesn't depend on the clock) and that validation/errors map correctly.
 *
 * setInvoiceAmount is the T5 fix for the amount_kurus=0 placeholder --
 * covers parseTryToKurus rejecting bad input before any write happens.
 */
import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { failRpc, mockRpcClient, type RpcImpl } from "@/lib/test-utils/mock-rpc-client";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const adminSession = {
  userId: "00000000-0000-0000-0000-000000000009",
  email: "admin@example.com",
  fullName: "Admin",
  role: "ADMIN" as const,
  publicId: "ADMIN001",
};

vi.mock("@/lib/auth/session", () => ({
  requireRole: vi.fn(async () => adminSession),
}));

let rpcImpl: RpcImpl;
let updateImpl: (table: string, patch: Record<string, unknown>) => { error: { message: string } | null };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => {
    const { client } = mockRpcClient((name, args) => rpcImpl(name, args));
    return {
      ...client,
      from: (table: string) => ({
        update: (patch: Record<string, unknown>) => ({
          eq: () => ({
            eq: async () => updateImpl(table, patch),
          }),
        }),
      }),
    };
  }),
}));

const DELIVERY_ID = "22222222-2222-4222-8222-222222222222";
const CONTRACT_ID = "11111111-1111-4111-8111-111111111111";
const INVOICE_ID = "44444444-4444-4444-4444-444444444444";

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
  updateImpl = () => ({ error: null });
});

describe("submitQaReport", () => {
  it("refuses findings under 10 characters without calling the RPC", async () => {
    const { submitQaReport } = await import("./actions");
    const result = await submitQaReport(
      { error: null },
      formData({
        deliveryId: DELIVERY_ID,
        contractId: CONTRACT_ID,
        status: "PASS",
        findings: "kısa",
      }),
    );
    expect(result.error).toBeTruthy();
    expect(capturedCall).toBeNull();
  });

  it("calls submit_qa_report with the args and a digest of delivery:status:findings", async () => {
    const { submitQaReport } = await import("./actions");
    const findings = "Tüm kriterler karşılandı, sorun yok.";
    const result = await submitQaReport(
      { error: null },
      formData({
        deliveryId: DELIVERY_ID,
        contractId: CONTRACT_ID,
        status: "PASS",
        findings,
      }),
    );
    expect(result.error).toBeNull();
    const expectedDigest = createHash("sha256")
      .update(`${DELIVERY_ID}:PASS:${findings}`)
      .digest("hex");
    expect(capturedCall).toEqual({
      name: "submit_qa_report",
      args: {
        p_delivery_id: DELIVERY_ID,
        p_contract_id: CONTRACT_ID,
        p_status: "PASS",
        p_findings: findings,
        p_document_sha256: expectedDigest,
      },
    });
  });

  it("surfaces an RPC error (e.g. no tier order) as FAIL", async () => {
    rpcImpl = failRpc(`no QA tier order for delivery ${DELIVERY_ID}`);
    const { submitQaReport } = await import("./actions");
    const result = await submitQaReport(
      { error: null },
      formData({
        deliveryId: DELIVERY_ID,
        contractId: CONTRACT_ID,
        status: "FAIL",
        findings: "Mobilde yatay kaydırma çıkıyor.",
      }),
    );
    expect(result.error).toBe(`no QA tier order for delivery ${DELIVERY_ID}`);
  });
});

describe("setInvoiceAmount", () => {
  it("refuses an unparsable amount without writing", async () => {
    updateImpl = vi.fn(() => ({ error: null }));
    const { setInvoiceAmount } = await import("./actions");
    const result = await setInvoiceAmount(
      { error: null },
      formData({ invoiceId: INVOICE_ID, amount: "not a number" }),
    );
    expect(result.error).toBeTruthy();
    expect(updateImpl).not.toHaveBeenCalled();
  });

  it("refuses a zero amount without writing", async () => {
    updateImpl = vi.fn(() => ({ error: null }));
    const { setInvoiceAmount } = await import("./actions");
    const result = await setInvoiceAmount(
      { error: null },
      formData({ invoiceId: INVOICE_ID, amount: "0" }),
    );
    expect(result.error).toBeTruthy();
    expect(updateImpl).not.toHaveBeenCalled();
  });

  it("parses Turkish notation and writes amount_kurus in kurus", async () => {
    updateImpl = vi.fn((_table, patch) => {
      expect(patch).toEqual({ amount_kurus: 125050 });
      return { error: null };
    });
    const { setInvoiceAmount } = await import("./actions");
    const result = await setInvoiceAmount(
      { error: null },
      formData({ invoiceId: INVOICE_ID, amount: "1.250,50" }),
    );
    expect(result.error).toBeNull();
    expect(updateImpl).toHaveBeenCalledTimes(1);
  });
});
