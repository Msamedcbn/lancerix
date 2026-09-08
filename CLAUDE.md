# Lancerix — Technical Verification Platform for Freelance & Agency Work

Lancerix's core product is an automated + human-reviewed technical
verification engine: given a URL and either a set of contract acceptance
criteria or a plain accessibility check, it runs QA and issues a timestamped
report. Two go-to-market surfaces sell the same engine, and both matter to
how this codebase is read:

1. **Contract-bound QA** — freelancer & client sign a 3-way B2B contract,
   agree objective acceptance criteria, and the tiered QA below verifies
   delivery against them (`src/app/(dashboard)/contracts`).
2. **Standalone verification** (`/site-kontrol`, shipped 2026-09-08,
   `src/lib/qa/standalone.ts`) — any signed-in user, with or without a
   project on the platform, pays a fixed fee to run a check against any
   URL. No contract, no counterparty. Operates on 3 package tiers:
   - **Temel Kontrol (`BASIC`, ₺199)**: Accessibility, SEO & Meta, Dead Links (`POLAR_PRODUCT_BASIC`).
   - **Profesyonel (`PRO`, ₺349)**: Basic + Performance/Core Web Vitals, Visual/Mobile Overflow (`POLAR_PRODUCT_PRO`).
   - **Tam Tarama (`FULL`, ₺449)**: All 7 modules including Form Validation & Interaction Scan (`POLAR_PRODUCT_FULL`).
   - **Polar MoR Resolution & Fallback**: `resolvePolarProductId()` in `src/lib/polar.ts` maps package labels to specific Polar product IDs, falling back to `POLAR_QA_PRODUCT_ID`. `customerIpAddress` is passed for automatic geolocation & multi-currency detection.
   - **Public Audit Reports & Webhook Email**: Shareable public audit route at `/r/[orderId]` with cryptographic SHA-256 seal and `@media print` PDF styling (`src/app/r/[orderId]/page.tsx`). Polar `order.paid` webhook (`src/app/api/webhooks/polar/route.ts`) updates payment status and sends Resend notification emails via `notifyStandaloneCheckPaid()`. (Decision records: `~/.gstack/projects/Msamedcbn-lancerix/ceo-plans/2026-09-08-standalone-qa-polar-packages.md` and `2026-09-08-positioning-verification-first.md`.)
   - **Pay-first (2026-09-08)**: nothing is scanned until payment is
     confirmed. Both purchase paths (`createStandaloneCheck` for a signed-in
     user, `purchaseStandaloneCheck` from the homepage) write a PENDING order
     via `createStandaloneOrder()` and redirect straight to Polar; the scan
     runs from the verified `order.paid` webhook through `after()`
     (`runScanForPaidOrder`), which is why that route carries
     `maxDuration = 300`. The earlier flow ran the whole scan first and only
     gated report *detail* on payment, which handed every free signup real
     headless-Chromium minutes and the verdict before any money. A total scan
     failure after payment writes ERROR rows rather than aborting -- the
     money is already taken, so silence is the worst outcome.
   - **Delivery guarantee (2026-09-08)**: every module in the purchased
     package writes a `standalone_qa_reports` row, including one that could
     not run -- status `ERROR`, distinct from `FAIL` (the site failed the
     check) because it means the check never happened. Failed modules used
     to be filtered out of the insert entirely, shipping a short report that
     looked complete. An ERROR module entitles the customer to a free
     re-scan of just that module (`rescanFailedModules`): no fee, no new
     order, no daily-cap charge, capped at `STANDALONE_MODULE_MAX_ATTEMPTS`
     attempts. Report rows stay append-only, so a retry inserts a new row
     and the customer surfaces read the latest attempt per module
     (`latestReportPerModule`). The public report's headline verdict is the
     worst result across modules that ran, and its SHA-256 seal is derived
     from every module's own seal -- neither is taken from a single row.
   - **Two lines, split on permission (2026-09-08)**: the dividing line is
     not "contract vs. no contract" but "does this module need the target
     owner's permission". Passive, deterministic checks (everything the
     engine runs today) need none -- they are what any visitor's browser
     already does -- so they live in the standalone line. Anything that
     probes (Nuclei, active vulnerability scanning) needs standing, revocable
     authorization and stays out of it. The contract-bound tiers with a human
     reviewer moved off the landing page to `/sozlesmeli-dogrulama`
     (`src/components/public/contract-tiers-view.tsx`) and are billed
     manually on a Turkish processor, never through Polar -- the separation is
     now visible on the site rather than only asserted in an application.
   - **Continuous monitoring subscription** (`src/lib/validations/monitoring.ts`,
     `src/lib/qa/monitoring-run.ts`, `/izleme`): the same engine on a schedule.
     Two plans -- `MONITORING` (3 sites, ₺799/mo) and `AGENCY` (5 sites,
     ₺3.500/mo, white-label + API) -- both weekly, cadence stored per
     subscription so changing it is data, not a deploy.
     **The diff is the product, not the repetition** (`src/lib/qa/diff.ts`): a
     scheduled run emails only when a result changed against the previous
     scan, with noise thresholds so Lighthouse jitter is not "news", and a
     module that ERRORed in either run produces no change rather than a fake
     improvement. `api/cron/run-monitoring-scans` scans a couple of due sites
     per tick (a package run is ~90s; 300s ceiling). **The subscription's
     ACTIVE status is the authorization to keep scanning a URL** -- both
     `dueSiteIds()` and `runMonitoringScan()` refuse anything else, so a
     cancellation stops the scanning.
   - **Regional pricing (2026-09-08)**: TRY / USD / EUR prices are set on the
     Polar product per currency and are NOT converted from each other --
     regional pricing is a willingness-to-pay decision, and pegging to a
     volatile TRY would move the foreign prices monthly. The subscription
     checkout therefore sends no `amount`/`currency` (`createMonitoringCheckout`
     in `src/lib/polar.ts`), unlike the one-off checkouts whose product carries
     no price of its own. Subscription products have no fallback id: falling
     back to `POLAR_QA_PRODUCT_ID` would sell a monthly plan as a single charge.
   - **Continuous Security SaaS & Nuclei Scanner Engine**: Local environment is provisioned with **ProjectDiscovery Nuclei CLI (v3.11.1)** and 2,360+ templates (`nuclei-templates v10.3.5`). The roadmap includes automated recurring vulnerability monitoring (OWASP Top 10, CVEs, misconfigurations, security headers, sensitive file leakage) sold as a MoR-eligible SaaS subscription via Polar.

