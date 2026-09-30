-- Migration: 20260927000000_security_agent_tables.sql
-- Lancerix: Autonomous AI Security & Pentest Agent Schema

-- pgcrypto was enabled in the 2026-08-30 init migration but gen_random_bytes()
-- still resolved to "does not exist" here -- the extension lives in the
-- `extensions` schema (Supabase's default for newer projects), outside
-- public's search_path, so the call below is schema-qualified rather than
-- relying on an unqualified lookup.
create extension if not exists "pgcrypto" schema extensions;

-- ---------------------------------------------------------------------------
-- 1) Security Targets (Websites, Web Apps & APIs to Audit)
-- ---------------------------------------------------------------------------
create table public.security_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_url text not null,
  verification_method text not null default 'DNS_TXT' check (verification_method in ('DNS_TXT', 'META_TAG', 'MANUAL_EXEMPT')),
  verification_token text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  is_verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index security_targets_user_idx on public.security_targets (user_id);
create index security_targets_url_idx on public.security_targets (target_url);

alter table public.security_targets enable row level security;

create policy security_targets_select on public.security_targets
  for select using (user_id = auth.uid() or public.is_admin());

create policy security_targets_insert on public.security_targets
  for insert with check (user_id = auth.uid());

create policy security_targets_update on public.security_targets
  for update using (user_id = auth.uid() or public.is_admin());

create policy security_targets_delete on public.security_targets
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 2) Security Scans / Pentest Runs
-- ---------------------------------------------------------------------------
create table public.security_scans (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.security_targets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_type text not null default 'FULL_AUDIT' check (scan_type in ('QUICK', 'FULL_AUDIT', 'OWASP_DEEP', 'API_SECURITY')),
  status text not null default 'QUEUED' check (status in ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
  health_score int default 100 check (health_score >= 0 and health_score <= 100),
  summary jsonb not null default '{}'::jsonb,
  document_sha256 text check (document_sha256 is null or document_sha256 ~ '^[0-9a-f]{64}$'),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index security_scans_target_idx on public.security_scans (target_id, created_at desc);
create index security_scans_user_idx on public.security_scans (user_id);

alter table public.security_scans enable row level security;

create policy security_scans_select on public.security_scans
  for select using (user_id = auth.uid() or public.is_admin());

create policy security_scans_insert on public.security_scans
  for insert with check (user_id = auth.uid());

create policy security_scans_update on public.security_scans
  for update using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 3) Security Vulnerabilities & Findings
-- ---------------------------------------------------------------------------
create table public.security_vulnerabilities (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.security_scans(id) on delete cascade,
  target_id uuid not null references public.security_targets(id) on delete cascade,
  title text not null,
  description text not null,
  severity text not null check (severity in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
  category text not null,
  cvss_score numeric(3,1) check (cvss_score >= 0.0 and cvss_score <= 10.0),
  affected_url text not null,
  evidence text,
  remediation_patch text,
  status text not null default 'OPEN' check (status in ('OPEN', 'RESOLVED', 'FALSE_POSITIVE')),
  created_at timestamptz not null default now()
);

create index security_vulnerabilities_scan_idx on public.security_vulnerabilities (scan_id);
create index security_vulnerabilities_target_idx on public.security_vulnerabilities (target_id);
create index security_vulnerabilities_severity_idx on public.security_vulnerabilities (severity);

alter table public.security_vulnerabilities enable row level security;

create policy security_vulnerabilities_select on public.security_vulnerabilities
  for select using (
    exists (
      select 1 from public.security_targets t
      where t.id = target_id and (t.user_id = auth.uid() or public.is_admin())
    )
  );

create policy security_vulnerabilities_insert on public.security_vulnerabilities
  for insert with check (
    exists (
      select 1 from public.security_targets t
      where t.id = target_id and (t.user_id = auth.uid() or public.is_admin())
    )
  );

create policy security_vulnerabilities_update on public.security_vulnerabilities
  for update using (
    exists (
      select 1 from public.security_targets t
      where t.id = target_id and (t.user_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- 4) Security Scan Real-Time Agent Logs
-- ---------------------------------------------------------------------------
create table public.security_scan_logs (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.security_scans(id) on delete cascade,
  step_name text not null,
  message text not null,
  level text not null default 'INFO' check (level in ('INFO', 'WARN', 'SUCCESS', 'ERROR')),
  created_at timestamptz not null default now()
);

create index security_scan_logs_scan_idx on public.security_scan_logs (scan_id, created_at asc);

alter table public.security_scan_logs enable row level security;

create policy security_scan_logs_select on public.security_scan_logs
  for select using (
    exists (
      select 1 from public.security_scans s
      where s.id = scan_id and (s.user_id = auth.uid() or public.is_admin())
    )
  );

create policy security_scan_logs_insert on public.security_scan_logs
  for insert with check (
    exists (
      select 1 from public.security_scans s
      where s.id = scan_id and (s.user_id = auth.uid() or public.is_admin())
    )
  );
