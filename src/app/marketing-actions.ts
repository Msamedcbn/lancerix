"use server";

import { FAIL, firstIssue, type FormState } from "@/lib/forms";
import { createStandaloneOrderCheckout, payViaPolarCheckout } from "@/lib/polar";
import { createOrderAndRunCheck } from "@/lib/qa/standalone-order";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  STANDALONE_CHECK_FEE_KURUS,
  standaloneMarketingPurchaseSchema,
} from "@/lib/validations/standalone-qa";

export type { FormState };

/**
 * The homepage's self-serve package purchase: a visitor with no account at
 * all fills in email + password + a URL, and the whole thing -- account,
 * order, scan, Polar checkout redirect -- happens from this one submit.
 * Everything downstream of "the account now exists" reuses the exact same,
 * already-tested pieces createStandaloneCheck/payStandaloneCheck
 * (standalone-qa-actions.ts) use; this action only owns the part that's new
 * here, account creation.
 *
 * Email confirmation is deliberately skipped for this path
 * (`email_confirm: true` on admin.createUser) -- everywhere else in this
 * codebase that trusts an email address unverified (F-3's invite RLS) does
 * so to grant access to someone else's existing resource, which is why it
 * requires a verified `auth.email()` match. This case is different: the
 * account is brand new, owns nothing anyone else has a claim to, and a
 * successful card payment is itself a stronger signal of real intent than a
 * clicked email link. The tradeoff is real (someone could type an email
 * they don't own) but it costs nobody but the signer-upper their own
 * order confirmations, not a security boundary.
 */
export async function purchaseStandaloneCheck(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = standaloneMarketingPurchaseSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    targetUrl: formData.get("targetUrl"),
    checkType: formData.get("checkType") ?? "ACCESSIBILITY",
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const { email, password, targetUrl, checkType } = parsed.data;

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    if (createError?.code === "email_exists" || /already.*registered/i.test(createError?.message ?? "")) {
      return FAIL("Bu e-posta zaten kayıtlı. Giriş yaparak devam edebilirsin.");
    }
    console.error("[FAIL]", createError?.message ?? "createUser returned no user");
    return FAIL("Hesap oluşturulamadı. Tekrar dene.");
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error("[FAIL]", signInError.message);
    return FAIL("Hesap açıldı ama giriş yapılamadı. /login üzerinden giriş yapıp tekrar dene.");
  }

  const result = await createOrderAndRunCheck(supabase, created.user.id, { targetUrl, checkType });
  if (!result.ok) return FAIL(result.error);

  return payViaPolarCheckout((customerIp) =>
    createStandaloneOrderCheckout(result.orderId, STANDALONE_CHECK_FEE_KURUS, checkType, customerIp),
  );
}
