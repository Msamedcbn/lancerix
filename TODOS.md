## Five monetization models on top of the standalone verification engine

**What:** Five candidate revenue models proposed 2026-09-08, none built yet:
1. **Pre-purchase "ekspertiz" check** for Flippa/Acquire.com-style site
   acquisitions -- passive-only (checks for exposed `/.env`, `/.git/config`
   etc. via a plain public HTTP request, same risk class as SEO_META/
   DEAD_LINKS; never attempts to use a discovered credential) -- an active
   scan here would repeat the exact authorization problem the Cyber
   Security tier's contract-only scoping already exists to avoid, since
   nobody involved (buyer or Lancerix) owns the target site.
2. **White-label agency reports** -- agency uploads a logo, gets a
   branded PDF; `pdf-lib`/`@pdf-lib/fontkit` are already dependencies.
   Subscription (Polar recurring), $79/mo for 10 reports.
3. **"Sessiz Nöbetçi" monitoring retainer** -- nightly cron re-runs a
   check against a subscriber's own site, alerts on regression. Open
   question, not decided: does the nightly form check actually submit
   (real lead in the owner's inbox every night, like Pingdom-style
   uptime tools do) or stay structural-only (this project's established
   no-submit pattern, see FORM_VALIDATION/INTERACTION_SCAN)? Needs a
   product decision before building, not an engineering default.
4. **"Lancerix Verified" trust badge** -- embeddable widget + public
   verification lookup page, same public-report pattern as the existing
   `public_qa_report()`/`/report/[token]` share feature.
5. **Forensic evidence pack** -- a beefed-up report (HAR logs,
   screenshots, precise timestamps) for Upwork/Bionluk payment disputes.
   Natural extension of the existing timestamped/hashed report, not a new
   paradigm.

**Starter combination the user wants to build toward:** free first scan
(hooks the user in) -> $29 one-time to unlock full detail -> $12/mo
upsell for weekly automatic re-scans. Half-built already: the pay-to-
unlock-detail architecture (`/site-kontrol`, `standalone_qa_orders`) is
exactly this shape today, just priced at ₺99 with no free first scan. Two
real gaps: (a) making the first standalone check actually free (a new,
distinct decision from the first-contract-fee-waiver *removed* from
Tier1/2 this same night -- different purpose: a freemium funnel hook, not
a friction-easing promo for a newly-priced B2B tier), (b) a real recurring
subscription via Polar + a weekly cron re-run + regression notification,
none of which exists yet.

**Why not built tonight:** Proposed at the very end of an already very
large session (tier restructure + 5 new standalone check types shipped the
same night) -- capturing the decision and the reality-check here rather
than starting a sixth major build in the same sitting.

**Effort estimate:** Varies a lot per item -- #2/#4/#5 are each roughly the
size of one of tonight's standalone modules (S-M). #3 needs a scheduling/
notification decision first. The starter combo's subscription leg (Polar
recurring + cron) is its own M-sized piece.
**Priority:** P1 -- this is the user's stated next direction, not
speculative.
**Depends on / blocked by:** #3 needs the submit-vs-structural product
decision above. The starter combo's $12/mo leg needs Polar subscription
product setup (not yet created, distinct from the existing one-time
custom-price product).

---

# Lancerix — TODOs

Deferred work with context, not a task tracker. See `STATUS.md` for what's
currently shipped; see `~/.gstack/projects/demearac/ceo-plans/` for the full
review history behind these entries.

## Bundle standalone check types into tiered packages (Temel/Standart/Kapsamlı)

**What:** `/site-kontrol` and the homepage marketing form currently sell
each of the 7 standalone check types (`STANDALONE_CHECK_TYPES`) as its own
₺99 à la carte item. The user's stated direction (2026-09-08: "8e çıkarmak
değilde uçtan uca test platformuna evriliyoruz... paketleri özel
içeriklerle oluştururuz") is a small number of curated PACKAGES, each
bundling several check types into one order for one price -- not a flat
list of 7 individually-purchasable items.

