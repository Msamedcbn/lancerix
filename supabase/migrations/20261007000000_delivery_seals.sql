-- Migration: 20261007000000_delivery_seals.sql
-- Lancerix: Instant Single-Player Delivery Proof & Legal Dossier Schema

create extension if not exists "pgcrypto" schema extensions;

create table if not exists public.delivery_seals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  access_token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  project_name text not null,
  target_url text not null,
  criteria jsonb not null default '[]'::jsonb,
  git_commit text,
  document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  prober_summary jsonb not null default '{}'::jsonb,
  status text not null default 'SEALED' check (status in ('SEALED', 'DISPUTED', 'TACITLY_ACCEPTED')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists delivery_seals_access_token_idx on public.delivery_seals (access_token);
create index if not exists delivery_seals_user_id_idx on public.delivery_seals (user_id);
create index if not exists delivery_seals_created_at_idx on public.delivery_seals (created_at desc);

alter table public.delivery_seals enable row level security;

-- Anyone can view the public dossier (required for public verification by client/arbitrator)
create policy delivery_seals_public_select on public.delivery_seals
  for select using (true);

-- Anyone can create a delivery seal (authenticated or anonymous single-player)
create policy delivery_seals_insert on public.delivery_seals
  for insert with check (
    user_id is null or user_id = auth.uid()
  );

-- Only owner or admin can update status
create policy delivery_seals_update on public.delivery_seals
  for update using (
    (user_id is not null and user_id = auth.uid()) or public.is_admin()
  );
