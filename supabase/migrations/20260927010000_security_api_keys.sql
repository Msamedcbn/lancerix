-- Migration: 20260927010000_security_api_keys.sql
-- Lancerix Developer API Keys for CI/CD & Automated CLI Pentesting

create table public.security_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'CI/CD Pipeline Key',
  key_prefix text not null, -- e.g. "lx_sec_a1b2..." for display
  key_hash text not null unique, -- sha256 hex digest of full key
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index security_api_keys_user_idx on public.security_api_keys (user_id);
create index security_api_keys_hash_idx on public.security_api_keys (key_hash);

alter table public.security_api_keys enable row level security;

create policy security_api_keys_select on public.security_api_keys
  for select using (user_id = auth.uid() or public.is_admin());

create policy security_api_keys_insert on public.security_api_keys
  for insert with check (user_id = auth.uid());

create policy security_api_keys_delete on public.security_api_keys
  for delete using (user_id = auth.uid() or public.is_admin());
