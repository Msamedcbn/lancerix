-- Same bug class as 20260902060000_fix_agent_escalation.sql, found while
-- preparing Tier2 (Agentic QA) for its real end-to-end test: submit_qa_report()
-- (20260906010000_reviewer_token_report.sql) still only checks is_admin(),
-- which reads auth.uid() -- null under the agent worker's service-role
-- connection (src/lib/qa/agent.ts calls it via createAdminClient()), so
-- current_user_role() is null and is_admin() is always false. Every Tier2
-- PASS/FAIL verdict would hit this exception, get caught by agent.ts's outer
-- try/catch, and silently escalate to Tier3 instead of ever completing --
-- the agent could never actually finish an order. Same fix as
-- auto_escalate_qa_tier(): add the v_is_system branch transition_delivery()
-- already established for a non-human caller.

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
  v_is_admin boolean := public.is_admin();
  v_is_system boolean := coalesce(auth.role(), '') = 'service_role';
begin
  if not (v_is_admin or v_is_system) then
    raise exception 'only an admin or the agent worker (service_role) may submit a QA report'
      using errcode = 'insufficient_privilege';
  end if;

  return public._record_qa_report(
    p_delivery_id, p_contract_id, p_status, p_findings, p_document_sha256, null
  );
end;
$$;

revoke all on function public.submit_qa_report(uuid, uuid, text, text, text) from public;
grant execute on function public.submit_qa_report(uuid, uuid, text, text, text) to authenticated, service_role;