**Why not done tonight:** This is a genuinely different order shape (one
order that runs N check functions and aggregates N results), not a copy
extension of the existing one-check-per-order model, plus a real new
pricing decision (does a bundle cost more than ₺99, and by how much) the
user hasn't given a number for yet. Shipping the 7 check types individually
first was the safe, already-decided, immediately buildable slice; this is
the follow-up presentation-layer decision.

**Context:** A sensible starting split (offered, not yet approved) was:
Temel (Erişilebilirlik, Ölü/Kırık Link, Form & Validasyon), Standart (+ Hız
& Performans, SEO & Meta, Görsel Taşma), Kapsamlı (+ API, Çeviri, Genel
Etkileşim -- once C/D above are built). The cost-bearing modules (Tier2-style
Agentic QA if ever added standalone, or Çeviri's small LLM cost) belong in
the most expensive tier so their cost is absorbed by that tier's price, not
the cheapest one.

**Effort estimate:** M (human ~2-3 days) -> CC: ~1 day -- `standalone_qa_orders`
needs a way to reference multiple check_types per order (or a
`standalone_qa_order_items` child table), `createOrderAndRunCheck` needs to
run N checks and aggregate N reports, the report UI needs a
multi-section layout instead of one detail component per order.
**Priority:** P2 -- the 7 individual checks work and are sellable today;
this is a conversion/pricing optimization, not a blocker.
**Depends on / blocked by:** A pricing decision (bundle price per tier) from
the user.

---

## No password-reset flow anywhere in the app

**What:** A user who forgets their password has no way back into their
account -- there is no `/forgot-password` route, no Supabase
`resetPasswordForEmail()` call anywhere in the codebase.

**Why:** Found 2026-09-08 while building the homepage self-serve purchase
(`purchaseStandaloneCheck`, `src/app/marketing-actions.ts`), which creates a
user's password for them via a plain text field they choose once and never
see again. That flow made the gap more visible (a self-serve buyer has no
relationship with the founder to ask for help), but the gap is not specific
to it -- it applies to every account in the app, including ones created
through the normal `/register` flow.

**Context:** `src/app/(auth)/actions.ts` has `login`/`register`/`signOut`
only. Supabase Auth supports this natively
(`supabase.auth.resetPasswordForEmail()` + a `/reset-password` page reading
the recovery token from `/auth/callback`'s existing redirect handling) --
this is additive, not a redesign of the existing auth actions.

**Effort estimate:** S (human ~1 day) -> CC: ~2-3 hours -- one new route, one
new server action, reusing the existing `/auth/callback` handler's pattern.
**Priority:** P2 -- real risk grows with the self-serve signup volume this
session's marketing flow is meant to generate; zero cost while volume is
near zero.
**Depends on / blocked by:** Nothing technical.

---

## Verification-tier expansion beyond QA + cybersecurity

**What:** Candidate new verification tiers for `/site-kontrol` (standalone,
contract-free), same shape as Tier2's "agentic QA" (automated check, fixed
fee, timestamped report): (A) accessibility/WCAG compliance via
`axe-core` — **shipped 2026-09-08** — (B) performance/Core Web Vitals via
Lighthouse — **shipped 2026-09-08** — (C) API contract testing via an
OpenAPI spec the freelancer supplies — still unbuilt, needs a new
delivery-artifact type — (D) localization/i18n QA via a light LLM pass —
still unbuilt. Also shipped the same night, from a second candidate list
(screenshot table, not the original A-D): SEO_META, VISUAL_OVERFLOW,
DEAD_LINKS, FORM_VALIDATION, INTERACTION_SCAN — all in
`src/lib/qa/standalone.ts`, all zero-LLM-cost. `/site-kontrol` now offers 7
check types total.
Cybersecurity (Nuclei) is **not** in this list anymore — see its own entry
below, it's scoped to contract-bound projects only, not standalone.

**Why:** 2026-09-08, `/office-hours` exploring what else fits the "automated
verification -> report" model. A/B are deterministic (no LLM judgment, no
per-run cost variance) and reuse the Playwright plumbing `agent.ts` already
has. C requires the freelancer to supply an OpenAPI spec, a different
delivery shape than the staging-URL flow covers today. D is the most
defensible (no direct competitor found) but is a build, not an integration.

