-- Platform invoices: issued when work starts, regardless of QA or escrow usage.
--
-- Lancerix is the service provider. When work officially begins (both parties
-- confirm the start date), a service invoice is created for the client company.

create table if not exists public.platform_invoices (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete restrict,
  invoice_type text not null check (invoice_type in ('WORK_START', 'QA_SERVICE', 'CUSTOM')),
  amount_kurus bigint not null default 0 check (amount_kurus >= 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'CANCELLED')),
  description text,
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists platform_invoices_contract_id_idx
  on public.platform_invoices (contract_id);

create index if not exists platform_invoices_client_id_idx
  on public.platform_invoices (client_id);

-- RLS
alter table public.platform_invoices enable row level security;

create policy platform_invoices_select_party on public.platform_invoices
  for select using (
    client_id = auth.uid()
    or public.is_contract_party(contract_id)
    or public.is_admin()
  );

create policy platform_invoices_admin_write on public.platform_invoices
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.platform_invoices to authenticated;
