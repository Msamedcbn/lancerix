-- Bug: planned_start_date is optional at contract creation (freelancer/new's
-- date field is not required), but confirm_start_date() raises if it's null
-- and there was never a UI or RPC path to fill it in afterward. A signed
-- contract left with no planned start date can then never get
-- work_started_at set, which permanently blocks delivery (submitQaDelivery
-- in qa-actions.ts requires status = 'ACTIVE' and work_started_at not null).
--
-- Fix: a one-time backfill RPC, callable by either party once the contract
-- is ACTIVE and only while planned_start_date is still null. After it runs,
-- the existing mutual-confirmation flow (confirm_start_date) takes over
-- exactly as if the date had been set at creation.

create or replace function public.set_planned_start_date(
  p_contract_id uuid,
  p_date date
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

  if v_contract.freelancer_id is distinct from v_uid
     and v_contract.client_id is distinct from v_uid then
    raise exception 'not a party to contract %', p_contract_id
      using errcode = 'insufficient_privilege';
  end if;

  if v_contract.status <> 'ACTIVE' then
    raise exception 'contract must be ACTIVE to set a start date'
      using errcode = 'check_violation';
  end if;

  if v_contract.planned_start_date is not null then
    raise exception 'a start date is already set on this contract'
      using errcode = 'check_violation';
  end if;

  update public.contracts
  set planned_start_date = p_date
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

revoke all on function public.set_planned_start_date(uuid, date) from public;
grant execute on function public.set_planned_start_date(uuid, date) to authenticated;
