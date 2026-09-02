-- Pulls the automatic platform-commission invoice back out of Faz 1.
--
-- 20260901200000 changed confirm_start_date() to auto-file the WORK_START
-- invoice at project_amount_kurus * platform_fee_bps. That's a real
-- commission charged to the client, which needs Lancerix to be able to
-- invoice for it -- exactly the "freelancer adına faturalandırma" capability
-- CLAUDE.md scopes to Faz 2, not something to activate ahead of it. Faz 1
-- revenue is QA tier fees only (qa_tier_orders, LemonSqueezy).
--
-- project_amount_kurus itself stays: it's still useful contract data and
-- Faz 2 will need it. This only reverts confirm_start_date() to filing the
-- WORK_START row at 0, same as before 20260901200000, for an admin to price
-- by hand if it is ever pursued -- it is not billed automatically.

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

    insert into public.platform_invoices (contract_id, client_id, invoice_type, amount_kurus, description)
    values (
      p_contract_id,
      v_contract.client_id,
      'WORK_START',
      0, -- Faz 1: not priced or billed automatically. See setInvoiceAmount().
      'İş başlangıcı platform hizmet bedeli — ' || v_contract.title
    );
  end if;

  return v_contract;
end;
$$;
