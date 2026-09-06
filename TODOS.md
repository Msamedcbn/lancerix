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

---

## Notification failure visibility in admin

**What:** No admin-visible record of whether a transactional email (invite,
signature request, delivery notice, review reminder, message notification)
actually sent. `sendEmail()` (`src/lib/notify/email.ts`) returns
`{ok: false, reason}` on failure, but that surfaces once, on the page that
triggered it (e.g. `?inviteMailFailed=1`), to the user who happened to be
looking. Nothing in `/admin` shows a failure after that moment passes.

**Why:** The product's whole claim is that silence has consequences
("sessizlik kabul sayılır") -- the objection window only being fair rests on
the client having actually been told it opened. A mail that silently failed
to send is the exact failure mode the product exists to prevent, and today
nobody would know it happened unless the affected user complained.

**Context:** Found 2026-09-06 while auditing `/admin` end to end
(`/plan-eng-review`). Deliberately split out of that review's A+B+C+D scope
(reviewer identity, null reviewer rate, search coverage, user-detail project
requests) because it is a new capability, not a polish fix: needs a log
table, wrapping every call site in `email.ts` (~8 notify functions), and a
new admin page -- roughly 9-10 files combined with A-D, which is exactly the
kind of bundling this project's own review process flags as a smell.
Shape it like the existing append-only patterns already in this codebase
(`admin_activity_log`, `delivery_events`): one row per send attempt,
`ok`/`reason`, never updated or deleted.

**Effort estimate:** M (human ~1-2 days) → CC: ~2-3 hours.
**Priority:** P2 -- real risk to the product's core promise, but zero
external users today means zero failures have actually gone unnoticed yet.
**Depends on / blocked by:** Nothing; independent of other phasing.

---

## Company hierarchy infrastructure (multi-admin + full reviewer portal)

**What:** Two related pieces of speculative-until-real-need infrastructure,
deliberately bundled because they're the same shape of mistake if built
early: (a) multi-admin permission tiers (e.g. support vs. finance scopes),
for when a second admin actually exists; (b) a full `REVIEWER` login role
with its own dashboard and self-service rate-setting, upgrading the
lightweight token-link design shipped in the 2026-09-06 review.

**Why:** The founder explicitly asked for this as "Faz 2" of the
2026-09-06 CEO review ("A ve C sırasıyla" -- do the 4-role audit now, queue
the hierarchy work next). It was not built now because: today there is one
admin (the founder) and the multi-admin scope was already evaluated and
rejected once, on 2026-09-04, for solving a team-scale problem that doesn't
exist yet; and the full reviewer portal's real cost (a new Postgres enum
value requiring its own migration before anything can reference it, plus
re-deriving this codebase's contract-invite claim flow -- a pattern that
already broke once in production and was pulled into a standalone RPC for
exactly that fragility) turned out to be XL, not the CC-~1-day estimate
first given, once outside-voice review checked the actual code. Building
either piece without a real second admin or real reviewer-volume pain to
design against means guessing at requirements instead of building against
them.

**Context:** See `~/.gstack/projects/demearac/ceo-plans/2026-09-06-four-role-first-user-audit.md`
for the full review, including the corrected cost analysis of the reviewer
portal and the lightweight token-link design that shipped in its place
(`src/app/reviewer-report/[token]/page.tsx` once implemented). When this is
picked up: the multi-admin half needs an RLS redesign across every
`is_admin()` policy site (not just a new role check); the reviewer-portal
half needs the enum-value migration sequenced separately from any migration
that references it.

**Effort estimate:** XL (human ~2-3 weeks) → CC: ~2-3 days.
**Priority:** P3 -- speculative until triggered.
**Depends on / blocked by:** (a) an actual second admin being hired; (b)
Tier 3/4 order volume high enough that the token-link workflow visibly
strains. Neither has happened yet.
