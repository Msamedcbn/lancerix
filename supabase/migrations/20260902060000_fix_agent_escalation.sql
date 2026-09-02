-- Fixes two bugs in auto_escalate_qa_tier() (20260902040000), found before
-- the agent worker was ever run against production:
--
-- 1. It only checked is_admin(), which reads auth.uid() -- null under the
--    worker's service-role connection, so current_user_role() is null and
--    is_admin() is always false. Every escalation call from the actual
--    worker would have failed with insufficient_privilege, silently (the
--    worker only console.errors on this), leaving the order stuck at
--    agent_status='RUNNING' forever with no human ever notified.
--    transition_delivery() already has the right pattern for this
--    (auth.role() = 'service_role' as a system actor) -- this mirrors it.
--
-- 2. It inserted a second, orphan TIER3 qa_tier_orders row with
--    reviewer_id = null and fee_kurus = 0, bypassing choose_qa_tier()
--    entirely. That row would never show up as needing a reviewer (nothing
--    reads "orphan TIER3 with no reviewer" as a queue item) and would never
--    be billed. The existing order, still sitting in QA_QUEUED from
--    choose_qa_tier(), already shows up on /admin/qa-queue and can be
--    completed there with the existing submit_qa_report() form -- no second
--    order is needed. This just marks the original order escalated instead.

create or replace function public.auto_escalate_qa_tier(
  p_order_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := public.is_admin();
  v_is_system boolean := coalesce(auth.role(), '') = 'service_role';
begin
  if not (v_is_admin or v_is_system) then
    raise exception 'only admin or the agent worker (service_role) may escalate a QA tier order'
      using errcode = 'insufficient_privilege';
  end if;

  update public.qa_tier_orders
  set agent_status = 'ESCALATED'
  where id = p_order_id;

  if not found then
    raise exception 'qa_tier_order % not found', p_order_id using errcode = 'no_data_found';
  end if;
end;
$$;

revoke all on function public.auto_escalate_qa_tier(uuid, text) from public;
grant execute on function public.auto_escalate_qa_tier(uuid, text) to authenticated, service_role;
