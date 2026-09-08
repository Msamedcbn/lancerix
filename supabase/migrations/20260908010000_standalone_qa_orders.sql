-- Contract-free verification: anyone signed in (freelancer, client, or a
-- brand-new user with no project on the platform at all) can pay to check a
-- raw URL against a universal, objective standard -- no acceptance_criteria,
-- no counterparty, no delivery/contract chain required.
--
-- This is deliberately NOT built on qa_tier_orders/qa_reports. Those tables
-- (and choose_qa_tier/auto_escalate_qa_tier/submit_qa_report) are anchored on
-- delivery_id -> contract_id all the way down, and every existing RLS policy
-- and SECURITY DEFINER function assumes that chain exists. Retrofitting
-- nullability onto that spine would touch the machinery the whole existing
-- contract-bound QA flow depends on, for zero shared benefit -- a standalone
-- check shares no acceptance criteria, no contract party, no objection
-- window with the contract flow, only the same Playwright/axe-core engine at
-- the code level. Separate tables keep that blast radius at zero.
--
-- check_type starts with ACCESSIBILITY only: it is the one candidate tier
-- that ships tonight (@axe-core/playwright, deterministic, zero LLM cost).
-- Adding PERFORMANCE later is one more value in this check constraint, same
-- append-only pattern as 20260901060000_add_tier4_manual_tester.sql extending
-- an enum in a later migration rather than rewriting this one.

create table public.standalone_qa_orders (
  id uuid primary key default gen_random_uuid(),
  requested_by_user_id uuid not null references public.profiles(id) on delete cascade,
  target_url text not null check (target_url ~ '^https?://'),
  check_type text not null check (check_type in ('ACCESSIBILITY')),
  fee_kurus bigint not null check (fee_kurus >= 0),
  payment_status text not null default 'PENDING' check
    (payment_status in ('PENDING', 'PAID', 'FAILED')),
  provider_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index standalone_qa_orders_requested_by_idx on public.standalone_qa_orders (requested_by_user_id);

alter table public.standalone_qa_orders enable row level security;

create policy standalone_qa_orders_select on public.standalone_qa_orders
  for select using (requested_by_user_id = auth.uid() or public.is_admin());

create policy standalone_qa_orders_insert on public.standalone_qa_orders
  for insert with check (requested_by_user_id = auth.uid());

-- No update/delete policy for the authenticated role: payment_status only
-- moves via the Polar webhook, which writes through the service-role client
-- and bypasses RLS entirely -- same precedent as qa_tier_orders (Tier 2's
-- agent) and qa_reports (admin-only insert, no update/delete at all).

create table public.standalone_qa_reports (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.standalone_qa_orders(id) on delete cascade,
  status text not null check (status in ('PASS', 'FAIL', 'PARTIAL')),
  results jsonb not null,
  document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  generated_at timestamptz not null default now()
);

create index standalone_qa_reports_order_id_idx on public.standalone_qa_reports (order_id);

alter table public.standalone_qa_reports enable row level security;

create policy standalone_qa_reports_select on public.standalone_qa_reports
  for select using (
    exists (
      select 1 from public.standalone_qa_orders o
      where o.id = order_id and o.requested_by_user_id = auth.uid()
    )
    or public.is_admin()
  );

-- Append-only, same reasoning as qa_reports: a verification report is
-- evidence, not a draft. Only the service-role scan writes one (see
-- src/lib/qa/standalone.ts), which bypasses RLS -- no insert policy for the
-- authenticated role is needed or granted.
create policy standalone_qa_reports_no_update on public.standalone_qa_reports
  for update using (false);

create policy standalone_qa_reports_no_delete on public.standalone_qa_reports
  for delete using (false);
