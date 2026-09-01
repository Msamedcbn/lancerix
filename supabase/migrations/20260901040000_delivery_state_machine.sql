-- Faz 1c: what happens after a QA_ONLY contract is signed.
--
-- Until now the answer was nothing: criteria were recorded, both parties
-- signed, and the product stopped. A delivery row could be inserted but had no
-- status, so there was no way to say "QA has run", "the client is looking at
-- it", or "the window closed and nobody objected".
--
-- The shape mirrors milestones deliberately. A milestone's status may only
-- change inside transition_milestone(), which writes the escrow_transactions
-- row in the same transaction, and guard_milestone_status() rejects any change
-- made outside it. A delivery gets the same treatment with delivery_events,
-- because here the evidence IS the product: a record saying "accepted" is
-- worth nothing if the row could have been edited to say so.

-- ---------------------------------------------------------------------------
-- Status, and the clock the client is answering
-- ---------------------------------------------------------------------------

create type public.delivery_status as enum (
  'SUBMITTED',        -- handed over, no QA tier chosen yet
  'QA_QUEUED',        -- a tier was bought, QA has not produced a report
  'QA_DONE',          -- a report exists
  'AWAITING_CLIENT',  -- the client's review window is running
  'ACCEPTED',         -- the client accepted, or the window closed in silence
  'REJECTED'          -- the client objected within the window
);

alter table public.deliveries
  add column status public.delivery_status not null default 'SUBMITTED',
  -- When silence becomes acceptance. Null until the window opens.
  add column client_review_deadline timestamptz,
  add column client_note text,
  add column decided_at timestamptz;

create index deliveries_review_deadline_idx
  on public.deliveries (client_review_deadline)
  where status = 'AWAITING_CLIENT';

comment on column public.deliveries.client_review_deadline is
  'When an unanswered delivery becomes accepted. Set by transition_delivery() on AWAITING_CLIENT and cleared on rework, so it is never stale. Mirrors milestones.auto_accept_at.';

-- ---------------------------------------------------------------------------
-- The append-only record
-- ---------------------------------------------------------------------------

create table public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  from_status public.delivery_status,
  to_status public.delivery_status not null,
  -- SYSTEM is the review window closing. That distinction is the whole point
  -- of the record: accepted, or accepted by not objecting.
  actor_kind text not null check (actor_kind in ('USER', 'ADMIN', 'SYSTEM')),
  actor_id uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index delivery_events_delivery_id_idx on public.delivery_events (delivery_id);

alter table public.delivery_events enable row level security;

create policy delivery_events_select on public.delivery_events
  for select using (
    exists (
      select 1 from public.deliveries d
      where d.id = delivery_id
        and (public.is_contract_party(d.contract_id) or public.is_admin())
    )
  );

-- No update or delete policy at all, plus a blocking trigger, exactly like
-- escrow_transactions: append-only in both directions.
create or replace function public.forbid_delivery_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'delivery_events is append-only'
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger delivery_events_immutable
  before update or delete on public.delivery_events
  for each row execute function public.forbid_delivery_event_mutation();

-- ---------------------------------------------------------------------------
-- The legal edges
-- ---------------------------------------------------------------------------

-- Mirrored by DELIVERY_TRANSITIONS in src/lib/qa/delivery-state-machine.ts.
-- Change both together.
create table public.delivery_status_transitions (
  from_status public.delivery_status not null,
  to_status public.delivery_status not null,
  primary key (from_status, to_status)
);

insert into public.delivery_status_transitions (from_status, to_status) values
  -- Tier 1 buys no QA run, so it goes straight to the client.
  ('SUBMITTED',       'AWAITING_CLIENT'),
  -- Tier 2 and Tier 3 queue a run first.
  ('SUBMITTED',       'QA_QUEUED'),
  ('QA_QUEUED',       'QA_DONE'),
  ('QA_DONE',         'AWAITING_CLIENT'),
  ('AWAITING_CLIENT', 'ACCEPTED'),
  ('AWAITING_CLIENT', 'REJECTED'),
  -- A rejected delivery is reworked and handed over again.
  ('REJECTED',        'SUBMITTED');

alter table public.delivery_status_transitions enable row level security;

create policy delivery_status_transitions_read on public.delivery_status_transitions
  for select using (true);

-- Who may make each move.
--   AWAITING_CLIENT  freelancer opens the window (Tier 1) or QA closing does
--   QA_QUEUED        freelancer buys a tier
--   QA_DONE          SYSTEM (Tier 2 agent) or ADMIN (Tier 3 desk)
--   ACCEPTED         client accepts, or SYSTEM when the window expires
--   REJECTED         client objects
--   SUBMITTED        freelancer re-delivers after a rejection
create or replace function public.can_actor_transition_delivery(
  p_from_status public.delivery_status,
  p_to_status public.delivery_status,
  p_is_client boolean,
  p_is_freelancer boolean,
  p_is_admin boolean,
  p_is_system boolean
)
returns boolean
language sql
immutable
parallel safe
as $$
  select case
    when p_is_admin or p_is_system then true
    when p_to_status in ('ACCEPTED', 'REJECTED') then p_is_client
    when p_to_status in ('QA_QUEUED', 'SUBMITTED') then p_is_freelancer
    -- Tier 1 has no QA step, so the freelancer opens the window directly.
    when p_to_status = 'AWAITING_CLIENT' then p_is_freelancer
    -- QA_DONE is never a party's to make: only the agent or the QA desk.
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- The only sanctioned way a delivery's status may change
-- ---------------------------------------------------------------------------

