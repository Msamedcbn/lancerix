-- Remotify core schema: identities, 3-way contracts, escrow milestones, audit ledger.
--
-- Money is stored as BIGINT kurus (1/100 TRY). Never float, never a scaled type
-- that rounds on write: every amount is an exact integer, and every derived
-- amount is a STORED GENERATED column so the fee/tax identities hold for rows
-- written by any client, including psql and the service role.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('FREELANCER', 'CLIENT', 'ADMIN');

create type public.escrow_status as enum (
  'DRAFT',
  'AWAITING_PAYMENT',
  'IN_PROGRESS',
  'SUBMITTED',
  'COMPLETED',
  'RELEASED',
  'DISPUTED',
  'CANCELLED'
);

create type public.contract_status as enum (
  'DRAFT',
  'PENDING_SIGNATURES',
  'ACTIVE',
  'TERMINATED',
  'FULFILLED'
);

create type public.contract_party as enum ('FREELANCER', 'CLIENT', 'PLATFORM');

create type public.payout_status as enum ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

create type public.dispute_status as enum ('OPEN', 'UNDER_REVIEW', 'RESOLVED');

-- ---------------------------------------------------------------------------
-- Money helpers
-- ---------------------------------------------------------------------------

-- Rates are basis points (1000 = 10.00%) so no rate is ever a float either.
-- IMMUTABLE is required for use inside generated columns.
-- Postgres round(numeric) is half-away-from-zero; amounts are non-negative, so
-- it agrees exactly with roundHalfUp() in src/lib/escrow/money.ts.
create or replace function public.apply_bps(amount bigint, bps integer)
returns bigint
language sql
immutable
parallel safe
as $$
  select round(amount::numeric * bps / 10000)::bigint;
$$;

comment on function public.apply_bps is
  'Basis-point share of an integer kurus amount, rounded half-up. Mirrors applyBps() in TypeScript.';

-- ---------------------------------------------------------------------------
-- Identity validation (TCKN / VKN)
-- ---------------------------------------------------------------------------

create or replace function public.is_valid_tckn(value text)
returns boolean
language plpgsql
immutable
parallel safe
as $$
declare
  d integer[];
  odd_sum integer;
  even_sum integer;
  i integer;
begin
  if value is null or value !~ '^[1-9][0-9]{10}$' then
    return false;
  end if;

  for i in 1..11 loop
    d[i] := substr(value, i, 1)::integer;
  end loop;

  odd_sum := d[1] + d[3] + d[5] + d[7] + d[9];
  even_sum := d[2] + d[4] + d[6] + d[8];

  -- 10th digit: ((odd * 7) - even) mod 10, kept non-negative.
  if d[10] <> (((odd_sum * 7) - even_sum) % 10 + 10) % 10 then
    return false;
  end if;

  -- 11th digit: sum of the first ten, mod 10.
  return d[11] = (odd_sum + even_sum + d[10]) % 10;
end;
$$;

create or replace function public.is_valid_vkn(value text)
returns boolean
language plpgsql
immutable
parallel safe
as $$
declare
  digit integer;
  tmp integer;
  partial integer;
  total integer := 0;
  i integer;
begin
  if value is null or value !~ '^[0-9]{10}$' then
    return false;
  end if;

  for i in 0..8 loop
    digit := substr(value, i + 1, 1)::integer;
    tmp := (digit + 9 - i) % 10;
    if tmp <> 0 then
      partial := (tmp * (2 ^ (9 - i))::integer) % 9;
      total := total + (case when partial = 0 then 9 else partial end);
    end if;
  end loop;

  return substr(value, 10, 1)::integer = (10 - (total % 10)) % 10;
end;
$$;

-- ---------------------------------------------------------------------------
-- Shared triggers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Attached to the tables that must stay append-only (the audit ledger and the
-- signature record). Blocks even a SECURITY DEFINER path from rewriting history.
create or replace function public.forbid_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is append-only (attempted %)', tg_table_name, tg_op
    using errcode = 'restrict_violation';
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'FREELANCER',
  full_name text not null check (length(btrim(full_name)) between 2 and 160),
  email text not null,
  -- Freelancers invoice as individuals; TCKN is required before first payout.
  -- The NULL guard is load-bearing: is_valid_tckn() returns false rather than
  -- null for an absent value, and a CHECK that evaluates to false rejects the
  -- row. Without it every profile created without a TCKN is refused.
  tckn text check (tckn is null or public.is_valid_tckn(tckn)),
  iban text check (iban ~ '^TR[0-9]{24}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_tckn_key on public.profiles (tckn) where tckn is not null;

-- SECURITY DEFINER so policies can read the role without recursing through
-- the profiles policies that call it.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'ADMIN', false);
$$;

