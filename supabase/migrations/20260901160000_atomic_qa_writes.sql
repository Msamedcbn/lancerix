-- Closes the partial-failure gap in the two multi-step QA write paths.
--
-- chooseQaTier and submitQaReport each did a transition_delivery() RPC call
-- followed by a separate insert in a second network round trip. If the
-- second call failed, the delivery had already moved (AWAITING_CLIENT/
-- QA_QUEUED/QA_DONE) with no qa_tier_orders or qa_reports row to justify it --
-- exactly the kind of desync delivery_events exists to prevent, just one
-- layer up, in application code instead of the database.
--
-- choose_qa_tier() and submit_qa_report() fold each pair into one
-- SECURITY DEFINER function, so the transition and its evidence row commit
-- or roll back together. Both call transition_delivery() internally, which
-- still enforces the legal-edge and can-actor checks against the original
-- caller's auth.uid() -- SECURITY DEFINER nesting does not change what
-- auth.uid() reads.
--
-- submit_qa_report() also incidentally fixes a second bug: the old TS code
-- computed qa_reports.client_review_deadline in Node (Date.now()) and
-- deliveries.client_review_deadline in Postgres (now()) as two independent
-- clocks. Here both come from one v_deadline computed once; now() is frozen
-- for the life of a transaction, so the two rows can never disagree.

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
begin
  if p_tier not in ('TIER1', 'TIER2', 'TIER3', 'TIER4') then
    raise exception 'unknown QA tier %', p_tier using errcode = 'invalid_parameter_value';
  end if;

  v_target := case when p_tier = 'TIER1' then 'AWAITING_CLIENT' else 'QA_QUEUED' end;
  v_payment_status := case when p_tier = 'TIER1' then 'WAIVED' else 'PENDING' end;

  -- Transition first so an illegal edge (wrong current status, wrong actor)
  -- fails before a tier order is ever written, same ordering the old TS code
  -- used deliberately.
  v_delivery := public.transition_delivery(
    p_delivery_id,
    v_target,
    format('%s paketi seçildi', p_tier)
  );

  -- Money is not collected yet: Tier 1 is genuinely free, and Tier 2+'s fee
  -- is invoiced by hand until the payment integration lands. fee_kurus stays
  -- 0 so the ledger never claims a charge that did not happen.
  insert into public.qa_tier_orders (delivery_id, tier, fee_kurus, payment_status, reviewer_id)
  values (p_delivery_id, p_tier, 0, v_payment_status, p_reviewer_id);

  return v_delivery;
end;
$$;

revoke all on function public.choose_qa_tier(uuid, text, uuid) from public;
grant execute on function public.choose_qa_tier(uuid, text, uuid) to authenticated;

create or replace function public.submit_qa_report(
  p_delivery_id uuid,
  p_contract_id uuid,
  p_status text,
  p_findings text,
  p_document_sha256 text
)
returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery public.deliveries;
  v_order_id uuid;
  v_window_days integer;
  v_deadline timestamptz;
begin
  if not public.is_admin() then
    raise exception 'only an admin may submit a QA report'
      using errcode = 'insufficient_privilege';
  end if;

  if p_status not in ('PASS', 'FAIL', 'PARTIAL') then
    raise exception 'unknown QA report status %', p_status using errcode = 'invalid_parameter_value';
  end if;

  select id into v_order_id
  from public.qa_tier_orders
  where delivery_id = p_delivery_id
  order by created_at desc
  limit 1;

  if v_order_id is null then
    raise exception 'no QA tier order for delivery %', p_delivery_id
      using errcode = 'no_data_found';
  end if;

  select objection_window_days into v_window_days
  from public.contracts
  where id = p_contract_id;

  if v_window_days is null then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  v_delivery := public.transition_delivery(
    p_delivery_id, 'QA_DONE', format('QA raporu hazırlandı (%s)', p_status)
  );

  v_deadline := now() + make_interval(days => v_window_days);

  insert into public.qa_reports
    (delivery_id, tier_order_id, status, results, document_sha256, client_review_deadline)
  values (
    p_delivery_id,
    v_order_id,
    p_status,
    jsonb_build_object('summary', p_findings),
    p_document_sha256,
    v_deadline
  );

  v_delivery := public.transition_delivery(
    p_delivery_id, 'AWAITING_CLIENT', 'QA raporu ile müşteri kontrolüne açıldı'
  );

  return v_delivery;
end;
$$;

revoke all on function public.submit_qa_report(uuid, uuid, text, text, text) from public;
grant execute on function public.submit_qa_report(uuid, uuid, text, text, text) to authenticated;
