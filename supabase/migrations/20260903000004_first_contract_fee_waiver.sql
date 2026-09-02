-- Faz E item #4 (2026-09-03 CEO strategy review, accepted expansion): waive
-- the Tier 1/2 verification-record fee (D, 20260903000003) the first time a
-- freelancer ever selects a paid tier, across any of their contracts.
--
-- Purpose: D's fee is new, and asking a freelancer to explain a fee that
-- didn't exist yesterday to their very first client is exactly the kind of
-- friction that kills adoption before the pricing experiment gets any data
-- at all. "First" is scoped to the freelancer (not the client or the
-- contract) because the friction this removes is the freelancer's own
-- hesitation about introducing a paid concept, not a per-client discount.
--
-- Deliberately a live query against contracts.qa_fee_kurus at selection
-- time, not a new column -- "has this freelancer ever paid before" is
-- already fully answerable from data that exists, and a flag would be one
-- more thing that could drift out of sync with it.

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
  v_fee_kurus bigint;
  v_is_first_paid_tier boolean;
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

  if p_tier in ('TIER1', 'TIER2') then
    select not exists (
      select 1 from public.contracts c2
      where c2.freelancer_id = v_contract.freelancer_id
        and c2.id <> p_contract_id
        and coalesce(c2.qa_fee_kurus, 0) > 0
    ) into v_is_first_paid_tier;

    v_fee_kurus := case when v_is_first_paid_tier then 0 else 9900 end;
  elsif p_tier in ('TIER3', 'TIER4') then
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
