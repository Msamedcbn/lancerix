# Remotify — B2B Freelancer Billing & Escrow Platform

Freelancers issue B2B corporate invoices, sign 3-way contracts, hold client funds
in escrow via a marketplace gateway, and receive net payouts after automatic
tax/withholding calculation. Turkish market.

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript strict · Tailwind v4 +
shadcn/ui · Supabase (Postgres, RLS, Auth, Storage) · PayTR / iyzico marketplace
sub-merchant API · Parasut / KolayBi e-Archive · vitest.

## Non-negotiable rules

**Money.** Every amount is an integer of kurus (BIGINT). Never a float. Rates are
basis points (1500 = 15.00%). Platform fee is 15% unless an active coupon lowers
it. Derived amounts are computed by subtraction, never by a second percentage, so
`fee + freelancerGross == gross` holds exactly.

- `PlatformFee = Gross * feeRate`
- `FreelancerGross = Gross - PlatformFee`
- `FreelancerNet = FreelancerGross - Stopaj` (stopaj is withheld from the
  freelancer's gross, never from the project gross)

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
