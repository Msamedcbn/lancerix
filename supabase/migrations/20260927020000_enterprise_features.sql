-- Migration: 20260927020000_enterprise_features.sql
-- Lancerix Enterprise Pillars: Slack/Discord Webhooks & White-Label Agency Branding

-- ---------------------------------------------------------------------------
-- 1) Security Integrations (Slack, Discord, Custom Webhooks)
-- ---------------------------------------------------------------------------
create table public.security_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('SLACK', 'DISCORD', 'GENERIC_WEBHOOK')),
  name text not null default 'Production Alerts',
  webhook_url text not null,
  is_active boolean not null default true,
  notify_on_critical boolean not null default true,
  notify_on_scan_complete boolean not null default true,
  created_at timestamptz not null default now()
);

create index security_integrations_user_idx on public.security_integrations (user_id);

alter table public.security_integrations enable row level security;

create policy security_integrations_select on public.security_integrations
  for select using (user_id = auth.uid() or public.is_admin());

create policy security_integrations_insert on public.security_integrations
  for insert with check (user_id = auth.uid());

create policy security_integrations_update on public.security_integrations
  for update using (user_id = auth.uid() or public.is_admin());

create policy security_integrations_delete on public.security_integrations
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 2) White-Label Agency Branding
--    Gated (2026-10-01) behind the existing Ajans monitoring_subscriptions
--    plan (TRY 3500 / $349 / EUR 349, whiteLabel: true in monitoring.ts) --
--    not a separate product; see hasActiveAgencySubscription.
-- ---------------------------------------------------------------------------
create table public.security_agency_branding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  agency_name text not null,
  logo_url text,
  primary_color text not null default '#10b981',
  custom_footer text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index security_agency_branding_user_idx on public.security_agency_branding (user_id);

alter table public.security_agency_branding enable row level security;

create policy security_agency_branding_select on public.security_agency_branding
  for select using (true); -- Publicly selectable so public audit reports can read agency branding

create policy security_agency_branding_insert on public.security_agency_branding
  for insert with check (user_id = auth.uid());

create policy security_agency_branding_update on public.security_agency_branding
  for update using (user_id = auth.uid() or public.is_admin());

create policy security_agency_branding_delete on public.security_agency_branding
  for delete using (user_id = auth.uid() or public.is_admin());
