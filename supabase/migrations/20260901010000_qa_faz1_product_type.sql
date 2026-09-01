-- Faz 1a: the product-type choice from contract creation onward, and the
-- data model for a QA-only contract that never touches escrow money.
--
-- product_type is chosen once, at contract creation, and decides which shape
-- the rest of the contract takes: QA_ONLY skips milestones entirely (they are
-- inherently money-shaped -- gross_amount_kurus is NOT NULL with a >=500 TRY
-- floor) and attaches acceptance_criteria straight to the contract instead.
-- QA_PLUS_ESCROW keeps the existing milestone flow; it is selectable in the
-- UI from Faz 1 but its downstream steps stay disabled until Faz 2, so this
-- column exists now rather than being bolted on later.

alter table public.contracts
  add column product_type text not null default 'QA_ONLY'
    check (product_type in ('QA_ONLY', 'QA_PLUS_ESCROW'));

-- ---------------------------------------------------------------------------
-- acceptance_criteria (the objective, testable terms QA checks against)
-- ---------------------------------------------------------------------------

create table public.acceptance_criteria (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  -- Null for a QA_ONLY contract, which has no milestones at all.
  milestone_id uuid references public.milestones(id) on delete cascade,
  sequence_no integer not null check (sequence_no > 0),
  description text not null check (length(btrim(description)) between 5 and 500),
  check_type text not null check (check_type in
    ('HTTP_STATUS', 'FORM_SUBMIT', 'RESPONSIVE_BREAKPOINT', 'BUTTON_ACTION', 'MANUAL')),
  check_config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (contract_id, sequence_no)
);

create index acceptance_criteria_contract_id_idx on public.acceptance_criteria (contract_id);

alter table public.acceptance_criteria enable row level security;

create policy acceptance_criteria_select on public.acceptance_criteria
  for select using (public.is_contract_party(contract_id) or public.is_admin());

create policy acceptance_criteria_insert on public.acceptance_criteria
  for insert with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.freelancer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- deliveries (what a freelancer submits for QA to check against)
-- ---------------------------------------------------------------------------

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  milestone_id uuid references public.milestones(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  staging_url text not null check (staging_url ~ '^https?://'),
  pr_url text check (pr_url is null or pr_url ~ '^https?://'),
  notes text,
  submitted_at timestamptz not null default now()
);

create index deliveries_contract_id_idx on public.deliveries (contract_id);

alter table public.deliveries enable row level security;

create policy deliveries_select on public.deliveries
  for select using (public.is_contract_party(contract_id) or public.is_admin());

create policy deliveries_insert on public.deliveries
  for insert with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.freelancer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- qa_reviewers (the Tier 3 senior-engineer roster a client picks from)
-- ---------------------------------------------------------------------------

create table public.qa_reviewers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  level text not null check (level in ('PRINCIPAL', 'SENIOR')),
  years_experience integer not null check (years_experience > 0),
  specialties text[] not null default '{}',
  bio text,
  avatar_storage_path text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.qa_reviewers enable row level security;

-- The roster is what a client picks a card from, so every authenticated user
-- may read the active ones. Nothing sensitive is on this row -- no TCKN, no
-- IBAN, no email; those stay behind profiles' own RLS.
create policy qa_reviewers_select on public.qa_reviewers
  for select using (active or public.is_admin());

-- ---------------------------------------------------------------------------
-- qa_tier_orders (which tier, who is paying, who is reviewing)
-- ---------------------------------------------------------------------------

create table public.qa_tier_orders (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  tier text not null check (tier in ('TIER1', 'TIER2', 'TIER3')),
  fee_kurus bigint not null default 0 check (fee_kurus >= 0),
  payment_status text not null default 'PENDING' check
    (payment_status in ('PENDING', 'PAID', 'FAILED', 'WAIVED')),
  provider_reference text,
  reviewer_id uuid references public.qa_reviewers(id) on delete set null,
  created_at timestamptz not null default now()
);

create index qa_tier_orders_delivery_id_idx on public.qa_tier_orders (delivery_id);

alter table public.qa_tier_orders enable row level security;

create policy qa_tier_orders_select on public.qa_tier_orders
  for select using (
    exists (
      select 1 from public.deliveries d
      where d.id = delivery_id and public.is_contract_party(d.contract_id)
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- qa_reports (the timestamped verification result)
-- ---------------------------------------------------------------------------

create table public.qa_reports (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  tier_order_id uuid not null references public.qa_tier_orders(id) on delete restrict,
  status text not null check (status in ('PASS', 'FAIL', 'PARTIAL')),
  results jsonb not null,
  pdf_storage_path text,
  document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  client_review_deadline timestamptz not null,
  generated_at timestamptz not null default now()
);

create index qa_reports_delivery_id_idx on public.qa_reports (delivery_id);

alter table public.qa_reports enable row level security;

create policy qa_reports_select on public.qa_reports
  for select using (
    exists (
      select 1 from public.deliveries d
      where d.id = delivery_id and public.is_contract_party(d.contract_id)
    )
    or public.is_admin()
  );

-- Append-only, like escrow_transactions: a verification report is evidence,
-- not a draft.
create policy qa_reports_no_update on public.qa_reports
  for update using (false);

create policy qa_reports_no_delete on public.qa_reports
  for delete using (false);
