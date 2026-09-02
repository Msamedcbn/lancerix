-- D (2026-09-03 CEO strategy review): Tier 1/2 get a small symbolic
-- "doğrulama kaydı ücreti" (verification-record fee) instead of 0. Purpose is
-- to test willingness to pay (premise P-3) through the LemonSqueezy checkout
-- that Tier 3/4 already use for reviewer fees -- not to price the record for
-- revenue. Confirmed before setting the number: submit_qa_report() has never
-- checked payment_status for any tier, so this adds a fee and a payment step
-- without newly gating anything that was open before.
--
-- 9900 kurus (99,00 TRY): the top of the pre-approved 49-99₺ range.
-- LemonSqueezy is ~5% + $0.50 flat, plus 1.5% for international cards --
-- roughly 6.5% + $0.50 for a Turkish card. That flat fee erodes a 49₺ charge
-- to roughly half its value; at 99₺ it's a much smaller share of the total.
--
-- Literal instruction was "Tier1/2" -- Tier 2 gets the same fee here even
-- though it stays unorderable at the application layer (QA_TIER_INFO.TIER2
-- .available = false, enforced before this RPC is ever reached). Harmless
-- now; already correct for whenever Tier 2 actually launches.

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
    v_fee_kurus := 9900;
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
