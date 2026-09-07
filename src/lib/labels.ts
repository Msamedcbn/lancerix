import type { Enums } from "@/lib/supabase/database.types";

/**
 * The one place `user_role` gets a Turkish display label. Used to live as
 * four separately hand-typed copies (profile-card.tsx, admin/search,
 * admin/users/[id]/page.tsx, admin/users/[id]/user-management.tsx) that had
 * already drifted: CLIENT read "İşveren" on the public profile card and
 * "Müşteri" everywhere in the admin dashboard. "Müşteri" is the one kept
 * here -- it matches the app's own naming (the `(dashboard)/client` route,
 * `client_id` columns) and this is a client/freelancer marketplace, not an
 * employment relationship, so "İşveren" (employer) was the wrong word.
 *
 * No "server-only" import here on purpose: this constant is used from both
 * Server Components (profile-card.tsx) and a "use client" form
 * (user-management.tsx), unlike src/lib/data/profile.ts.
 */
export const ROLE_LABEL: Record<Enums<"user_role">, string> = {
  FREELANCER: "Freelancer",
  CLIENT: "Müşteri",
  ADMIN: "Yönetici",
};

/**
 * platform_invoices.invoice_type / .status are plain `text` columns with a
 * SQL check constraint (20260901090000_platform_invoices.sql), not a
 * Postgres enum, so there's no `Enums<...>` to key these off of the way
 * ROLE_LABEL does. The literal unions here are that constraint's TS mirror.
 *
 * Used to be two byte-identical copies (admin/invoices/page.tsx as
 * TYPE_LABEL/STATUS_LABEL/STATUS_TONE, client/invoices/page.tsx as
 * INVOICE_TYPE_LABEL/INVOICE_STATUS_LABEL/INVOICE_STATUS_TONE) that could
 * silently drift apart the way ROLE_LABEL already had -- a new invoice_type
 * value added to one page and not the other would fall back to the raw
 * enum string on whichever page was missed, with no type error to catch it.
 */
export type PlatformInvoiceType = "WORK_START" | "QA_SERVICE" | "CUSTOM";
export type PlatformInvoiceStatus = "PENDING" | "PAID" | "CANCELLED";

export const INVOICE_TYPE_LABEL: Record<PlatformInvoiceType, string> = {
  WORK_START: "İş başlangıcı",
  QA_SERVICE: "QA hizmeti",
  CUSTOM: "Özel",
};

export const INVOICE_STATUS_LABEL: Record<PlatformInvoiceStatus, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  CANCELLED: "İptal",
};

export const INVOICE_STATUS_TONE: Record<PlatformInvoiceStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

/**
 * reviewers.level (20260901010000_qa_faz1_product_type.sql) is another plain
 * `text` + check-constraint column, same shape as the invoice fields above.
 * Used to be five byte-identical copies (admin/qa-queue, admin/reviewers,
 * admin/users, admin/users/[id], contracts/[id]/qa-selection-panel) --
 * adding a third level (e.g. LEAD) meant patching all five by hand, and
 * missing one left that screen showing the raw enum string while the other
 * four showed the friendly label.
 */
export type ReviewerLevel = "PRINCIPAL" | "SENIOR";

export const LEVEL_LABEL: Record<ReviewerLevel, string> = {
  PRINCIPAL: "Principal / Lead",
  SENIOR: "Senior",
};

/**
 * profiles.referral_source (20260907000000_signup_referral_source.sql) --
 * same plain-text-plus-CHECK shape as the fields above. Mirrors
 * REFERRAL_SOURCES in src/lib/validations/auth.ts, which the register form
 * and its Zod schema use; that file can't import this one (auth.ts has no
 * "server-only" dependency and stays that way), so the two lists are kept in
 * sync by hand -- change one, change both.
 */
export type ReferralSource = "GOOGLE" | "SOCIAL_MEDIA" | "FRIEND_REFERRAL" | "ADVERTISEMENT" | "OTHER";

export const REFERRAL_SOURCE_LABEL: Record<ReferralSource, string> = {
  GOOGLE: "Google / arama",
  SOCIAL_MEDIA: "Sosyal medya",
  FRIEND_REFERRAL: "Arkadaş tavsiyesi",
  ADVERTISEMENT: "Reklam",
  OTHER: "Diğer",
};
