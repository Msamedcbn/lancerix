-- Signing, and the clock that makes silence mean something.
--
-- This is the mechanism the whole product rests on: a delivery that is not
-- objected to within a fixed window is accepted, and the acceptance is on the
-- record. It needs three things the schema did not have -- a window to count,
-- a deadline to count to, and signatures that make the record worth anything.
--
-- Note what is NOT here: the platform as a contracting party. Being a party
-- requires a legal entity. Until there is one the platform signs nothing and
-- witnesses everything, which the contract_signatures table already allows by
-- letting signer_id be null for a machine-applied party.

-- ---------------------------------------------------------------------------
-- The window, frozen with the rest of the terms
-- ---------------------------------------------------------------------------

alter table public.contracts
  add column if not exists objection_window_days integer not null default 5
    check (objection_window_days between 1 and 30);

comment on column public.contracts.objection_window_days is
  'Days a client has to object to a delivery before it is accepted automatically. Frozen at signing like the rates: changing the default must never move a deadline already running.';

-- ---------------------------------------------------------------------------
-- The deadline, set when work is delivered
-- ---------------------------------------------------------------------------

alter table public.milestones
  add column if not exists auto_accept_at timestamptz;

comment on column public.milestones.auto_accept_at is
  'When an unanswered delivery becomes accepted. Set by transition_milestone() on SUBMITTED and cleared on rework, so it is never stale.';

create index if not exists milestones_auto_accept_idx
  on public.milestones (auto_accept_at)
  where status = 'SUBMITTED';

-- ---------------------------------------------------------------------------
-- Signing
-- ---------------------------------------------------------------------------

