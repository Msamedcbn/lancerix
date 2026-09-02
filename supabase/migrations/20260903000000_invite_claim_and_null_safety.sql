-- F-3 (2026-09-03 CEO strategy review): the cold-start invite path was built
-- in 20260901030000, then the application layer moved to public-ID lookup
-- and stopped using it -- but the schema, RLS branch and party-check helper
-- were never removed. What's actually missing is the CLAIM step: nothing
-- ever attaches client_id once the invited email registers or logs in.
--
-- Investigated before writing this (not assumed): git log shows
-- 20260901030000 (which built the invite path) and 20260901070000 (which
-- replaced its lookup mechanism with public IDs) landed in the SAME commit,
-- no revert between them -- this was a simplify-for-MVP call, not a fix for
-- a discovered flaw. Safe to build on as-is.
--
-- Two real problems found while reading the existing code for this, both
-- fixed here:
--
-- 1. NULL-UNSAFE PARTY CHECKS. reject_contract(), request_revision() and
--    set_qa_selection() all gate on `if v_contract.client_id <> auth.uid()`.
--    In SQL, NULL <> anything is NULL, and `if NULL then` is false in
--    PL/pgSQL -- so on a contract with client_id IS NULL (which the schema
--    has allowed since 20260901030000, and which existed as of this
--    migration: one leftover DRAFT row from 2026-08-31), that guard clause
--    silently does not fire. Any authenticated user could currently reject,
--    request revision on, or set the QA package of a contract that has not
--    been claimed yet. Fixed with `is distinct from`, which is NULL-safe.
--
-- 2. UNVERIFIED EMAIL IN THE INVITE MATCH. is_contract_party() and the
--    contracts_select_party policy both match on auth.jwt() ->> 'email'
--    alone. That claim reflects whatever GoTrue put in the JWT, which is
--    only trustworthy as "this person owns this address" if the project's
--    "Confirm email" setting refuses a session to an unconfirmed signup --
--    a hosted dashboard setting this migration cannot see or enforce from
--    the database. Rather than depend on that external, unverifiable
--    setting, both checks now also require auth.users.email_confirmed_at
--    is not null for the caller, so the property holds regardless of how
--    that project setting is configured.

-- ---------------------------------------------------------------------------
-- 1. NULL-safe party checks
-- ---------------------------------------------------------------------------

