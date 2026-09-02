/**
 * setQaSelection: the client's QA package pick, now a single
 * set_qa_selection() RPC (see 20260902070000_client_selects_qa_tier.sql)
 * called before signing, not the freelancer's choose_qa_tier() after
 * delivery. What's worth proving in TS is what stays in TS: the
 * reviewer-required gate for Tier 3/4, that TIER2 is refused before any RPC
 * call now that it's marked unavailable, and that the right tier/reviewer
 * reach the RPC.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { failRpc, mockRpcClient, type RpcImpl } from "@/lib/test-utils/mock-rpc-client";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const session = {
  userId: "00000000-0000-0000-0000-000000000001",
  email: "client@example.com",
  fullName: "Test Kullanıcı",
  role: "CLIENT" as const,
  publicId: "ABCD1234",
};

vi.mock("@/lib/auth/session", () => ({
  requireSession: vi.fn(async () => session),
  requireRole: vi.fn(async () => session),
}));

vi.mock("@/lib/data/contracts", () => ({
  getContract: vi.fn(async () => null),
}));

vi.mock("@/lib/notify/email", () => ({
  notifyDeliverySubmitted: vi.fn(async () => ({ ok: true })),
  notifyQaOutcome: vi.fn(async () => ({ ok: true })),
}));

let rpcImpl: RpcImpl;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockRpcClient((name, args) => rpcImpl(name, args)).client),
}));

const CONTRACT_ID = "11111111-1111-1111-1111-111111111111";
const REVIEWER_ID = "33333333-3333-3333-3333-333333333333";

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

describe("setQaSelection", () => {
  it("refuses TIER2 before calling the RPC -- not orderable yet", async () => {
    const { setQaSelection } = await import("./qa-actions");
    const result = await setQaSelection(
      { error: null },
      formData({ contractId: CONTRACT_ID, tier: "TIER2" }),
    );
    expect(result.error).toBeTruthy();
    expect(capturedCall).toBeNull();
  });

  it("requires a reviewer for TIER3 before calling the RPC", async () => {
    const { setQaSelection } = await import("./qa-actions");
    const result = await setQaSelection(
      { error: null },
      formData({ contractId: CONTRACT_ID, tier: "TIER3" }),
    );
    expect(result.error).toBeTruthy();
    expect(capturedCall).toBeNull();
  });

  it("calls set_qa_selection for TIER1 with no reviewer", async () => {
    const { setQaSelection } = await import("./qa-actions");
    const result = await setQaSelection(
      { error: null },
      formData({ contractId: CONTRACT_ID, tier: "TIER1" }),
    );
    expect(result.error).toBeNull();
    // No reviewer means the key is absent, not null: the RPC defaults the
    // argument, and PostgREST types an optional arg as undefined.
    expect(capturedCall).toEqual({
      name: "set_qa_selection",
      args: { p_contract_id: CONTRACT_ID, p_tier: "TIER1" },
    });
  });

  it("calls set_qa_selection for TIER3 with the chosen reviewer", async () => {
    const { setQaSelection } = await import("./qa-actions");
    const result = await setQaSelection(
      { error: null },
      formData({
        contractId: CONTRACT_ID,
        tier: "TIER3",
        reviewerId: REVIEWER_ID,
      }),
    );
    expect(result.error).toBeNull();
    expect(capturedCall).toEqual({
      name: "set_qa_selection",
      args: { p_contract_id: CONTRACT_ID, p_tier: "TIER3", p_reviewer_id: REVIEWER_ID },
    });
  });

  it("surfaces a locked-selection error from the RPC", async () => {
    rpcImpl = failRpc("contract already has a signature -- the QA selection is locked");
    const { setQaSelection } = await import("./qa-actions");
    const result = await setQaSelection(
      { error: null },
      formData({
        contractId: CONTRACT_ID,
        tier: "TIER3",
        reviewerId: REVIEWER_ID,
      }),
    );
    expect(result.error).toBe(
      "contract already has a signature -- the QA selection is locked",
    );
  });
});
