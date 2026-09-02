-- 20260901200000_contract_amount_and_service_model.sql
--
-- Lancerix earns its fee on the project amount even for QA_ONLY contracts
-- (no escrow), so every contract now carries one. confirm_start_date() is
-- redefined to auto-file the WORK_START platform invoice from that amount
-- once both parties confirm the start date, instead of leaving admin to
-- price it from nothing.

alter table public.contracts
  add column project_amount_kurus bigint not null default 0 check (project_amount_kurus >= 0);

comment on column public.contracts.project_amount_kurus is 'The total agreed project value, used to calculate the platform fee even when escrow is disabled.';

create or replace function public.confirm_start_date(p_contract_id uuid)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_uid uuid := auth.uid();
  v_fee_kurus bigint;
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

    -- Same rounding rule as every other fee in the app: apply_bps(), not a
    -- raw division, so this can never drift from ClientCharge/FreelancerNet.
    v_fee_kurus := public.apply_bps(v_contract.project_amount_kurus, v_contract.platform_fee_bps);

    insert into public.platform_invoices (contract_id, client_id, invoice_type, amount_kurus, description)
    values (
      p_contract_id,
      v_contract.client_id,
      'WORK_START',
      v_fee_kurus,
      'İş başlangıcı platform hizmet bedeli — ' || v_contract.title
    );
  end if;

  return v_contract;
end;
$$;
