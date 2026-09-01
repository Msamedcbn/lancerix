/**
 * chooseQaTier: the freelancer's tier pick, now a single choose_qa_tier() RPC
 * (see 20260901160000_atomic_qa_writes.sql) instead of a transition-then-
 * insert pair. What's worth proving in TS is what stays in TS: the
 * reviewer-required gate for Tier 3/4, that TIER2 is refused before any RPC
 * call now that it's marked unavailable, and that the right tier/reviewer
 * reach the RPC.
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

const DELIVERY_ID = "22222222-2222-2222-2222-222222222222";
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

describe("chooseQaTier", () => {
  it("refuses TIER2 before calling the RPC -- not orderable yet", async () => {
    const { chooseQaTier } = await import("./qa-actions");
    const result = await chooseQaTier(
      { error: null },
      formData({ deliveryId: DELIVERY_ID, contractId: CONTRACT_ID, tier: "TIER2" }),
    );
    expect(result.error).toBeTruthy();
    expect(capturedCall).toBeNull();
  });

  it("requires a reviewer for TIER3 before calling the RPC", async () => {
    const { chooseQaTier } = await import("./qa-actions");
    const result = await chooseQaTier(
      { error: null },
      formData({ deliveryId: DELIVERY_ID, contractId: CONTRACT_ID, tier: "TIER3" }),
    );
    expect(result.error).toBeTruthy();
    expect(capturedCall).toBeNull();
  });

  it("calls choose_qa_tier for TIER1 with no reviewer", async () => {
    const { chooseQaTier } = await import("./qa-actions");
    const result = await chooseQaTier(
      { error: null },
      formData({ deliveryId: DELIVERY_ID, contractId: CONTRACT_ID, tier: "TIER1" }),
    );
    expect(result.error).toBeNull();
    expect(capturedCall).toEqual({
      name: "choose_qa_tier",
      args: { p_delivery_id: DELIVERY_ID, p_tier: "TIER1", p_reviewer_id: null },
    });
  });

  it("calls choose_qa_tier for TIER3 with the chosen reviewer", async () => {
    const { chooseQaTier } = await import("./qa-actions");
    const result = await chooseQaTier(
      { error: null },
      formData({
        deliveryId: DELIVERY_ID,
        contractId: CONTRACT_ID,
        tier: "TIER3",
        reviewerId: REVIEWER_ID,
      }),
    );
    expect(result.error).toBeNull();
    expect(capturedCall).toEqual({
      name: "choose_qa_tier",
      args: { p_delivery_id: DELIVERY_ID, p_tier: "TIER3", p_reviewer_id: REVIEWER_ID },
    });
  });

  it("surfaces an illegal-transition error from the RPC", async () => {
    rpcImpl = failRpc("illegal delivery transition ACCEPTED -> QA_QUEUED");
    const { chooseQaTier } = await import("./qa-actions");
    const result = await chooseQaTier(
      { error: null },
      formData({
        deliveryId: DELIVERY_ID,
        contractId: CONTRACT_ID,
        tier: "TIER3",
        reviewerId: REVIEWER_ID,
      }),
    );
    expect(result.error).toBe("illegal delivery transition ACCEPTED -> QA_QUEUED");
  });
});