The freelancer B2B billing/escrow product (Faz 2, below) is the vertical
application of this verification layer to the Turkish freelance-payment
problem specifically — it is not Lancerix's whole identity, and new work
should not be framed as if escrow were the product and verification a
feature of it. Shipping the verification engine first, and selling it
standalone, de-risks the parts of Faz 2 that need company formation and
BDDK/TCMB payment-license clearance: it proves real payment demand today,
and — this is not incidental — it maps far more cleanly onto a Merchant of
Record's "eligible SaaS" category than a bespoke escrow product does. Polar
rejected Lancerix's contract-bound QA account twice (2026-09-07, including
an appeal that explicitly excluded the human-reviewer tiers): "your product
is primarily a technical review service, not an eligible digital product or
SaaS subscription." Treat that as a strong signal for this framing, not
settled proof — the real dividing line Polar is drawing looks less like
"contract-bound vs. standalone" and more like "fully automated, deterministic
check vs. bespoke human-labor review": Tier 3/4 (a person signs off) sits
outside the MoR-eligible path no matter how it's framed, and stays on manual
billing regardless. Site Kontrolü works today because it's the cleanest case
(axe-core, zero LLM judgment) — it hasn't been submitted to Polar yet, so its
own fit is still an unproven assumption, not a confirmed win. (Decision
record: `~/.gstack/projects/Msamedcbn-lancerix/ceo-plans/2026-09-08-positioning-verification-first.md`.)

## Phasing (current: Faz 1)

Faz 1 ships as a **Verification & Reporting SaaS**, not an escrow/payment
business: no fund custody, no e-invoice issuance, no company formation, no
BDDK/TCMB payment-license surface. Flow: freelancer & client sign a contract
with objective technical acceptance criteria → freelancer delivers a staging
URL / PR link → the platform runs QA (tiered below) and issues a timestamped
PDF verification report → payment settles directly between the two parties;
Lancerix supplies only the technical arbitration report. A green QA result
does not auto-release anything — it triggers a 5-day final-review notice to
the client. The standalone `/site-kontrol` product (above) is the same QA
machinery sold without a contract — treat both as Faz 1, not as a separate
product line to special-case.

QA in Faz 1 verifies only the acceptance criteria written into the contract.
Criteria are free-text descriptions the freelancer writes and both parties
sign off on (`src/lib/validations/acceptance-criteria.ts`) — not the fixed
HTTP_STATUS/FORM_SUBMIT/RESPONSIVE_BREAKPOINT/BUTTON_ACTION categories an
earlier pass tried and dropped (every job is unique; those categories don't
fit non-web work). When QA testing is purchased, the platform decides how to
verify each one — the freelancer doesn't need to know the technical method.
This is explicitly not a security audit or an error-free guarantee. The
contract must carry a liability-limitation clause stating Lancerix is an
independent technical auditor of stated criteria, not a software warranty
body.

