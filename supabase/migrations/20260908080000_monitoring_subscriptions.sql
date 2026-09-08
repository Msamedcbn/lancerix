-- Continuous monitoring subscriptions (2026-09-08).
--
-- The same deterministic engine as a standalone check, run on a schedule
-- against sites the subscriber registered, with an email only when a result
-- CHANGES between runs (src/lib/qa/diff.ts). The change detection is the
-- product; the repetition on its own is not worth a monthly fee.
--
-- Its own table/RLS/report pair rather than a retrofit of standalone_qa_orders,
-- for the same reason 20260908010000 gave for not retrofitting qa_tier_orders:
-- a monitoring scan has no fee, no payment_status and no per-scan order. Fusing
-- them would mean nullable columns that only make sense for one of the two.

-- ---------------------------------------------------------------------------
-- 1) Subscriptions
-- ---------------------------------------------------------------------------
create table public.monitoring_subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('MONITORING', 'AGENCY')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAST_DUE', 'CANCELED')),
  cadence text not null check (cadence in ('WEEKLY', 'MONTHLY')),
  -- Mirrors MONITORING_PLANS in src/lib/validations/monitoring.ts. Non-TRY
  -- amounts live only here and in monitoring rows: CLAUDE.md's "every amount is
  -- an integer of kurus" governs the Faz 2 escrow ledger, which stays TRY-only.
  currency text not null check (currency in ('TRY', 'USD', 'EUR')),
  price_minor bigint not null check (price_minor > 0),
  site_limit int not null check (site_limit > 0),
  -- Polar's subscription id, set by the webhook. Nullable because the row is
  -- created before checkout completes, same as standalone_qa_orders.
  provider_reference text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  canceled_at timestamptz
);

create index monitoring_subscriptions_subscriber_idx
  on public.monitoring_subscriptions (subscriber_id);

alter table public.monitoring_subscriptions enable row level security;

create policy monitoring_subscriptions_select on public.monitoring_subscriptions
  for select using (subscriber_id = auth.uid() or public.is_admin());

-- Inserted by the app on behalf of the signed-in subscriber; every later
-- change (status, provider_reference, period) comes from a verified Polar
-- webhook running as service_role, which bypasses RLS. No update policy for
-- the authenticated role: a subscriber must not be able to mark their own
-- subscription ACTIVE.
create policy monitoring_subscriptions_insert on public.monitoring_subscriptions
  for insert with check (subscriber_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2) The sites a subscription watches
-- ---------------------------------------------------------------------------
create table public.monitored_sites (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.monitoring_subscriptions(id) on delete cascade,
  target_url text not null,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  -- Soft-removed rather than deleted: the scan history under it stays readable,
  -- and "this URL was watched between these dates" is part of what the customer
  -- bought.
  removed_at timestamptz
);

create index monitored_sites_subscription_idx on public.monitored_sites (subscription_id);
-- The scheduler's query: due sites, oldest first.
create index monitored_sites_due_idx on public.monitored_sites (last_scanned_at)
  where removed_at is null;

alter table public.monitored_sites enable row level security;

create policy monitored_sites_select on public.monitored_sites
  for select using (
    exists (
      select 1 from public.monitoring_subscriptions s
      where s.id = subscription_id and s.subscriber_id = auth.uid()
    )
    or public.is_admin()
  );

-- A subscriber may only add a site to their OWN subscription, only while it is
-- ACTIVE, and only within the plan's site limit. The limit is enforced here
-- rather than in the action alone: the action is one caller, the policy is the
-- boundary.
create policy monitored_sites_insert on public.monitored_sites
  for insert with check (
    exists (
      select 1 from public.monitoring_subscriptions s
      where s.id = subscription_id
        and s.subscriber_id = auth.uid()
        and s.status = 'ACTIVE'
        and (
          select count(*) from public.monitored_sites m
          where m.subscription_id = s.id and m.removed_at is null
        ) < s.site_limit
    )
  );

-- Removing a site is the one field a subscriber may change.
create policy monitored_sites_update on public.monitored_sites
  for update using (
    exists (
      select 1 from public.monitoring_subscriptions s
      where s.id = subscription_id and s.subscriber_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3) Scans and their reports
-- ---------------------------------------------------------------------------
create table public.monitoring_scans (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.monitored_sites(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Set when this scan differed from the one before it and the subscriber was
  -- emailed. Null means "ran, nothing changed" -- which is the normal case and
  -- deliberately does not generate mail.
  notified_at timestamptz
);

create index monitoring_scans_site_idx on public.monitoring_scans (site_id, started_at desc);

alter table public.monitoring_scans enable row level security;

create policy monitoring_scans_select on public.monitoring_scans
  for select using (
    exists (
      select 1
      from public.monitored_sites m
      join public.monitoring_subscriptions s on s.id = m.subscription_id
      where m.id = site_id and s.subscriber_id = auth.uid()
    )
    or public.is_admin()
  );

create table public.monitoring_scan_reports (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.monitoring_scans(id) on delete cascade,
  check_type text not null,
  -- Same four outcomes as standalone_qa_reports, ERROR included: a module that
  -- could not run must leave a trace here too, and diffScans() skips it rather
  -- than reporting a fake improvement.
  status text not null check (status in ('PASS', 'FAIL', 'PARTIAL', 'ERROR')),
  results jsonb not null,
  document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  generated_at timestamptz not null default now()
);

create index monitoring_scan_reports_scan_idx on public.monitoring_scan_reports (scan_id);

alter table public.monitoring_scan_reports enable row level security;

create policy monitoring_scan_reports_select on public.monitoring_scan_reports
  for select using (
    exists (
      select 1
      from public.monitoring_scans sc
      join public.monitored_sites m on m.id = sc.site_id
      join public.monitoring_subscriptions s on s.id = m.subscription_id
      where sc.id = scan_id and s.subscriber_id = auth.uid()
    )
    or public.is_admin()
  );

-- Append-only, same reasoning as standalone_qa_reports: a verification result
-- is evidence, not a draft. Only the scheduled service-role scan writes one.
create policy monitoring_scan_reports_no_update on public.monitoring_scan_reports
  for update using (false);

create policy monitoring_scan_reports_no_delete on public.monitoring_scan_reports
  for delete using (false);