create or replace function public.reject_contract(
  p_contract_id uuid,
  p_reason text
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_uid uuid := auth.uid();
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  if v_contract.client_id is distinct from v_uid then
    raise exception 'only the client may reject a contract'
      using errcode = 'insufficient_privilege';
  end if;

  if v_contract.status not in ('DRAFT', 'PENDING_SIGNATURES', 'PENDING_REVIEW') then
    raise exception 'contract % cannot be rejected in status %', p_contract_id, v_contract.status
      using errcode = 'check_violation';
  end if;

  update public.contracts
  set status = 'REJECTED',
      rejection_reason = p_reason
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

create or replace function public.request_revision(
  p_contract_id uuid,
  p_note text
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_uid uuid := auth.uid();
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  if v_contract.client_id is distinct from v_uid then
    raise exception 'only the client may request revision'
      using errcode = 'insufficient_privilege';
  end if;

  if v_contract.status not in ('DRAFT', 'PENDING_SIGNATURES', 'PENDING_REVIEW') then
    raise exception 'contract % cannot be revised in status %', p_contract_id, v_contract.status
      using errcode = 'check_violation';
  end if;

  update public.contracts
  set status = 'REVISION_REQUESTED',
      revision_note = p_note
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

create or replace function public.set_qa_selection(
  p_contract_id uuid,
  p_tier text,
  p_reviewer_id uuid default null
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_fee_kurus bigint := 0;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  if v_contract.client_id is distinct from auth.uid() then
    raise exception 'only the client may set the QA selection' using errcode = 'insufficient_privilege';
  end if;

  if exists (select 1 from public.contract_signatures where contract_id = p_contract_id) then
    raise exception 'contract % already has a signature -- the QA selection is locked', p_contract_id
      using errcode = 'check_violation';
  end if;

  if p_tier not in ('TIER1', 'TIER2', 'TIER3', 'TIER4') then
    raise exception 'unknown QA tier %', p_tier using errcode = 'invalid_parameter_value';
  end if;

  if p_tier in ('TIER3', 'TIER4') then
    if p_reviewer_id is null then
      raise exception 'a reviewer is required for %', p_tier using errcode = 'invalid_parameter_value';
    end if;

    select rate_kurus into v_fee_kurus
    from public.qa_reviewers
    where id = p_reviewer_id and active;

    if not found then
      raise exception 'reviewer % not found or inactive', p_reviewer_id using errcode = 'no_data_found';
    end if;
    if v_fee_kurus is null then
      raise exception 'reviewer % has not set a fee yet', p_reviewer_id using errcode = 'check_violation';
    end if;
  end if;

  update public.contracts
  set qa_tier = p_tier,
      qa_reviewer_id = case when p_tier in ('TIER3', 'TIER4') then p_reviewer_id else null end,
      qa_fee_kurus = v_fee_kurus
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Confirmed-email requirement on the invite-match branch
-- ---------------------------------------------------------------------------

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
      and (
        c.client_id = auth.uid()
        or c.freelancer_id = auth.uid()
        or public.is_admin()
        or (
          c.client_id is null
          and lower(c.client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          and coalesce(auth.jwt() ->> 'email', '') <> ''
          and exists (
            select 1 from auth.users u
            where u.id = auth.uid() and u.email_confirmed_at is not null
          )
        )
      )
  );
$$;

drop policy if exists contracts_select_party on public.contracts;

create policy contracts_select_party on public.contracts
  for select using (
    client_id = auth.uid()
    or freelancer_id = auth.uid()
    or public.is_admin()
    or (
      client_id is null
      and lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and coalesce(auth.jwt() ->> 'email', '') <> ''
      and exists (
        select 1 from auth.users u
        where u.id = auth.uid() and u.email_confirmed_at is not null
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3. claim_invited_contract: attach client_id the moment the invited,
--    confirmed address is behind an active session and looks at the
--    contract. One path handles both a brand-new signup and an address
--    that already had a Lancerix account before the invite -- the old
--    (abandoned) design only handled the former, via a block in
--    handle_new_user() that a later migration silently dropped when it
--    rewrote that trigger for public IDs.
-- ---------------------------------------------------------------------------

create or replace function public.claim_invited_contract(p_contract_id uuid)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_uid uuid := auth.uid();
  v_email text;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  -- Already claimed (by this person or anyone else) -- idempotent no-op,
  -- not an error, so callers can call this unconditionally on every load.
  if v_contract.client_id is not null then
    return v_contract;
  end if;

  if v_contract.freelancer_id = v_uid then
    raise exception 'the freelancer cannot claim their own contract as the client'
      using errcode = 'insufficient_privilege';
  end if;

  select email into v_email
  from auth.users
  where id = v_uid and email_confirmed_at is not null;

  if v_email is null or lower(v_email) <> lower(v_contract.client_email) then
    raise exception 'not the invited address for contract %', p_contract_id
      using errcode = 'insufficient_privilege';
  end if;

  update public.contracts
  set client_id = v_uid
  where id = p_contract_id and client_id is null
  returning * into v_contract;

  -- Lost a race to a concurrent claim (should be near-impossible -- one
  -- address, one auth.uid()) -- return the row as it actually ended up.
  if not found then
    select * into v_contract from public.contracts where id = p_contract_id;
  end if;

  return v_contract;
end;
$$;

revoke all on function public.claim_invited_contract(uuid) from public;
grant execute on function public.claim_invited_contract(uuid) to authenticated;

comment on function public.claim_invited_contract is
  'Attaches client_id to an unclaimed (client_id IS NULL) contract once the invited, confirmed address is behind an active session. Idempotent -- safe to call on every contract-page load.';
