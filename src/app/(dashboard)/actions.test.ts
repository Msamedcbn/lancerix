/**
 * Contract lifecycle Server Actions (reject/revise/resubmit/confirm-start).
 *
 * Each of these is a thin wrapper: validate the form, call one RPC, map the
 * result to FormState. What's worth proving here is that wrapper -- the right
 * RPC name, the right args, client-side validation blocking before any call
 * is made, and RPC errors surfacing as FAIL rather than throwing. The RPC's
 * own behavior (who may call it, what states it accepts) is enforced by
 * Postgres and covered by delivery-state-machine.test.ts's mirror pattern for
 * the delivery side; contract_lifecycle.sql's guards have no TS mirror to
 * test against yet, so wrong SQL logic would not be caught here.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { failRpc, mockRpcClient, type RpcImpl } from "@/lib/test-utils/mock-rpc-client";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const session = {
  userId: "00000000-0000-0000-0000-000000000001",
  email: "freelancer@example.com",
  fullName: "Test Kullanıcı",
  role: "FREELANCER" as const,
  publicId: "ABCD1234",
};

vi.mock("@/lib/auth/session", () => ({
  requireSession: vi.fn(async () => session),
  requireRole: vi.fn(async () => session),
}));

let rpcImpl: RpcImpl;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockRpcClient((name, args) => rpcImpl(name, args)).client),
}));

const CONTRACT_ID = "11111111-1111-1111-1111-111111111111";

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

describe("rejectContract", () => {
  it("refuses a reason under 5 characters without calling the RPC", async () => {
    const { rejectContract } = await import("./actions");
    const result = await rejectContract(
      { error: null },
      formData({ contractId: CONTRACT_ID, reason: "kısa" }),
    );
    expect(result.error).toBeTruthy();
    expect(capturedCall).toBeNull();
  });

  it("calls reject_contract with the contract id and reason", async () => {
    const { rejectContract } = await import("./actions");
    const result = await rejectContract(
      { error: null },
      formData({ contractId: CONTRACT_ID, reason: "Fiyat teklifi kabul edilemez." }),
    );
    expect(result.error).toBeNull();
    expect(capturedCall).toEqual({
      name: "reject_contract",
      args: { p_contract_id: CONTRACT_ID, p_reason: "Fiyat teklifi kabul edilemez." },
    });
  });

  it("surfaces an RPC error as a fixed Turkish message, never the raw error, but logs the raw error server-side", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    rpcImpl = failRpc("contract cannot be rejected in status ACTIVE");
    const { rejectContract } = await import("./actions");
    const result = await rejectContract(
      { error: null },
      formData({ contractId: CONTRACT_ID, reason: "Artık geç kaldı ama denedim." }),
    );
    expect(result.error).toBe("Sözleşme reddedilemedi.");
    expect(consoleError).toHaveBeenCalledWith(
      "[FAIL]",
      "contract cannot be rejected in status ACTIVE",
    );
    consoleError.mockRestore();
  });
});

describe("requestRevision", () => {
  it("refuses a note under 5 characters without calling the RPC", async () => {
    const { requestRevision } = await import("./actions");
    const result = await requestRevision(
      { error: null },
      formData({ contractId: CONTRACT_ID, note: "ok" }),
    );
    expect(result.error).toBeTruthy();
    expect(capturedCall).toBeNull();
  });

  it("calls request_revision with the contract id and note", async () => {
    const { requestRevision } = await import("./actions");
    const result = await requestRevision(
      { error: null },
      formData({ contractId: CONTRACT_ID, note: "İkinci madde netleşmeli." }),
    );
    expect(result.error).toBeNull();
    expect(capturedCall).toEqual({
      name: "request_revision",
      args: { p_contract_id: CONTRACT_ID, p_note: "İkinci madde netleşmeli." },
    });
  });
});

describe("resubmitContract", () => {
  it("requires a contract id", async () => {
    const { resubmitContract } = await import("./actions");
    const result = await resubmitContract({ error: null }, formData({}));
    expect(result.error).toBeTruthy();
    expect(capturedCall).toBeNull();
  });

  it("calls resubmit_contract with just the contract id", async () => {
    const { resubmitContract } = await import("./actions");
    const result = await resubmitContract(
      { error: null },
      formData({ contractId: CONTRACT_ID }),
    );
    expect(result.error).toBeNull();
    expect(capturedCall).toEqual({
      name: "resubmit_contract",
      args: { p_contract_id: CONTRACT_ID },
    });
  });

  it("surfaces the SQL guard's error as a fixed Turkish message, and logs the raw error server-side", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    rpcImpl = failRpc("contract is not awaiting resubmission (status ACTIVE)");
    const { resubmitContract } = await import("./actions");
    const result = await resubmitContract(
      { error: null },
      formData({ contractId: CONTRACT_ID }),
    );
    expect(result.error).toBe("Sözleşme yeniden gönderilemedi.");
    expect(consoleError).toHaveBeenCalledWith(
      "[FAIL]",
      "contract is not awaiting resubmission (status ACTIVE)",
    );
    consoleError.mockRestore();
  });
});

describe("confirmStartDate", () => {
  it("calls confirm_start_date with the contract id", async () => {
    const { confirmStartDate } = await import("./actions");
    const result = await confirmStartDate(
      { error: null },
      formData({ contractId: CONTRACT_ID }),
    );
    expect(result.error).toBeNull();
    expect(capturedCall).toEqual({
      name: "confirm_start_date",
      args: { p_contract_id: CONTRACT_ID },
    });
  });
});