Tiered QA (`QA_TIER_INFO` in `src/lib/validations/delivery.ts` is the source
of truth for pricing and availability — check there before quoting a number):
**Tier 1** free criteria checklist + standard client approval. **Tier 2**
Agentic QA — Playwright agents would scan the staging link for console
errors, status codes, form flow; priced at 250₺ + API cost but **not
orderable yet**, the worker doesn't exist (`available: false`). **Tier 3**
Agentic + a senior/principal engineer's manual sign-off, tester fee added on
top. **Tier 4** manual-only, no agent, tester sets their own project fee. No
payroll for Tier 3/4 — a per-review roster, admin-managed
(`admin/reviewers`).

Everything below this section — escrow, stopaj, payouts, marketplace gateway
— is the **Faz 2** design once fund custody is in scope. It documents the
target architecture; it is not what Faz 1 builds against. Before writing new
escrow/payout/invoice code, confirm with the user that Faz 2 has actually
started rather than assuming these rules are active now.

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript strict · Tailwind v4 +
shadcn/ui · Supabase (Postgres, RLS, Auth, Storage) · PayTR / iyzico marketplace
sub-merchant API · Parasut / KolayBi e-Archive · vitest.

## Non-negotiable rules

**Money.** Every amount is an integer of kurus (BIGINT). Never a float. Rates are
basis points (1000 = 10.00%). Platform fee is 10% and 10% is the ceiling: a
contract or coupon may only lower it.

The fee is charged to the **client**, on top of the freelancer's contract amount.
It is never withheld from what the freelancer earns. `Gross` is the freelancer's
contract amount and the figure their SMM is issued for.

- `PlatformFee = Gross * feeRate`
- `ClientCharge = Gross + PlatformFee` (what the client funds into escrow)
- `FreelancerNet = Gross - Stopaj` (stopaj is withheld from the full contract
  amount; the platform fee never enters that base)

Derived amounts are computed by subtraction, never by a second percentage, so
`ClientCharge - PlatformFee == Gross` and `Stopaj + FreelancerNet == Gross` both
hold exactly. The addition in `ClientCharge` is the one place a total can grow,
so it is range-checked in both languages.

A milestone must be at least 500,00 TRY (`MIN_MILESTONE_GROSS_KURUS`, mirrored by
a Postgres check): below that the fee rounds toward zero while the payment
provider's per-transaction cost does not.

Rationale and the open question for the accountant:
`docs/designs/pricing-client-pays-model.md`.

`src/lib/escrow/money.ts` and the STORED GENERATED columns in
`supabase/migrations/` must stay bit-identical. Postgres `round()` is
half-away-from-zero; `applyBps()` matches it for non-negative amounts.

**Escrow state machine.** `DRAFT -> AWAITING_PAYMENT -> IN_PROGRESS -> SUBMITTED
-> COMPLETED -> RELEASED`, plus `DISPUTED` / `CANCELLED`. The legal edges live in
two mirrored places: `escrow_status_transitions` (Postgres) and `TRANSITIONS` in
`src/lib/escrow/state-machine.ts`. Change both together.

**Audit.** Milestone status only changes inside `transition_milestone()`, which
writes the `escrow_transactions` ledger row in the same transaction. A trigger
rejects any status change made outside it. The ledger is append-only: no
UPDATE/DELETE policy, plus a blocking trigger.

**Payouts.** Never trigger unless the milestone is `COMPLETED`, that completion
carries a `provider_reference` from a verified webhook, and the amount equals
`freelancer_net_kurus` exactly.

**Security.** RLS on every table, no exceptions. Freelancers see only
`freelancer_id = auth.uid()`; clients only `client_id = auth.uid()`. Dispute
resolution and manual payout release are admin-only. TCKN (11-digit) and VKN
(10-digit) are checksum-validated in both TypeScript and Postgres.

**Types.** Strict TypeScript, no `any`. Zod for every form and API boundary.
Server Actions for mutations, with `revalidatePath`. Secrets come from env vars
only — never hardcoded.

## Layout

```
src/app/(auth)              login, register, magic links
src/app/(dashboard)/freelancer   projects, earnings, invoice history
src/app/(dashboard)/client       payment panel, approvals, B2B invoices
src/app/(dashboard)/admin        dispute resolution, escrow audit log
src/app/api/webhooks/payment     PayTR / iyzico listeners — MUST verify HMAC
src/lib/escrow              state machine, money, balance distribution
src/lib/tax                 stopaj and e-invoice calculation
supabase/migrations         schema, RLS policies, escrow functions
```

## Environment

Docker is not used on this machine. Verify schema changes against a hosted
Supabase project (`supabase db push` or a branch database), never
`supabase start` / `supabase db reset`.

Run `npm run test` (vitest), `npm run typecheck`, and `npm run lint` before
considering a change done. `npm run build` needs the three `NEXT_PUBLIC_*` vars.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