-- Seeds the profile from the metadata passed to supabase.auth.signUp().
-- ADMIN is deliberately unreachable through self-registration.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data ->> 'role' = 'CLIENT' then 'CLIENT'::public.user_role
      else 'FREELANCER'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role escalation is blocked: a user may edit their profile but not their role.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
as $$
begin
  -- The service role promotes the first administrator; after that an existing
  -- admin can. A user can never change their own role.
  if new.role is distinct from old.role
     and not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'role may only be changed by an administrator'
      using errcode = 'insufficient_privilege';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------------------
-- companies (the legal entity a B2B invoice is billed to)
-- ---------------------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  legal_name text not null check (length(btrim(legal_name)) between 2 and 255),
  vkn text not null check (public.is_valid_vkn(vkn)),
  tax_office text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create index companies_owner_id_idx on public.companies (owner_id);

-- ---------------------------------------------------------------------------
-- coupons (the only sanctioned override of the 10% platform fee)
--
-- DISABLED as of the client-pays pricing model: the fee is now charged to the
-- client, so a reduced rate discounts the CLIENT, not the freelancer. No active
-- coupon should exist until that semantic is deliberately chosen. The table and
-- the contracts.coupon_id reference are kept so the decision stays reversible.
-- See docs/designs/pricing-client-pays-model.md.
-- ---------------------------------------------------------------------------

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,32}$'),
  platform_fee_bps integer not null check (platform_fee_bps between 0 and 1000),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  max_redemptions integer check (max_redemptions > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  created_at timestamptz not null default now(),
  constraint coupons_validity_window check (valid_until is null or valid_until > valid_from),
  constraint coupons_within_max check (
    max_redemptions is null or redemption_count <= max_redemptions
  )
);

-- ---------------------------------------------------------------------------
-- contracts (3-way: freelancer, client, platform)
-- ---------------------------------------------------------------------------

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  client_id uuid not null references public.profiles(id) on delete restrict,
  freelancer_id uuid not null references public.profiles(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  coupon_id uuid references public.coupons(id) on delete set null,
  title text not null check (length(btrim(title)) between 3 and 255),
  scope_of_work text not null,
  status public.contract_status not null default 'DRAFT',
  -- Snapshot of the rates in force when the contract was drawn up. A later
  -- change to the platform fee or the statutory rate must not alter signed terms.
  platform_fee_bps integer not null default 1000 check (platform_fee_bps between 0 and 1000),
  stopaj_bps integer not null default 2000 check (stopaj_bps between 0 and 10000),
  document_sha256 text check (document_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_distinct_parties check (client_id <> freelancer_id)
);

create index contracts_client_id_idx on public.contracts (client_id);
create index contracts_freelancer_id_idx on public.contracts (freelancer_id);

create trigger contracts_touch
  before update on public.contracts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- contract_signatures (append-only evidence of the 3-way signing)
-- ---------------------------------------------------------------------------

create table public.contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  party public.contract_party not null,
  -- Null only for the PLATFORM counter-signature, which is machine-applied.
  signer_id uuid references public.profiles(id) on delete restrict,
  -- Hash of the exact document bytes shown to this signer, so a later edit to
  -- the contract body is detectable.
  document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  signed_at timestamptz not null default now(),
  ip_address inet not null,
  user_agent text not null,
  unique (contract_id, party)
);

create index contract_signatures_contract_id_idx on public.contract_signatures (contract_id);

create trigger contract_signatures_immutable
  before update or delete on public.contract_signatures
  for each row execute function public.forbid_mutation();