-- Both signatures and the activation happen together, because a contract that
-- is signed by both parties but still sitting in PENDING_SIGNATURES would be a
-- lie. Doing it in the application would need an UPDATE the client has no
-- policy for -- contracts_update_draft is the freelancer's, and only in DRAFT.
create or replace function public.sign_contract(
  p_contract_id uuid,
  p_document_sha256 text,
  p_ip inet,
  p_user_agent text
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_party public.contract_party;
  v_uid uuid := auth.uid();
  v_signatures integer;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  if v_contract.freelancer_id = v_uid then
    v_party := 'FREELANCER';
  elsif v_contract.client_id = v_uid then
    v_party := 'CLIENT';
  else
    raise exception 'not a party to contract %', p_contract_id
      using errcode = 'insufficient_privilege';
  end if;

  if v_contract.status not in ('DRAFT', 'PENDING_SIGNATURES') then
    raise exception 'contract % is no longer open for signature', p_contract_id
      using errcode = 'check_violation';
  end if;

  -- The hash is of the exact text shown to this signer. If the freelancer
  -- edits the terms afterwards the two signatures no longer agree, and that is
  -- detectable rather than silent.
  insert into public.contract_signatures
    (contract_id, party, signer_id, document_sha256, ip_address, user_agent)
  values
    (p_contract_id, v_party, v_uid, p_document_sha256, p_ip, p_user_agent)
  on conflict (contract_id, party) do nothing;

  select count(*) into v_signatures
  from public.contract_signatures
  where contract_id = p_contract_id
    and party in ('FREELANCER', 'CLIENT');

  update public.contracts
  set status = case when v_signatures >= 2 then 'ACTIVE' else 'PENDING_SIGNATURES' end,
      document_sha256 = coalesce(document_sha256, p_document_sha256)
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

comment on function public.sign_contract is
  'Records one party''s signature and activates the contract once both have signed. Idempotent: signing twice is a no-op rather than an error.';

revoke all on function public.sign_contract(uuid, text, inet, text) from public;
grant execute on function public.sign_contract(uuid, text, inet, text) to authenticated;

-- ---------------------------------------------------------------------------
-- transition_milestone: start and stop the clock
-- ---------------------------------------------------------------------------

-- Replaced rather than patched, because the deadline has to be written in the
-- same statement as the status. Setting it afterwards would leave a window
-- where a milestone is delivered with no deadline attached, and the expiry job
-- would skip it forever.
create or replace function public.transition_milestone(
  p_milestone_id uuid,
  p_to_status public.escrow_status,
  p_reason text default null,
  p_provider_reference text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.milestones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_milestone public.milestones;
  v_contract public.contracts;
  v_from public.escrow_status;
  v_uid uuid := auth.uid();
  v_is_system boolean := coalesce(auth.role(), '') = 'service_role';
  v_is_admin boolean;
  v_is_client boolean;
  v_is_freelancer boolean;
begin
  select * into v_milestone from public.milestones where id = p_milestone_id for update;
  if not found then
    raise exception 'milestone % not found', p_milestone_id using errcode = 'no_data_found';
  end if;

  select * into v_contract from public.contracts where id = v_milestone.contract_id;

  v_is_admin      := (not v_is_system) and public.is_admin();
  v_is_client     := v_uid is not null and v_contract.client_id = v_uid;
  v_is_freelancer := v_uid is not null and v_contract.freelancer_id = v_uid;

  if not (v_is_system or v_is_admin or v_is_client or v_is_freelancer) then
    raise exception 'not a party to milestone %', p_milestone_id
      using errcode = 'insufficient_privilege';
  end if;

  v_from := v_milestone.status;

  if v_from = p_to_status then
    return v_milestone;
  end if;

  if not exists (
    select 1 from public.escrow_status_transitions
    where from_status = v_from and to_status = p_to_status
  ) then
    raise exception 'illegal escrow transition % -> %', v_from, p_to_status
      using errcode = 'check_violation';
  end if;

  if not public.can_actor_transition(
       p_to_status, v_is_client, v_is_freelancer, v_is_admin, v_is_system, v_from
     ) then
    raise exception 'caller may not move milestone % to %', p_milestone_id, p_to_status
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.escrow_transactions (
    milestone_id, from_status, to_status,
    gross_amount_kurus, platform_fee_kurus, client_charge_kurus,
    tax_withholding_kurus, freelancer_net_kurus,
    actor_id, actor_kind, reason, provider_reference, metadata
  ) values (
    p_milestone_id, v_from, p_to_status,
    v_milestone.gross_amount_kurus, v_milestone.platform_fee_kurus,
    v_milestone.client_charge_kurus,
    v_milestone.tax_withholding_kurus, v_milestone.freelancer_net_kurus,
    v_uid,
    case when v_is_system then 'SYSTEM' when v_is_admin then 'ADMIN' else 'USER' end,
    p_reason, p_provider_reference, coalesce(p_metadata, '{}'::jsonb)
  );

  perform set_config('app.escrow_transition', 'on', true);

  update public.milestones
  set status       = p_to_status,
      funded_at    = case when p_to_status = 'IN_PROGRESS' and funded_at is null
                          then now() else funded_at end,
      submitted_at = case when p_to_status = 'SUBMITTED' then now() else submitted_at end,
      completed_at = case when p_to_status = 'COMPLETED' then now() else completed_at end,
      released_at  = case when p_to_status = 'RELEASED'  then now() else released_at end,
      -- The clock starts on delivery and is cleared by anything that ends the
      -- wait: rework, acceptance, a dispute or a cancellation. A deadline is
      -- never left behind on a milestone that is no longer waiting.
      auto_accept_at = case
                         when p_to_status = 'SUBMITTED'
                           then now() + make_interval(days => v_contract.objection_window_days)
                         else null
                       end
  where id = p_milestone_id
  returning * into v_milestone;

  perform set_config('app.escrow_transition', 'off', true);

  return v_milestone;
end;
$$;

revoke all on function public.transition_milestone(uuid, public.escrow_status, text, text, jsonb) from public;
grant execute on function public.transition_milestone(uuid, public.escrow_status, text, text, jsonb)
  to authenticated;
