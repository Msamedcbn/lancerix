-- Start-date negotiation was one-way: set_planned_start_date() writes a date
-- exactly once (it refuses when planned_start_date is already set), and
-- confirm_start_date() only ever says yes. A party who cannot make the
-- proposed date had no move inside the product -- the contract sat in
-- "awaiting confirmation" forever, or the two of them settled it off-platform
-- and the record no longer matched reality.
--
-- reject_start_date() closes that: it clears the proposal and both
-- confirmations, so set_planned_start_date()'s "already set" guard opens
-- again and the SetStartDate form comes back. Passing p_counter_date turns
-- the objection into a counter-proposal in one step -- the objecting party's
-- own confirmation is pre-set, since proposing a date is agreeing to it, and
-- the other side is left to confirm.
--
-- Refused once work_started_at is set: at that point both parties already
-- confirmed and a platform_invoices row exists, so the start is a fact, not a
-- plan. Renegotiating a started contract is a different operation than this.

alter table public.contracts
  add column if not exists start_date_note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contracts_start_date_note_length'
  ) then
    alter table public.contracts
      add constraint contracts_start_date_note_length
      check (start_date_note is null or char_length(start_date_note) <= 500);
  end if;
end;
$$;

comment on column public.contracts.start_date_note is
  'Why the last proposed start date was rejected. Set by reject_start_date(), cleared once both parties confirm.';

create or replace function public.reject_start_date(
  p_contract_id uuid,
  p_counter_date date default null,
  p_note text default null
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_uid uuid := auth.uid();
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  -- Authorization goes through is_contract_party() for the same reason
  -- 20260904000001 switched set_planned_start_date() to it: a hand-rolled
  -- uid comparison mishandles the invited-but-unclaimed contract (client_id
  -- is null) against an anonymous caller.
  if not public.is_contract_party(p_contract_id) then
    raise exception 'not a party to contract %', p_contract_id
      using errcode = 'insufficient_privilege';
  end if;

  if v_contract.status <> 'ACTIVE' then
    raise exception 'contract must be ACTIVE to reject a start date'
      using errcode = 'check_violation';
  end if;

  if v_contract.work_started_at is not null then
    raise exception 'work has already started on this contract'
      using errcode = 'check_violation';
  end if;

  if v_contract.planned_start_date is null then
    raise exception 'no start date has been set on this contract'
      using errcode = 'check_violation';
  end if;

  if p_counter_date is not null and p_counter_date = v_contract.planned_start_date then
    raise exception 'the counter-proposal is the same date'
      using errcode = 'check_violation';
  end if;

  update public.contracts
  set planned_start_date = p_counter_date,
      start_date_note = v_note,
      -- A counter-proposal carries the proposer's own agreement; a plain
      -- objection leaves nobody confirmed. Compared with `=` on purpose:
      -- NULL uid against a NULL client_id must not match (see the migration
      -- header of 20260904000001).
      freelancer_start_confirmed =
        (p_counter_date is not null and v_contract.freelancer_id = v_uid),
      client_start_confirmed =
        (p_counter_date is not null and v_contract.client_id = v_uid)
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

revoke all on function public.reject_start_date(uuid, date, text) from public;
grant execute on function public.reject_start_date(uuid, date, text) to authenticated;

-- Once both sides agree, the objection that produced the current date is
-- history -- clear it in the same statement that stamps work_started_at so
-- the note can never outlive the disagreement.
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

  select * into v_contract from public.contracts where id = p_contract_id;

  if v_contract.freelancer_start_confirmed and v_contract.client_start_confirmed
     and v_contract.work_started_at is null then
    update public.contracts
    set work_started_at = now(),
        start_date_note = null
    where id = p_contract_id
    returning * into v_contract;

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
