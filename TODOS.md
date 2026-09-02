# Lancerix — TODOs

Deferred work with context, not a task tracker. See `STATUS.md` for what's
currently shipped; see `~/.gstack/projects/demearac/ceo-plans/` for the full
review history behind these entries.

## LemonSqueezy webhook reconciliation sweep

**What:** A daily cron that queries LemonSqueezy's API for any `qa_tier_orders`
row still `PENDING` past a reasonable window, in case the webhook that should
have marked it `PAID` never arrived.

**Why:** `payment_status` is only ever advanced by the LemonSqueezy webhook
handler (`src/app/api/webhooks/lemonsqueezy/route.ts`). If that webhook is
lost — a Vercel deploy mid-delivery, a LemonSqueezy-side retry exhaustion —
the order stays `PENDING` forever with no path to recovery except a manual
admin fix. This predates the 2026-09-03 Tier1-pricing plan (it already
applies to Tier3/4 today) but becomes more visible once Tier1, the
highest-volume tier, also goes through payment.

**Context:** The existing `src/app/api/cron/process-tier2-qa/route.ts` is the
template — same "claim + sweep" shape, different API to poll. Query
LemonSqueezy's orders/checkouts endpoint by the stored checkout reference,
compare against local `payment_status`, and reconcile.

**Effort estimate:** S (human ~1 day) → CC: ~1-2 hours.
**Priority:** P2 — real but rare.
**Depends on / blocked by:** Nothing; independent of the F-4/F-3/D phasing.

---

## Invite expiry / stale-invite handling

**What:** A way to surface (and eventually act on) a contract sent to an
email that never registered — currently the MVP decision (2026-09-03 CEO
review, Section 4) is to wait indefinitely with no expiry state.

**Why:** At MVP scale this is a non-issue — a freelancer with one pending
invite can just cancel it manually if needed. At real volume, unclaimed
invites will accumulate silently with no dashboard visibility into how many
are stuck, which could look like a broken product from the outside without
anyone noticing internally.

**Context:** Depends on `20260901030000_invite_by_email_and_structured_criteria.sql`'s
revival (F-3, planned) actually shipping and collecting real usage data
first — there's no invite volume yet to size this problem against. Revisit
after F-3 has been live for a few weeks.

**Effort estimate:** S (human ~half day) → CC: ~30 min.
**Priority:** P3.
**Depends on / blocked by:** F-3 shipping and accumulating real invite data.
