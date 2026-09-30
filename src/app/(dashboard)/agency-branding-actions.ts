"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type AgencyBranding = {
  id?: string;
  agencyName: string;
  logoUrl?: string;
  primaryColor: string;
  customFooter?: string;
  isActive: boolean;
};

/**
 * White-labeling was never gated by payment -- any signed-in user could set
 * a custom agency name/logo with no Polar integration at all. Rather than
 * building a second, differently-priced "Agency" product (2026-10-01
 * decision), this reuses the Ajans monitoring subscription
 * (monitoring_subscriptions, plan_id='AGENCY') that already advertises
 * white-label reports as one of its features and already has a working
 * Polar checkout (createMonitoringCheckout) -- see /izleme.
 */
export async function hasActiveAgencySubscription(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("monitoring_subscriptions")
    .select("id")
    .eq("subscriber_id", userId)
    .eq("plan_id", "AGENCY")
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();

  return data !== null;
}

export async function getAgencyBrandingAction(): Promise<AgencyBranding | null> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("security_agency_branding")
    .select("id, agency_name, logo_url, primary_color, custom_footer, is_active")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    agencyName: data.agency_name,
    logoUrl: data.logo_url ?? undefined,
    primaryColor: data.primary_color || "#10b981",
    customFooter: data.custom_footer ?? undefined,
    isActive: data.is_active,
  };
}

export async function saveAgencyBrandingAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();
  const agencyName = String(formData.get("agencyName") || "").trim();
  const logoUrl = String(formData.get("logoUrl") || "").trim();
  const primaryColor = String(formData.get("primaryColor") || "#10b981").trim();
  const customFooter = String(formData.get("customFooter") || "").trim();
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  if (!agencyName) {
    return { success: false, error: "Ajans veya Stüdyo ismi zorunludur." };
  }

  // White-labeling is an Ajans plan feature -- gate it the same way every
  // other paid capability in this codebase is gated (the subscription's
  // ACTIVE status is the authorization), not left open to any signed-in
  // user regardless of payment.
  if (isActive && !(await hasActiveAgencySubscription(session.userId))) {
    return {
      success: false,
      error: "White-label marka özelleştirmesi Ajans planına özeldir. Aktifleştirmeden önce /izleme üzerinden Ajans planına abone olun.",
    };
  }

  const supabase = await createClient();

  // Upsert on user_id conflict
  const { error } = await supabase.from("security_agency_branding").upsert(
    {
      user_id: session.userId,
      agency_name: agencyName,
      logo_url: logoUrl || null,
      primary_color: primaryColor,
      custom_footer: customFooter || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/white-label");
  revalidatePath("/audit", "layout");
  return { success: true };
}