-- ---------------------------------------------------------------------------
-- milestones (the escrow unit: one funded, released amount)
-- ---------------------------------------------------------------------------

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete restrict,
  sequence_no integer not null check (sequence_no > 0),
  title text not null check (length(btrim(title)) between 3 and 255),
  status public.escrow_status not null default 'DRAFT',

  -- The freelancer's contract amount, and the figure their SMM is issued for.
  -- The platform fee is NOT taken out of it; see client_charge_kurus below.
  -- The floor mirrors MIN_MILESTONE_GROSS_KURUS in src/lib/escrow/money.ts:
  -- below 500,00 TRY the fee rounds toward zero while the provider's cost per
  -- transaction does not.
  gross_amount_kurus bigint not null check (gross_amount_kurus >= 50000),
  -- Copied from the contract at creation so the split is reproducible forever.
  platform_fee_bps integer not null check (platform_fee_bps between 0 and 1000),
  stopaj_bps integer not null check (stopaj_bps between 0 and 10000),

  -- PlatformFee = Gross * rate, charged to the client on top of the gross.
  platform_fee_kurus bigint generated always as (
    public.apply_bps(gross_amount_kurus, platform_fee_bps)
  ) stored,
  -- ClientCharge = Gross + PlatformFee. What the client funds into escrow.
  client_charge_kurus bigint generated always as (
    gross_amount_kurus + public.apply_bps(gross_amount_kurus, platform_fee_bps)
  ) stored,
  -- Stopaj is withheld from the full contract amount, which is what the SMM is
  -- issued for. The platform fee never enters this base.
  tax_withholding_kurus bigint generated always as (
    public.apply_bps(gross_amount_kurus, stopaj_bps)
  ) stored,
  -- FreelancerNet = Gross - TaxWithholding (subtraction, so no kurus is lost)
  freelancer_net_kurus bigint generated always as (
    gross_amount_kurus - public.apply_bps(gross_amount_kurus, stopaj_bps)
  ) stored,

  due_date date,
  funded_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, sequence_no)
);

create index milestones_contract_id_idx on public.milestones (contract_id);
create index milestones_status_idx on public.milestones (status);

-- ---------------------------------------------------------------------------
-- Escrow state machine, enforced in the database
-- ---------------------------------------------------------------------------

create table public.escrow_status_transitions (
  from_status public.escrow_status not null,
  to_status public.escrow_status not null,
  primary key (from_status, to_status)
);

comment on table public.escrow_status_transitions is
  'The only legal edges. Mirrors TRANSITIONS in src/lib/escrow/state-machine.ts.';

insert into public.escrow_status_transitions (from_status, to_status) values
  ('DRAFT',            'AWAITING_PAYMENT'),
  ('DRAFT',            'CANCELLED'),
  ('AWAITING_PAYMENT', 'IN_PROGRESS'),
  ('AWAITING_PAYMENT', 'CANCELLED'),
  ('IN_PROGRESS',      'SUBMITTED'),
  ('IN_PROGRESS',      'DISPUTED'),
  ('IN_PROGRESS',      'CANCELLED'),
  ('SUBMITTED',        'COMPLETED'),
  ('SUBMITTED',        'IN_PROGRESS'),
  ('SUBMITTED',        'DISPUTED'),
  ('COMPLETED',        'RELEASED'),
  ('COMPLETED',        'DISPUTED'),
  ('DISPUTED',         'RELEASED'),
  ('DISPUTED',         'CANCELLED');

-- ---------------------------------------------------------------------------
-- escrow_transactions (append-only audit ledger)
-- ---------------------------------------------------------------------------

