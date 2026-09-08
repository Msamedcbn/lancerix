-- Tier restructure (2026-09-08, user decision): Tier4 removed entirely (zero
-- existing TIER4 rows in production, confirmed before writing this -- no
-- backfill needed). Tier1 becomes permanently free (folded into the 10%
-- platform commission, never touches Polar). Tier2 and Tier3 both become
-- fixed prices instead of variable ones -- Tier3 in particular drops its
-- reviewer-roster selection entirely: no third-party reviewer is paid out of
-- it, the founder reviews every Tier3 order personally for now (via the
-- existing admin submitQaReport flow), so the fixed price is Lancerix's own
-- revenue, not a pass-through fee.
--
-- The first-contract-fee-waiver promo (20260903000004/6) is retired here,
-- not carried forward: it existed specifically to soften the *new* Tier1 fee
-- introduced that day ("yeni ücretin ilk müşteriye sürtünme yaratmaması
-- için" -- STATUS.md). Tier1 has no fee at all now, so that friction is
-- already gone; keeping the promo alive for Tier2 alone would need its own
-- dedicated reasoning nobody has asked for. If Tier2 should keep a
-- first-contract discount, that is a new decision, not a carry-over of this
-- one -- flagged in STATUS.md, easy to reintroduce if wanted.

drop function if exists public.freelancer_has_paid_qa_before(uuid, uuid);

alter table public.contracts
  drop constraint if exists contracts_qa_tier_check;

alter table public.contracts
  add constraint contracts_qa_tier_check
  check (qa_tier in ('TIER1', 'TIER2', 'TIER3'));

alter table public.qa_tier_orders
  drop constraint if exists qa_tier_orders_tier_check;

alter table public.qa_tier_orders
  add constraint qa_tier_orders_tier_check
  check (tier in ('TIER1', 'TIER2', 'TIER3'));

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

  -- p_reviewer_id is accepted but ignored: no tier needs one anymore.
  -- Kept as a parameter (rather than dropping/recreating the function
  -- signature) so any in-flight client call passing it still succeeds.
  v_fee_kurus := case p_tier
    when 'TIER1' then 0
    when 'TIER2' then 29900
    when 'TIER3' then 350000
    else null
  end;

  if v_fee_kurus is null then
    raise exception 'unknown QA tier %', p_tier using errcode = 'invalid_parameter_value';
  end if;

  update public.contracts
  set qa_tier = p_tier,
      qa_reviewer_id = null,
      qa_fee_kurus = v_fee_kurus
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;
