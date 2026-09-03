-- Admin operator toolkit (T7): idempotency guard for the daily digest cron.
-- Vercel Hobby cron can refire within its scheduled hour (same reasoning as
-- remind-pending-review's REMINDER_WINDOW_HOURS comment) -- one row per date
-- actually sent, checked before sending rather than a mutable single-row
-- config value, so a partial failure never leaves an ambiguous state.
--
-- The cron runs with no user session (createAdminClient(), service role),
-- so RLS here is defense-in-depth for anyone reading it via a future UI,
-- not what actually gates the cron's own writes.

create table public.admin_digest_sends (
  id uuid primary key default gen_random_uuid(),
  sent_date date not null unique,
  sent_at timestamptz not null default now(),
  item_count integer not null
);

alter table public.admin_digest_sends enable row level security;

create policy admin_digest_sends_admin_only on public.admin_digest_sends
  for select using (public.is_admin());

grant select on public.admin_digest_sends to authenticated;
grant select, insert on public.admin_digest_sends to service_role;
