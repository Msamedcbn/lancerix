-- Hotfix for 20260903000004. Reproduced directly: the waiver check compared
-- other contracts' qa_fee_kurus > 0, but a WAIVED contract has qa_fee_kurus =
-- 0 -- so it never counted as "has selected a paid tier before", and the
-- waiver kept applying to every contract a freelancer ever created. An
-- infinite free-tier loophole, not a one-time waiver.
--
-- Fix: eligibility is about having SELECTED Tier 1/2 before, not about the
-- fee that selection happened to produce. A prior TIER1/TIER2 selection
-- disqualifies regardless of its resulting fee; a prior TIER3/TIER4
-- selection still disqualifies via its (always real, reviewer-set) fee, same
-- as before. Applied identically in set_qa_selection() and
-- freelancer_has_paid_qa_before() (the pre-selection hint's RPC) -- both must
-- agree or the hint would lie about what selecting is about to do.
--
-- Known limitation, accepted rather than engineered around (this is a
-- delight feature, not money-safety infrastructure): eligibility is
-- recomputed fresh on every call, not locked in permanently once granted.
-- A freelancer with two or more simultaneously-open unsigned drafts who
-- revisits an earlier one's QA panel after a later one already has a tier
-- set can shift which draft ends up "free" -- and, in a narrow race where
-- two such calls land concurrently before either commits, could in theory
-- waive both. Neither is reachable through the app's normal one-contract-
-- at-a-time flow; closing it fully would need a persisted "waiver already
-- granted" flag plus cross-contract locking, which is more machinery than
-- a first-contract nicety warrants right now.

create or replace function public.freelancer_has_paid_qa_before(
  p_freelancer_id uuid,
  p_exclude_contract_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.contracts c
    where c.freelancer_id = p_freelancer_id
      and (p_exclude_contract_id is null or c.id <> p_exclude_contract_id)
      and (
        c.qa_tier in ('TIER1', 'TIER2')
        or coalesce(c.qa_fee_kurus, 0) > 0
      )
  );
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
    select not public.freelancer_has_paid_qa_before(v_contract.freelancer_id, p_contract_id)
      into v_is_first_paid_tier;

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
