-- Workflow phases: the project breakdown a freelancer builds step by step.
--
-- Each contract can have multiple phases. The freelancer defines them during
-- contract creation (or later). Both parties see the phases as a diagram.
-- The freelancer ticks each phase as completed; the client sees progress.

create table if not exists public.workflow_phases (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  sequence_no integer not null check (sequence_no > 0),
  title text not null check (length(btrim(title)) between 3 and 255),
  description text,
  estimated_days integer check (estimated_days is null or estimated_days > 0),
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (contract_id, sequence_no)
);

create index if not exists workflow_phases_contract_id_idx
  on public.workflow_phases (contract_id);

-- RLS: both parties to the contract can see the phases
alter table public.workflow_phases enable row level security;

create policy workflow_phases_select_party on public.workflow_phases
  for select using (public.is_contract_party(contract_id) or public.is_admin());

-- Freelancer can insert phases on their own contracts
create policy workflow_phases_insert_freelancer on public.workflow_phases
  for insert with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.freelancer_id = auth.uid()
    )
  );

-- Freelancer can update phases (mark completed)
create policy workflow_phases_update_freelancer on public.workflow_phases
  for update using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.freelancer_id = auth.uid()
    )
  );

grant select, insert, update on public.workflow_phases to authenticated;

-- ---------------------------------------------------------------------------
-- complete_phase: marks a phase as done with a timestamp
-- ---------------------------------------------------------------------------

create or replace function public.complete_phase(p_phase_id uuid)
returns public.workflow_phases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phase public.workflow_phases;
  v_uid uuid := auth.uid();
begin
  select * into v_phase from public.workflow_phases where id = p_phase_id for update;
  if not found then
    raise exception 'phase % not found', p_phase_id using errcode = 'no_data_found';
  end if;

  -- Only the freelancer on the contract may complete phases
  if not exists (
    select 1 from public.contracts c
    where c.id = v_phase.contract_id and c.freelancer_id = v_uid
  ) then
    raise exception 'only the freelancer may complete phases'
      using errcode = 'insufficient_privilege';
  end if;

  update public.workflow_phases
  set is_completed = true,
      completed_at = now()
  where id = p_phase_id
  returning * into v_phase;

  return v_phase;
end;
$$;

revoke all on function public.complete_phase(uuid) from public;
grant execute on function public.complete_phase(uuid) to authenticated;
