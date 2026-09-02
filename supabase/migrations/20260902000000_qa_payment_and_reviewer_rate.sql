-- Wires real money into the QA tier order instead of leaving fee_kurus at 0.
--
-- TIER3/TIER4 need a reviewer, and CLAUDE.md already says the reviewer sets
-- their own fee -- there was just nowhere to store it. rate_kurus is that:
-- the reviewer's stated price, set once by an admin, shown on the roster
-- card before a freelancer picks a tier, so the fee is fixed and known at
-- order time rather than negotiated by hand afterward.
--
-- choose_qa_tier() is redefined to require a rate for TIER3/TIER4 and to
-- capture it into qa_tier_orders.fee_kurus, instead of always writing 0.
-- TIER1/TIER2 are untouched (free / not orderable).

alter table public.qa_reviewers
  add column rate_kurus bigint check (rate_kurus is null or rate_kurus >= 0);

comment on column public.qa_reviewers.rate_kurus is
  'The reviewer''s stated fee for a TIER3/TIER4 review, in kurus. Null until an admin sets one -- choose_qa_tier() refuses to order that reviewer until it is.';

alter table public.qa_tier_orders
  add column paid_at timestamptz;

create or replace function public.choose_qa_tier(
  p_delivery_id uuid,
  p_tier text,
  p_reviewer_id uuid default null
)
returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery public.deliveries;
  v_target public.delivery_status;
  v_payment_status text;
  v_fee_kurus bigint := 0;
begin
  if p_tier not in ('TIER1', 'TIER2', 'TIER3', 'TIER4') then
    raise exception 'unknown QA tier %', p_tier using errcode = 'invalid_parameter_value';
  end if;

  v_target := case when p_tier = 'TIER1' then 'AWAITING_CLIENT' else 'QA_QUEUED' end;

  if p_tier in ('TIER3', 'TIER4') then
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

  v_payment_status := case when v_fee_kurus > 0 then 'PENDING' else 'WAIVED' end;

  -- Transition first so an illegal edge (wrong current status, wrong actor)
  -- fails before a tier order is ever written, same ordering the old TS code
  -- used deliberately.
  v_delivery := public.transition_delivery(
    p_delivery_id,
    v_target,
    format('%s paketi seçildi', p_tier)
  );

  insert into public.qa_tier_orders (delivery_id, tier, fee_kurus, payment_status, reviewer_id)
  values (p_delivery_id, p_tier, v_fee_kurus, v_payment_status, p_reviewer_id);

  return v_delivery;
end;
$$;

revoke all on function public.choose_qa_tier(uuid, text, uuid) from public;
grant execute on function public.choose_qa_tier(uuid, text, uuid) to authenticated;

-- Jobtogo-mediated commission invoices: until Lancerix has its own company,
-- the WORK_START platform fee is invoiced through a freelancer-invoicing
-- intermediary (Jobtogo) instead of Lancerix issuing its own fatura. This is
-- purely a reference an admin fills in by hand when reconciling -- there is
-- no Jobtogo API integration.
alter table public.platform_invoices
  add column jobtogo_reference text;

comment on column public.platform_invoices.jobtogo_reference is
  'The Jobtogo invoice/makbuz reference an admin recorded when reconciling this invoice as paid. Manual -- Jobtogo has no API here.';
