-- Admin operator toolkit (T8): a single append-only log for the six
-- existing admin mutations (addReviewer, setReviewerActive,
-- setReviewerRate, setInvoiceAmount, setInvoiceStatus, submitQaReport --
-- and markQaOrderPaid, added the same week). Unlike delivery_status
-- transitions there is no single chokepoint function for these six calls,
-- so this is a plain log table an app-level helper writes to, not an
-- RPC-derived side effect. Append-only in both directions, exactly like
-- delivery_events and escrow_transactions: no update/delete policy, plus a
-- blocking trigger.

create table public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  event_type text not null,
  target_type text not null,
  target_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_activity_log_created_at_idx on public.admin_activity_log (created_at desc);

alter table public.admin_activity_log enable row level security;

create policy admin_activity_log_select_admin on public.admin_activity_log
  for select using (public.is_admin());

create policy admin_activity_log_insert_admin on public.admin_activity_log
  for insert with check (public.is_admin());

grant select, insert on public.admin_activity_log to authenticated;

create or replace function public.forbid_admin_activity_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'admin_activity_log is append-only'
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger admin_activity_log_immutable
  before update or delete on public.admin_activity_log
  for each row execute function public.forbid_admin_activity_log_mutation();