**Context:** The user separately raised converting the *automated* tiers to
a recurring subscription instead of a one-off project fee — notable because
Polar rejected Lancerix's contract-bound QA account for looking like a
"technical review service" rather than a SaaS subscription (see
`~/.gstack/projects/demearac/ceo-plans/2026-09-08-positioning-verification-first.md`).
Explicitly deferred (user: "şimdilik karar verme") — who subscribes and how
usage is metered against real API cost are open questions. Do not build
subscription billing against this until that's resolved.

**Effort estimate:** B shipped 2026-09-08 as estimated (~half day CC),
exactly the pattern anticipated (`standalone.ts` + `standalone-qa-actions.ts`
+ `site-kontrol/page.tsx` extended by `check_type`, not rebuilt) — plus two
real bugs the estimate didn't anticipate (see below). C: M — needs a new
delivery-artifact type (spec file, not just a staging URL). D: M-L — no OSS
to adopt.
**Priority:** C/D are now P3 — exploratory, no committed scope yet.
**Depends on / blocked by:** C/D blocked on the subscription-vs-per-order
pricing decision above before being scoped.

**B's two real bugs, both found and fixed the same night (2026-09-08):**
1. `lighthouse` pulls in `@paulirish/trace_engine`, which webpack's bundler
   can't statically resolve ("'ParsedURL' is not exported from
   ../../core/common/common.js") — broke the whole `/site-kontrol` route at
   build time, not just the new check. Fixed via `serverExternalPackages:
   ["lighthouse", "chrome-launcher", "@paulirish/trace_engine"]` in
   `next.config.ts` (Next's documented escape hatch for large server-only
   packages webpack can't bundle cleanly — same class of package as
   sharp/puppeteer).
