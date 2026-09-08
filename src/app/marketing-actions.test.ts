/**
 * purchaseStandaloneCheck: the only genuinely new logic here is account
 * creation + immediate sign-in (createStandaloneOrder itself is already
 * covered by standalone-qa-actions.test.ts and standalone.test.ts, so it's
 * mocked rather than re-exercised). Since the pay-first switch this action
 * no longer scans anything -- it writes a PENDING order and redirects; the
 * scan runs off the order.paid webhook. What's worth proving in TS: a bad form
 * never reaches admin.createUser, a duplicate email surfaces a "log in
 * instead" message without ever calling signInWithPassword, a failed
 * sign-in stops before any order is created, and a successful run redirects
 * straight to Polar checkout.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

type CreateUserRoute = () => {
  data: { user: { id: string } | null };
  error: { message: string; code?: string } | null;
};
type SignInRoute = () => { error: { message: string } | null };
let createUserRoute: CreateUserRoute;
let signInRoute: SignInRoute;
const signInMock = vi.fn(async () => signInRoute());

function adminClient() {
  return {
    auth: {
      admin: {
        createUser: vi.fn(async () => createUserRoute()),
      },
    },
  };
}

function userClient() {
  return {
    auth: {
      signInWithPassword: signInMock,
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn(() => adminClient()) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => userClient()) }));

let orderResult: { ok: true; orderId: string } | { ok: false; error: string };
const createStandaloneOrderMock = vi.fn(async (..._args: unknown[]) => orderResult);
vi.mock("@/lib/qa/standalone-order", () => ({
  createStandaloneOrder: (...args: unknown[]) => createStandaloneOrderMock(...args),
}));

// Same reasoning as standalone-qa-actions.test.ts's own @/lib/polar mock:
// replicate payViaPolarCheckout's real try/catch-then-redirect contract
// without importing the real polar.ts and its @polar-sh/sdk import chain.
const createCheckoutMock = vi.fn(async (..._args: unknown[]) => "https://polar.sh/mock-checkout");
vi.mock("@/lib/polar", () => ({
  createStandaloneOrderCheckout: createCheckoutMock,
  payViaPolarCheckout: vi.fn(async (createCheckout: (ip?: string) => Promise<string>) => {
    let url: string;
    try {
      url = await createCheckout(undefined);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Ödeme linki oluşturulamadı." };
    }
    throw new Error(`REDIRECT:${url}`);
  }),
}));

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

const VALID_FORM = {
  email: "new-buyer@example.com",
  password: "correct-horse-battery",
  targetUrl: "https://example.com",
  packageId: "BASIC",
};

beforeEach(() => {
  createUserRoute = () => ({ data: { user: { id: "user-1" } }, error: null });
  signInRoute = () => ({ error: null });
  orderResult = { ok: true, orderId: "order-1" };
  createStandaloneOrderMock.mockClear();
  createCheckoutMock.mockClear();
  signInMock.mockClear();
});

describe("purchaseStandaloneCheck", () => {
  it("refuses an invalid form without creating an account", async () => {
    const { purchaseStandaloneCheck } = await import("./marketing-actions");
    const result = await purchaseStandaloneCheck(
      { error: null },
      formData({ ...VALID_FORM, email: "not-an-email" }),
    );
    expect(result.error).toBeTruthy();
    expect(signInMock).not.toHaveBeenCalled();
    expect(createStandaloneOrderMock).not.toHaveBeenCalled();
  });

  it("refuses a password under 8 characters without creating an account", async () => {
    const { purchaseStandaloneCheck } = await import("./marketing-actions");
    const result = await purchaseStandaloneCheck(
      { error: null },
      formData({ ...VALID_FORM, password: "short" }),
    );
    expect(result.error).toBeTruthy();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("tells a duplicate email to log in instead, without attempting sign-in", async () => {
    createUserRoute = () => ({ data: { user: null }, error: { message: "already registered", code: "email_exists" } });
    const { purchaseStandaloneCheck } = await import("./marketing-actions");
    const result = await purchaseStandaloneCheck({ error: null }, formData(VALID_FORM));
    expect(result.error).toMatch(/giriş yap/i);
    expect(signInMock).not.toHaveBeenCalled();
    expect(createStandaloneOrderMock).not.toHaveBeenCalled();
  });

  it("surfaces a generic account-creation failure", async () => {
    createUserRoute = () => ({ data: { user: null }, error: { message: "database offline" } });
    const { purchaseStandaloneCheck } = await import("./marketing-actions");
    const result = await purchaseStandaloneCheck({ error: null }, formData(VALID_FORM));
    expect(result.error).toBeTruthy();
    expect(result.error).not.toMatch(/database offline/);
  });

  it("stops before creating an order when sign-in fails after account creation", async () => {
    signInRoute = () => ({ error: { message: "invalid credentials" } });
    const { purchaseStandaloneCheck } = await import("./marketing-actions");
    const result = await purchaseStandaloneCheck({ error: null }, formData(VALID_FORM));
    expect(result.error).toBeTruthy();
    expect(createStandaloneOrderMock).not.toHaveBeenCalled();
  });

  it("surfaces the order-creation failure without redirecting to checkout", async () => {
    orderResult = { ok: false, error: "Site yüklenemedi. Adresi kontrol edip tekrar dene." };
    const { purchaseStandaloneCheck } = await import("./marketing-actions");
    const result = await purchaseStandaloneCheck({ error: null }, formData(VALID_FORM));
    expect(result.error).toBe("Site yüklenemedi. Adresi kontrol edip tekrar dene.");
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });

  it("creates the account and redirects straight to Polar checkout, without scanning", async () => {
    const { purchaseStandaloneCheck } = await import("./marketing-actions");
    await expect(purchaseStandaloneCheck({ error: null }, formData(VALID_FORM))).rejects.toThrow(
      "REDIRECT:https://polar.sh/mock-checkout",
    );
    expect(signInMock).toHaveBeenCalledWith({ email: VALID_FORM.email, password: VALID_FORM.password });
    expect(createStandaloneOrderMock).toHaveBeenCalledWith(expect.anything(), "user-1", {
      targetUrl: VALID_FORM.targetUrl,
      packageId: VALID_FORM.packageId,
    });
    expect(createCheckoutMock).toHaveBeenCalledWith("order-1", 19900, VALID_FORM.packageId, undefined);
  });
});

