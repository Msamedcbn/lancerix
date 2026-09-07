-- User decision (2026-09-07): agentic QA is a core differentiator, not a
-- side evidence layer -- double down on making it detailed rather than
-- de-emphasizing it. Today's report is a single PASS/FAIL label plus one
-- findings paragraph; the client-facing panel (qa-report-summary.tsx)
-- doesn't even render that paragraph. This adds an optional per-criterion
-- breakdown so a report can say which specific criteria passed/failed, not
-- just an overall verdict.
--
-- Purely additive: p_criteria defaults to null, so the two existing callers
-- (admin's own submitQaReport, the reviewer token path) are untouched --
-- neither produces a structured per-criterion breakdown, only free text.
-- Only src/lib/qa/agent.ts (this session) will ever pass it.

create or replace function public._record_qa_report(
  p_delivery_id uuid,
  p_contract_id uuid,
  p_status text,
  p_findings text,
  p_document_sha256 text,
  p_reviewer_id uuid default null,
  p_criteria jsonb default null
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
  v_results jsonb;
begin
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

  v_results := jsonb_build_object('summary', p_findings);
  if p_criteria is not null then
    v_results := v_results || jsonb_build_object('criteria', p_criteria);
  end if;

  insert into public.qa_reports
    (delivery_id, tier_order_id, status, results, document_sha256, client_review_deadline, reviewer_id)
  values (
    p_delivery_id,
    v_order_id,
    p_status,
    v_results,
    p_document_sha256,
    v_deadline,
    p_reviewer_id
  );

  v_delivery := public.transition_delivery(
    p_delivery_id, 'AWAITING_CLIENT', 'QA raporu ile müşteri kontrolüne açıldı'
  );

  return v_delivery;
end;
$$;

revoke all on function public._record_qa_report(uuid, uuid, text, text, text, uuid, jsonb) from public;

-- create or replace only matches an identical parameter list -- adding a
-- trailing param makes this a new overload, not a replacement, so the old
-- 6-arg version has to be dropped explicitly or both stay registered.
drop function if exists public._record_qa_report(uuid, uuid, text, text, text, uuid);

create or replace function public.submit_qa_report(
  p_delivery_id uuid,
  p_contract_id uuid,
  p_status text,
  p_findings text,
  p_document_sha256 text,
  p_criteria jsonb default null
)
returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := public.is_admin();
  v_is_system boolean := coalesce(auth.role(), '') = 'service_role';
begin
  if not (v_is_admin or v_is_system) then
    raise exception 'only an admin or the agent worker (service_role) may submit a QA report'
      using errcode = 'insufficient_privilege';
  end if;

  return public._record_qa_report(
    p_delivery_id, p_contract_id, p_status, p_findings, p_document_sha256, null, p_criteria
  );
end;
$$;

revoke all on function public.submit_qa_report(uuid, uuid, text, text, text, jsonb) from public;
grant execute on function public.submit_qa_report(uuid, uuid, text, text, text, jsonb) to authenticated, service_role;

-- The old 5-arg overload from 20260907010000 is now shadowed by this 6-arg
-- version for every named-arg caller (PostgREST/postgrest-js always calls by
-- name), but Postgres keeps both signatures registered unless dropped
-- explicitly -- drop it so there is exactly one submit_qa_report to grant,
-- audit, and reason about.
drop function if exists public.submit_qa_report(uuid, uuid, text, text, text);