2. **Severity: crashes the whole server, not just the request.**
   `chrome-launcher`'s `launch()` (unlike Playwright's `chromium.launch()`,
   which rejects cleanly) can fail via an unhandled `'error'` event on the
   spawned child process — an uncaught exception that takes down every
   in-flight request on the process, not just the one that triggered it.
   Verified locally: a non-executable chromium binary (this Windows dev
   machine, same pre-existing `@sparticuz/chromium` Lambda-only-binary
   limitation as Tier2/accessibility) crashed the entire `next dev` process.
   Fixed with a scoped `process.once("uncaughtException", ...)` listener
   around the `chromeLauncher.launch()` call (removed the instant it
   settles either way, so it can't swallow an unrelated concurrent
   request's error) — see `runPerformanceCheck` in `src/lib/qa/standalone.ts`
   for the full reasoning. `existsSync()` alone was tried first and wasn't
   enough: `@sparticuz/chromium` extracts its Linux binary to a fixed temp
   path unconditionally, so the file genuinely exists on Windows, it just
   isn't a runnable binary there — a different failure class than "no file."
   This is real production hardening, not only a dev-machine workaround: the
   same crash class would hit a corrupted/missing binary on a cold Lambda
   container too.

---

## Cyber Security tier (Nuclei) — contract-bound only, not standalone

**What:** A new QA add-on that runs Nuclei (CLI vulnerability scanner,
non-intrusive/misconfig-and-exposure template tags only — `dos`/`intrusive`
tags explicitly excluded) against a contract's staging URL. Purchasable
alongside the existing Tier1-4 QA selection, same `set_qa_selection()`-style
gate (locked at signature).

**Why:** 2026-09-08 decision (user): Nuclei is a real vulnerability scanner,
not a passive check like axe-core — running it against a URL the requester
doesn't provably own is unauthorized security testing, a real legal/abuse
risk. Restricting it to **contract-bound projects only** turns the signed
3-way contract itself into the authorization signal (two identity-verified
accounts, an agreed staging URL, a named counterparty, a full audit trail) —
meaningfully stronger than an anonymous URL paste, without building a
separate DNS/file domain-ownership flow first. Standalone `/site-kontrol`
will **never** offer this tier.

**Context:** Two extra mitigations decided alongside the contract-only
scoping, both required, not optional extras:
1. **Typed confirmation at contract signing**, not a checkbox — same pattern
   as admin role-escalation (`"ADMIN"` typed to confirm) — the signer types
   the target domain to confirm it's the authorized test target for this
   specific project, not a silent default-checked box.
2. **Template restriction** — Nuclei invoked with tags that exclude
   `dos`/`intrusive` categories (misconfig/exposure/info-disclosure only).
   Cheap, and reduces harm even in a legitimate-but-mistaken scenario (e.g.
   the "client" staging URL turns out to be shared/third-party infra).

This does not eliminate all risk (a colluding fake freelancer+client pair
could still target a third party), but two identity-verified accounts, a
signed contract, and an audit trail is real friction compared to zero-cost
anonymous access — judged sufficient for an MVP launch, revisit if abuse is
observed. Domain-ownership verification (below, formerly scoped to
standalone-qa) is no longer needed for standalone since Nuclei never runs
there; it stays a candidate escalation if contract-scoping alone proves
insufficient once this ships.

**Effort estimate:** M (human ~2-3 days) → CC: ~1 day — Nuclei binary
invocation (same Lambda/Linux-only-binary constraint as
`@sparticuz/chromium`, not testable on this Windows dev machine), new
`qa_security_orders`-style table or an add-on column on `qa_tier_orders`,
typed-confirmation UI step in the signing flow, template-tag allowlist in
the invocation, report rendering.
**Priority:** P2 — decided and scoped, not yet built; queued after
Performance (B) above.
**Depends on / blocked by:** Nothing technical. Should get a `/plan-eng-review`
pass before implementation, same as standalone-qa got on 2026-09-08 — new
external binary + new abuse surface warrants it.

---

## Domain ownership verification for standalone-qa

**What:** DNS TXT record or file-upload proof of domain control (like Google
Search Console) before a scan runs against a given URL.

**Why:** `/plan-eng-review` on 2026-09-08 found `openStagingPage()` had no
host allowlist -- a working SSRF primitive reachable by any free signup once
the contract-relationship friction was removed by standalone-qa. Fixed same
night with a static private/internal IP-range block
(`src/lib/qa/ssrf-guard.ts`), which closes the actual exploitable path today.

**Context:** Originally also floated as the gate for a security-testing
tier — **superseded 2026-09-08**: the cybersecurity/Nuclei tier (above) is
now scoped to contract-bound projects only, where the signed contract itself
is the authorization signal, so standalone-qa never runs an active scanner
and doesn't need domain-ownership proof for that reason. This item now only
covers the residual "prove you're not scanning someone else's site with our
passive/deterministic checks" completeness case (accessibility, performance)
— lower stakes than the original security-scanner motivation.

**Effort estimate:** M (human ~1-2 days) -> CC: ~2-3 hours -- new
verification-token table, DNS/HTTP check endpoint, a UI step before the scan
form unlocks.
**Priority:** P3 -- the IP-range block already closes the SSRF vulnerability;
this is a completeness upgrade for passive checks, not an open exposure, and
no longer blocks the higher-stakes security-scanner use case.
**Depends on / blocked by:** Nothing technical.

---

## Standalone-qa / Tier2 Chromium concurrency contention

**What:** No shared concurrency limit across `src/app/(dashboard)/site-kontrol`'s
standalone scans and `processTier2Order`'s contract-bound agent runs.

**Why:** Both launch a full `@sparticuz/chromium` process from a Vercel
function. A traffic spike in one competes with the other for the same
memory/concurrency budget. Raised by the outside-voice (Claude subagent)
review during `/plan-eng-review` on 2026-09-08 -- the standalone feature's
own per-user daily cap (`STANDALONE_DAILY_LIMIT`) and `maxDuration` bound its
own worst case, but neither feature knows about the other's load.

**Context:** Neither feature has real production volume yet (Tier2 isn't
even `available: true` in `QA_TIER_INFO`) -- this is a real mechanism, not a
theoretical one, but sizing a fix against zero traffic data would be
guessing.

**Effort estimate:** Depends entirely on what real concurrent load looks
like once both features see traffic -- could be a shared semaphore, a queue,
or simply raising Vercel's concurrency limits if the numbers turn out small.
**Priority:** P3 -- revisit once either feature has real usage to size
against.
**Depends on / blocked by:** Real traffic on both standalone-qa and Tier2.

---

## Polar webhook reconciliation sweep

**What:** A daily cron that queries Polar's API for any `qa_tier_orders`
row still `PENDING` past a reasonable window, in case the webhook that should
have marked it `PAID` never arrived.

**Why:** `payment_status` is only ever advanced by the Polar webhook
handler (`src/app/api/webhooks/polar/route.ts`). If that webhook is
lost — a Vercel deploy mid-delivery, a delivery retry exhaustion on Polar's
side — the order stays `PENDING` forever with no path to recovery except a
manual admin fix. This predates the 2026-09-03 Tier1-pricing plan (it
already applied to Tier3/4 under LemonSqueezy) but becomes more visible once
Tier1, the highest-volume tier, also goes through payment.

**Context:** The existing `src/app/api/cron/process-tier2-qa/route.ts` is the
template — same "claim + sweep" shape, different API to poll. Query Polar's
orders endpoint (`polar.orders.list`) filtered by the checkout's metadata
(`qa_tier_order_id`), compare against local `payment_status`, and reconcile.

**Effort estimate:** S (human ~1 day) → CC: ~1-2 hours.
**Priority:** P2 — real but rare.
**Depends on / blocked by:** Nothing; independent of the F-4/F-3/D phasing.

---

## Tier3/4 reviewer payout is Faz 2's marketplace-payout problem, not a separate one

**What:** Automate Tier3/4's reviewer fee collection, currently a manual
admin `markQaOrderPaid()` fallback with no real payment provider behind it.

**Why:** 2026-09-07, migrating Tier1/2 off LemonSqueezy onto Polar (MoR),
Polar's compliance review rejected the account: "your product is primarily a
technical QA/review service rather than an eligible digital product or SaaS
subscription." An honest appeal (explicitly excluding Tier3/4 from the Polar
account, describing only the fully-automated Tier1/2 flow) was also denied —
strong evidence the objection isn't about wording or which MoR, it's
categorical: a Merchant of Record exists to sell Lancerix's *own* automated
digital product, not to collect money that ultimately compensates a human
(the reviewer) for labor. Tier3/4's reviewer fee is that exact shape — no
MoR is likely to accept it, regardless of framing.

This is the same underlying problem Faz 2's PayTR/iyzico marketplace
sub-merchant leg exists to solve (Lancerix routing money to a third party for
work performed), just at a much smaller scale — one reviewer fee instead of
a full project payout. Treating "get Tier3/4 payment automated" as its own
side quest risks solving the same marketplace-payout problem twice: once
small for reviewers, once properly for Faz 2. Whoever picks up Faz 2's
marketplace leg should design it to serve both from day one, or explicitly
decide reviewer payouts stay manual until Faz 2 ships rather than building a
throwaway interim solution.

**Context:** `qa_tier_orders.fee_kurus` / `payment_status` / `provider_reference`
already model this generically enough to serve either a MoR checkout or a
marketplace sub-merchant charge — no schema change needed to unblock this,
only the actual payment rail.

**Effort estimate:** Depends entirely on Faz 2's own scope (company formation
is the real blocker, not code). Until then: no cost, current manual flow
already works.
**Priority:** P3 — revisit only once Faz 2's marketplace leg is actually
being scoped, so this doesn't get designed twice.
**Depends on / blocked by:** Faz 2 (company formation + PayTR/iyzico
marketplace sub-merchant integration).

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