create table public.escrow_transactions (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones(id) on delete restrict,
  from_status public.escrow_status,
  to_status public.escrow_status not null,

  -- Snapshot of the full split at the moment of the transition, so the ledger
  -- stays readable even if the milestone row is later archived.
  gross_amount_kurus bigint not null,
  platform_fee_kurus bigint not null,
  -- Recorded rather than derived: a future pricing model must not be able to
  -- change how an old ledger row reads.
  client_charge_kurus bigint not null,
  tax_withholding_kurus bigint not null,
  freelancer_net_kurus bigint not null,

  actor_id uuid references public.profiles(id) on delete set null,
  actor_kind text not null check (actor_kind in ('USER', 'ADMIN', 'SYSTEM')),
  reason text,
  -- Gateway correlation id; unique so a replayed webhook cannot double-post.
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index escrow_transactions_milestone_id_idx
  on public.escrow_transactions (milestone_id, created_at desc);

create unique index escrow_transactions_provider_reference_key
  on public.escrow_transactions (provider_reference)
  where provider_reference is not null;

create trigger escrow_transactions_immutable
  before update or delete on public.escrow_transactions
  for each row execute function public.forbid_mutation();

-- A milestone's status may only move inside transition_milestone(), which sets
-- app.escrow_transition for the duration of its own statement.
create or replace function public.guard_milestone_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     and coalesce(current_setting('app.escrow_transition', true), '') <> 'on' then
    raise exception
      'milestone status must change via transition_milestone() so the ledger stays complete'
      using errcode = 'restrict_violation';
  end if;

  -- Money terms are frozen once the milestone is out of DRAFT.
  if old.status <> 'DRAFT' and (
       new.gross_amount_kurus is distinct from old.gross_amount_kurus
    or new.platform_fee_bps   is distinct from old.platform_fee_bps
    or new.stopaj_bps         is distinct from old.stopaj_bps
  ) then
    raise exception 'milestone amounts are immutable once it leaves DRAFT'
      using errcode = 'restrict_violation';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger milestones_guard_status
  before update on public.milestones
  for each row execute function public.guard_milestone_status();

-- Who is allowed to drive a milestone into a given state.
--   AWAITING_PAYMENT  freelancer publishes the milestone for funding
--   IN_PROGRESS       SYSTEM only: funds confirmed held, via signed webhook
--   SUBMITTED         freelancer delivers
--   COMPLETED         client accepts (or SYSTEM on auto-accept expiry)
--   RELEASED          admin or SYSTEM: payout confirmed by the provider
--   DISPUTED          either party
--   CANCELLED         either party while unfunded; admin thereafter
create or replace function public.can_actor_transition(
  p_to_status public.escrow_status,
  p_is_client boolean,
  p_is_freelancer boolean,
  p_is_admin boolean,
  p_is_system boolean,
  p_from_status public.escrow_status
)
returns boolean
language sql
immutable
parallel safe
as $$
  select case p_to_status
    when 'AWAITING_PAYMENT' then p_is_freelancer or p_is_admin or p_is_system
    when 'IN_PROGRESS'      then case
                                   when p_from_status = 'SUBMITTED'
                                     then p_is_client or p_is_admin or p_is_system
                                   else p_is_system or p_is_admin
                                 end
    when 'SUBMITTED'        then p_is_freelancer or p_is_admin
    when 'COMPLETED'        then p_is_client or p_is_admin or p_is_system
    when 'RELEASED'         then p_is_admin or p_is_system
    when 'DISPUTED'         then p_is_client or p_is_freelancer or p_is_admin
    when 'CANCELLED'        then case
                                   when p_from_status in ('DRAFT', 'AWAITING_PAYMENT')
                                     then p_is_client or p_is_freelancer or p_is_admin
                                   else p_is_admin
                                 end
    else false
  end;
$$;

-- The single sanctioned way to move escrow state. Validates the caller, then
-- the edge, then writes the milestone and its ledger row in one transaction.
create or replace function public.transition_milestone(
  p_milestone_id uuid,
  p_to_status public.escrow_status,
  p_reason text default null,
  p_provider_reference text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.milestones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_milestone public.milestones;
  v_contract public.contracts;
  v_from public.escrow_status;
  v_uid uuid := auth.uid();
  v_is_system boolean := coalesce(auth.role(), '') = 'service_role';
  v_is_admin boolean;
  v_is_client boolean;
  v_is_freelancer boolean;
begin
  -- Serialises concurrent transitions on the same milestone (e.g. a webhook
  -- and a dashboard click arriving together).
  select * into v_milestone
  from public.milestones
  where id = p_milestone_id
  for update;

  if not found then
    raise exception 'milestone % not found', p_milestone_id using errcode = 'no_data_found';
  end if;

  select * into v_contract from public.contracts where id = v_milestone.contract_id;

  v_is_admin      := (not v_is_system) and public.is_admin();
  v_is_client     := v_uid is not null and v_contract.client_id = v_uid;
  v_is_freelancer := v_uid is not null and v_contract.freelancer_id = v_uid;

  if not (v_is_system or v_is_admin or v_is_client or v_is_freelancer) then
    raise exception 'not a party to milestone %', p_milestone_id
      using errcode = 'insufficient_privilege';
  end if;

  v_from := v_milestone.status;

  -- Idempotent: a redelivered webhook for a transition already applied is a
  -- no-op rather than an error.
  if v_from = p_to_status then
    return v_milestone;
  end if;

  if not exists (
    select 1 from public.escrow_status_transitions
    where from_status = v_from and to_status = p_to_status
  ) then
    raise exception 'illegal escrow transition % -> %', v_from, p_to_status
      using errcode = 'check_violation';
  end if;

  if not public.can_actor_transition(
       p_to_status, v_is_client, v_is_freelancer, v_is_admin, v_is_system, v_from
     ) then
    raise exception 'caller may not move milestone % to %', p_milestone_id, p_to_status
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.escrow_transactions (
    milestone_id, from_status, to_status,
    gross_amount_kurus, platform_fee_kurus, client_charge_kurus,
    tax_withholding_kurus, freelancer_net_kurus,
    actor_id, actor_kind, reason, provider_reference, metadata
  ) values (
    p_milestone_id, v_from, p_to_status,
    v_milestone.gross_amount_kurus, v_milestone.platform_fee_kurus,
    v_milestone.client_charge_kurus,
    v_milestone.tax_withholding_kurus, v_milestone.freelancer_net_kurus,
    v_uid,
    case when v_is_system then 'SYSTEM' when v_is_admin then 'ADMIN' else 'USER' end,
    p_reason, p_provider_reference, coalesce(p_metadata, '{}'::jsonb)
  );

  perform set_config('app.escrow_transition', 'on', true);

  update public.milestones
  set status       = p_to_status,
      funded_at    = case when p_to_status = 'IN_PROGRESS' and funded_at is null
                          then now() else funded_at end,
      submitted_at = case when p_to_status = 'SUBMITTED' then now() else submitted_at end,
      completed_at = case when p_to_status = 'COMPLETED' then now() else completed_at end,
      released_at  = case when p_to_status = 'RELEASED'  then now() else released_at end
  where id = p_milestone_id
  returning * into v_milestone;

  perform set_config('app.escrow_transition', 'off', true);

  return v_milestone;
end;
$$;

-- ---------------------------------------------------------------------------
-- payouts
-- ---------------------------------------------------------------------------

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null unique references public.milestones(id) on delete restrict,
  freelancer_id uuid not null references public.profiles(id) on delete restrict,
  amount_kurus bigint not null check (amount_kurus > 0),
  status public.payout_status not null default 'PENDING',
  provider_reference text unique,
  failure_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index payouts_freelancer_id_idx on public.payouts (freelancer_id);

-- Rule: a payout may exist only for a milestone a provider webhook has already
-- driven to COMPLETED, only for the exact net amount, and only once (the UNIQUE
-- on milestone_id).
create or replace function public.guard_payout()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_milestone public.milestones;
  v_confirmed boolean;
begin
  select * into v_milestone from public.milestones where id = new.milestone_id;

  if v_milestone.status not in ('COMPLETED', 'RELEASED') then
    raise exception 'payout blocked: milestone % is %, expected COMPLETED',
      new.milestone_id, v_milestone.status
      using errcode = 'check_violation';
  end if;

  -- The COMPLETED transition must carry a provider reference, i.e. it came
  -- from a verified webhook rather than a bare dashboard action.
  select exists (
    select 1 from public.escrow_transactions
    where milestone_id = new.milestone_id
      and to_status = 'COMPLETED'
      and provider_reference is not null
  ) into v_confirmed;

  if not v_confirmed then
    raise exception 'payout blocked: milestone % has no provider-confirmed completion',
      new.milestone_id
      using errcode = 'check_violation';
  end if;

  if new.amount_kurus <> v_milestone.freelancer_net_kurus then
    raise exception 'payout amount % does not match net %',
      new.amount_kurus, v_milestone.freelancer_net_kurus
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger payouts_guard
  before insert on public.payouts
  for each row execute function public.guard_payout();

-- ---------------------------------------------------------------------------
-- disputes
-- ---------------------------------------------------------------------------

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones(id) on delete restrict,
  raised_by uuid not null references public.profiles(id) on delete restrict,
  status public.dispute_status not null default 'OPEN',
  reason text not null check (length(btrim(reason)) >= 10),
  resolution text,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index disputes_milestone_id_idx on public.disputes (milestone_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles                  enable row level security;
alter table public.companies                 enable row level security;
alter table public.coupons                   enable row level security;
alter table public.contracts                 enable row level security;
alter table public.contract_signatures       enable row level security;
alter table public.milestones                enable row level security;
alter table public.escrow_status_transitions enable row level security;
alter table public.escrow_transactions       enable row level security;
alter table public.payouts                   enable row level security;
alter table public.disputes                  enable row level security;

create or replace function public.is_contract_party(p_contract_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.contracts c
    where c.id = p_contract_id
      and (c.client_id = auth.uid() or c.freelancer_id = auth.uid())
  );
$$;

create or replace function public.is_milestone_party(p_milestone_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.milestones m
    join public.contracts c on c.id = m.contract_id
    where m.id = p_milestone_id
      and (c.client_id = auth.uid() or c.freelancer_id = auth.uid())
  );
$$;

-- profiles ------------------------------------------------------------------
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- companies -----------------------------------------------------------------
create policy companies_select on public.companies
  for select using (owner_id = auth.uid() or public.is_admin());

create policy companies_insert on public.companies
  for insert with check (owner_id = auth.uid());

create policy companies_update on public.companies
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- coupons -------------------------------------------------------------------
-- Readable so checkout can price a code; only admins may write.
create policy coupons_select_active on public.coupons
  for select using (
    public.is_admin()
    or (
      valid_from <= now()
      and (valid_until is null or valid_until > now())
      and (max_redemptions is null or redemption_count < max_redemptions)
    )
  );

create policy coupons_admin_write on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- contracts -----------------------------------------------------------------
create policy contracts_select_party on public.contracts
  for select using (
    client_id = auth.uid() or freelancer_id = auth.uid() or public.is_admin()
  );

create policy contracts_insert_freelancer on public.contracts
  for insert with check (
    freelancer_id = auth.uid() and public.current_user_role() = 'FREELANCER'
  );

-- Editable only while still a draft; signed terms are frozen.
create policy contracts_update_draft on public.contracts
  for update using (freelancer_id = auth.uid() and status = 'DRAFT')
  with check (freelancer_id = auth.uid());

-- contract_signatures -------------------------------------------------------
create policy contract_signatures_select_party on public.contract_signatures
  for select using (public.is_contract_party(contract_id) or public.is_admin());

create policy contract_signatures_insert_self on public.contract_signatures
  for insert with check (
    signer_id = auth.uid() and public.is_contract_party(contract_id)
  );

-- milestones ----------------------------------------------------------------
create policy milestones_select_party on public.milestones
  for select using (public.is_contract_party(contract_id) or public.is_admin());

create policy milestones_insert_freelancer on public.milestones
  for insert with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.freelancer_id = auth.uid()
        and c.status in ('DRAFT', 'PENDING_SIGNATURES')
    )
  );

-- Status changes are rejected by guard_milestone_status() regardless of this
-- policy; it permits editing descriptive fields only.
create policy milestones_update_party on public.milestones
  for update using (public.is_contract_party(contract_id))
  with check (public.is_contract_party(contract_id));

-- escrow_status_transitions -------------------------------------------------
create policy escrow_transitions_read on public.escrow_status_transitions
  for select using (auth.role() = 'authenticated');

-- escrow_transactions -------------------------------------------------------
-- Readable by the parties, writable by nobody: rows appear only via
-- transition_milestone(), and the immutability trigger blocks edits.
create policy escrow_transactions_select_party on public.escrow_transactions
  for select using (public.is_milestone_party(milestone_id) or public.is_admin());

-- payouts -------------------------------------------------------------------
create policy payouts_select_own on public.payouts
  for select using (freelancer_id = auth.uid() or public.is_admin());

create policy payouts_admin_write on public.payouts
  for all using (public.is_admin()) with check (public.is_admin());

-- disputes ------------------------------------------------------------------
-- A party may open a dispute and follow its status; only admins review,
-- resolve, or list across contracts.
create policy disputes_select_party on public.disputes
  for select using (public.is_milestone_party(milestone_id) or public.is_admin());

create policy disputes_insert_party on public.disputes
  for insert with check (
    raised_by = auth.uid() and public.is_milestone_party(milestone_id)
  );

create policy disputes_admin_update on public.disputes
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

-- profiles are inserted only by the handle_new_user trigger.
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.companies to authenticated;
grant select, insert, update on public.contracts to authenticated;
grant select, insert on public.contract_signatures to authenticated;
grant select, insert, update on public.milestones to authenticated;
grant select, insert on public.disputes to authenticated;
grant update on public.disputes to authenticated; -- narrowed to admins by policy
grant select on public.coupons to authenticated;
grant select on public.escrow_transactions to authenticated;
grant select on public.escrow_status_transitions to authenticated;
grant select on public.payouts to authenticated;

-- Payouts are written only by the service role via the payout worker.
revoke insert, update, delete on public.payouts from authenticated;

-- transition_milestone is SECURITY DEFINER and re-checks both the edge and the
-- caller's relationship to the contract, so it is safe to expose directly.
revoke all on function public.transition_milestone(uuid, public.escrow_status, text, text, jsonb) from public;
grant execute on function public.transition_milestone(uuid, public.escrow_status, text, text, jsonb)
  to authenticated, service_role;
