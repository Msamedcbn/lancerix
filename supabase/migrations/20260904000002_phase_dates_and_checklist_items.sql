-- Two additions to workflow_phases, both asked for directly: real calendar
-- dates instead of a vague "~N days" estimate, and a checklist of items
-- within a phase so a freelancer can break a phase down and tick items off
-- individually while the phase itself is still in progress.
--
-- estimated_days stays on the table (existing phases may have it set) but
-- the creation form stops collecting it going forward -- one way to express
-- timing, not two competing ones.

alter table public.workflow_phases
  add column if not exists start_date date,
  add column if not exists end_date date;

alter table public.workflow_phases
  drop constraint if exists workflow_phases_date_order;

alter table public.workflow_phases
  add constraint workflow_phases_date_order
  check (start_date is null or end_date is null or end_date >= start_date);

-- ---------------------------------------------------------------------------
-- workflow_phase_items: a checklist within one phase
-- ---------------------------------------------------------------------------

create table if not exists public.workflow_phase_items (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.workflow_phases(id) on delete cascade,
  sequence_no integer not null check (sequence_no > 0),
  title text not null check (length(btrim(title)) between 1 and 255),
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (phase_id, sequence_no)
);

create index if not exists workflow_phase_items_phase_id_idx
  on public.workflow_phase_items (phase_id);

alter table public.workflow_phase_items enable row level security;

-- Same party test as workflow_phases itself, one hop out through phase_id.
create policy workflow_phase_items_select_party on public.workflow_phase_items
  for select using (
    exists (
      select 1 from public.workflow_phases p
      where p.id = phase_id
        and (public.is_contract_party(p.contract_id) or public.is_admin())
    )
  );

create policy workflow_phase_items_insert_freelancer on public.workflow_phase_items
  for insert with check (
    exists (
      select 1 from public.workflow_phases p
      join public.contracts c on c.id = p.contract_id
      where p.id = phase_id and c.freelancer_id = auth.uid()
    )
  );

-- Mirrors workflow_phases_update_freelancer's shape (freelancer can update
-- any column on their own contract's rows, same as the sibling table) so
-- the toggle action here follows the exact same pattern as
-- toggleWorkflowPhase() -- a plain table update, not a new RPC convention.
create policy workflow_phase_items_update_freelancer on public.workflow_phase_items
  for update using (
    exists (
      select 1 from public.workflow_phases p
      join public.contracts c on c.id = p.contract_id
      where p.id = phase_id and c.freelancer_id = auth.uid()
    )
  );

grant select, insert, update on public.workflow_phase_items to authenticated;