create or replace function public.transition_delivery(
  p_delivery_id uuid,
  p_to_status public.delivery_status,
  p_reason text default null
)
returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery public.deliveries;
  v_contract public.contracts;
  v_from public.delivery_status;
  v_uid uuid := auth.uid();
  v_is_client boolean;
  v_is_freelancer boolean;
  v_is_admin boolean := public.is_admin();
  v_is_system boolean := coalesce(auth.role(), '') = 'service_role';
begin
  select * into v_delivery from public.deliveries where id = p_delivery_id for update;
  if not found then
    raise exception 'delivery % not found', p_delivery_id using errcode = 'no_data_found';
  end if;

  select * into v_contract from public.contracts where id = v_delivery.contract_id;

  v_is_client := v_contract.client_id is not null and v_contract.client_id = v_uid;
  v_is_freelancer := v_contract.freelancer_id = v_uid;

  if not (v_is_client or v_is_freelancer or v_is_admin or v_is_system) then
    raise exception 'not a party to delivery %', p_delivery_id
      using errcode = 'insufficient_privilege';
  end if;

  v_from := v_delivery.status;

  -- Repeating the current status is a no-op rather than an error, so a double
  -- click cannot write two ledger rows for one move.
  if v_from = p_to_status then
    return v_delivery;
  end if;

  if not exists (
    select 1 from public.delivery_status_transitions
    where from_status = v_from and to_status = p_to_status
  ) then
    raise exception 'illegal delivery transition % -> %', v_from, p_to_status
      using errcode = 'check_violation';
  end if;

  if not public.can_actor_transition_delivery(
       v_from, p_to_status, v_is_client, v_is_freelancer, v_is_admin, v_is_system
     ) then
    raise exception 'caller may not move delivery % to %', p_delivery_id, p_to_status
      using errcode = 'insufficient_privilege';
  end if;

  -- The ledger row and the status change land in the same transaction, so a
  -- status can never exist without the event that produced it.
  insert into public.delivery_events
    (delivery_id, from_status, to_status, actor_kind, actor_id, reason)
  values (
    p_delivery_id,
    v_from,
    p_to_status,
    case
      when v_is_system then 'SYSTEM'
      when v_is_admin and not (v_is_client or v_is_freelancer) then 'ADMIN'
      else 'USER'
    end,
    v_uid,
    p_reason
  );

  -- is_local = true, so the flag unwinds with the transaction and a failed
  -- transition cannot leave the guard open. Same pattern as
  -- app.escrow_transition in transition_milestone().
  perform set_config('app.delivery_transition', 'on', true);

  update public.deliveries
  set status = p_to_status,
      client_note = case
        when p_to_status in ('ACCEPTED', 'REJECTED') then coalesce(p_reason, client_note)
        else client_note
      end,
      decided_at = case
        when p_to_status in ('ACCEPTED', 'REJECTED') then now()
        else decided_at
      end,
      client_review_deadline = case
        when p_to_status = 'AWAITING_CLIENT'
          then now() + make_interval(days => v_contract.objection_window_days)
        -- Reworking clears the old deadline rather than leaving it to look live.
        when p_to_status = 'SUBMITTED' then null
        else client_review_deadline
      end
  where id = p_delivery_id
  returning * into v_delivery;

  return v_delivery;
end;
$$;

comment on function public.transition_delivery is
  'The only sanctioned way to move a delivery. Writes the delivery_events row in the same transaction; deliveries_guard_status rejects any status change made outside it.';

revoke all on function public.transition_delivery(uuid, public.delivery_status, text) from public;
grant execute on function public.transition_delivery(uuid, public.delivery_status, text)
  to authenticated, service_role;

-- Anything editing deliveries.status without going through the function above
-- is rejected, so the ledger cannot fall out of step with the row.
create or replace function public.guard_delivery_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     and coalesce(current_setting('app.delivery_transition', true), '') <> 'on' then
    raise exception
      'delivery status must change via transition_delivery() so the record stays complete'
      using errcode = 'restrict_violation';
  end if;
  return new;
end;
$$;

create trigger deliveries_guard_status
  before update on public.deliveries
  for each row execute function public.guard_delivery_status();

-- ---------------------------------------------------------------------------
-- Writing tier orders and reports
-- ---------------------------------------------------------------------------

-- The freelancer buys the tier for their own delivery.
create policy qa_tier_orders_insert on public.qa_tier_orders
  for insert with check (
    exists (
      select 1
      from public.deliveries d
      join public.contracts c on c.id = d.contract_id
      where d.id = delivery_id and c.freelancer_id = auth.uid()
    )
  );

-- Only an admin writes a report by hand. Tier 2's agent will run as the
-- service role, which bypasses RLS entirely.
create policy qa_reports_insert_admin on public.qa_reports
  for insert with check (public.is_admin());
