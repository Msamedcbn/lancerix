-- Hotfix for 20260904000000, caught in review before this ever shipped to
-- the UI. The party check used:
--
--   if v_contract.freelancer_id is distinct from v_uid
--      and v_contract.client_id is distinct from v_uid then raise ...
--
-- IS DISTINCT FROM treats two NULLs as "not distinct" (false), unlike `=`
-- which returns NULL on either side. For an anonymous caller (auth.uid() is
-- null) on an invited-but-unclaimed contract (client_id is null -- a real
-- state since F-3, 20260903000000), the client_id branch evaluated to
-- false, so the AND short-circuited to false and the exception never
-- fired: an anonymous caller matched an empty client seat.
--
-- Fixed by dropping the duplicated logic entirely and reusing
-- is_contract_party(), the same helper contracts_select_party's RLS policy
-- uses (20260903000002) -- it compares with plain `=`, which is NULL-safe
-- in the correct direction (NULL = NULL is NULL/falsy, not a match), and it
-- already covers the invited-by-email-not-yet-claimed case correctly.

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
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  if not public.is_contract_party(p_contract_id) then
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
