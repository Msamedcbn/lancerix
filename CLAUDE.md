# Lancerix — B2B Freelancer Billing & Escrow Platform

Freelancers issue B2B corporate invoices, sign 3-way contracts, hold client funds
in escrow via a marketplace gateway, and receive net payouts after automatic
tax/withholding calculation. Turkish market.

## Phasing (current: Faz 1)

Faz 1 ships as a **Verification & Reporting SaaS**, not an escrow/payment
business: no fund custody, no e-invoice issuance, no company formation, no
BDDK/TCMB payment-license surface. Flow: freelancer & client sign a contract
with objective technical acceptance criteria → freelancer delivers a staging
URL / PR link → the platform runs QA (tiered below) and issues a timestamped
PDF verification report → payment settles directly between the two parties;
Lancerix supplies only the technical arbitration report. A green QA result
does not auto-release anything — it triggers a 5-day final-review notice to
the client.

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
