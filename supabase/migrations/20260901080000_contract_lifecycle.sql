-- Contract lifecycle: reject, request revision, mutual start-date confirmation.
--
-- A contract is no longer just signed-or-not. The client can reject it
-- outright or ask for changes. Work officially starts only when both parties
-- confirm the planned start date.

-- ---------------------------------------------------------------------------
-- New contract statuses
-- ---------------------------------------------------------------------------

-- Add PENDING_REVIEW and REVISION_REQUESTED to the enum.
-- Postgres enums are append-only; we add the new values.
alter type public.contract_status add value if not exists 'PENDING_REVIEW' after 'DRAFT';
alter type public.contract_status add value if not exists 'REVISION_REQUESTED' after 'PENDING_REVIEW';
alter type public.contract_status add value if not exists 'REJECTED' after 'REVISION_REQUESTED';

-- ---------------------------------------------------------------------------
-- New columns on contracts
-- ---------------------------------------------------------------------------

alter table public.contracts
  add column if not exists rejection_reason text,
  add column if not exists revision_note text,
  add column if not exists planned_start_date date,
  add column if not exists freelancer_start_confirmed boolean not null default false,
  add column if not exists client_start_confirmed boolean not null default false,
  add column if not exists work_started_at timestamptz;

-- ---------------------------------------------------------------------------
-- reject_contract: client rejects a contract with a reason
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

  if v_contract.client_id <> v_uid then
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

revoke all on function public.reject_contract(uuid, text) from public;
grant execute on function public.reject_contract(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- request_revision: client asks for changes
-- ---------------------------------------------------------------------------

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

  if v_contract.client_id <> v_uid then
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

revoke all on function public.request_revision(uuid, text) from public;
grant execute on function public.request_revision(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- confirm_start_date: each party confirms the planned start
-- ---------------------------------------------------------------------------

create or replace function public.confirm_start_date(p_contract_id uuid)
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

  if v_contract.status <> 'ACTIVE' then
    raise exception 'contract must be ACTIVE to confirm start date'
      using errcode = 'check_violation';
  end if;

  if v_contract.planned_start_date is null then
    raise exception 'no start date has been set on this contract'
      using errcode = 'check_violation';
  end if;

  if v_contract.freelancer_id = v_uid then
    update public.contracts
    set freelancer_start_confirmed = true
    where id = p_contract_id;
  elsif v_contract.client_id = v_uid then
    update public.contracts
    set client_start_confirmed = true
    where id = p_contract_id;
  else
    raise exception 'not a party to contract %', p_contract_id
      using errcode = 'insufficient_privilege';
  end if;

  -- If both confirmed, mark work as started
  select * into v_contract from public.contracts where id = p_contract_id;

  if v_contract.freelancer_start_confirmed and v_contract.client_start_confirmed
     and v_contract.work_started_at is null then
    update public.contracts
    set work_started_at = now()
    where id = p_contract_id
    returning * into v_contract;

    -- Create the platform service invoice
    insert into public.platform_invoices (contract_id, client_id, invoice_type, amount_kurus, description)
    values (
      p_contract_id,
      v_contract.client_id,
      'WORK_START',
      0, -- placeholder amount, to be configured
      'İş başlangıcı platform hizmet bedeli — ' || v_contract.title
    );
  end if;

  return v_contract;
end;
$$;

revoke all on function public.confirm_start_date(uuid) from public;
grant execute on function public.confirm_start_date(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Update sign_contract to set PENDING_REVIEW instead of ACTIVE when both sign
-- Then ACTIVE happens after start-date confirmation
-- NOTE: Actually, we keep the existing signing flow as-is for now.
-- The sign_contract still sets ACTIVE when both sign.
-- The start-date confirmation is a separate step after ACTIVE.
-- ---------------------------------------------------------------------------
