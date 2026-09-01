-- 20260901050000_delivery_auto_accept_cron.sql
--
-- 1. Automatic acceptance for expired QA deliveries.
--    When a delivery's client_review_deadline passes without the client accepting
--    or objecting, process_expired_deliveries() transitions it to ACCEPTED.
--    The ledger row records actor_kind = 'SYSTEM'.
--
-- 2. Consistency fix for is_contract_party:
--    Include public.is_admin() in is_contract_party() so admin callers are
--    uniformly recognized by all downstream RLS policies and RPC checks.

create or replace function public.is_contract_party(p_contract_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.contracts c
    where c.id = p_contract_id
      and (
        c.client_id = auth.uid()
        or c.freelancer_id = auth.uid()
        or public.is_admin()
        or (
          c.client_id is null
          and lower(c.client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          and coalesce(auth.jwt() ->> 'email', '') <> ''
        )
      )
  );
$$;

comment on function public.is_contract_party is
  'Checks if auth.uid() is a party (client, freelancer, or admin) or invited email to a contract.';

-- Process expired deliveries whose review window has passed.
create or replace function public.process_expired_deliveries()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec record;
  v_count integer := 0;
begin
  for v_rec in
    select d.id
    from public.deliveries d
    where d.status = 'AWAITING_CLIENT'
      and d.client_review_deadline is not null
      and d.client_review_deadline <= now()
    for update skip locked
  loop
    begin
      perform public.transition_delivery(
        v_rec.id,
        'ACCEPTED'::public.delivery_status,
        'Müşteri kontrol süresi doldu (otomatik onay)'
      );
      v_count := v_count + 1;
    exception when others then
      -- Log or ignore individual failures so one locked row does not block others
      null;
    end;
  end loop;

  return v_count;
end;
$$;

comment on function public.process_expired_deliveries is
  'Transitions expired AWAITING_CLIENT deliveries to ACCEPTED. Called by cron worker or system scheduled task.';

revoke all on function public.process_expired_deliveries() from public;
grant execute on function public.process_expired_deliveries() to service_role, authenticated;
