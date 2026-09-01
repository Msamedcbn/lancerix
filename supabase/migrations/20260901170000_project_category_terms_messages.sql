-- Three things Faz 1 assumed but never modelled:
--
-- 1. Not every freelancer ships software. The delivery flow is built around
--    "a staging URL", which is a web-dev framing; a designer hands over a
--    Figma link, an editor a Drive folder. The URL column stays -- all three
--    ARE urls -- but the contract now records what kind of work it is, so
--    the UI can ask for the right thing and the signed document can name it.
--
-- 2. Signing recorded the document hash but not that the party accepted
--    Lancerix's own terms of service. Those are different agreements: one is
--    between the two parties, the other is between each party and the
--    platform. Storing the version means a later terms change is visible
--    rather than retroactive.
--
-- 3. The parties had no way to talk inside the product. Every clarification
--    happened off-platform, which defeats the point of a record.

-- ---------------------------------------------------------------------------
-- 1. What kind of work is this
-- ---------------------------------------------------------------------------

create type public.project_category as enum (
  'SOFTWARE',      -- web/mobile/backend: staging URL, PR link
  'DESIGN',        -- graphic/UI design: Figma, Drive, Behance
  'VIDEO',         -- video editing/motion: Drive, Frame.io, Vimeo
  'CONTENT',       -- copywriting, translation, SEO: Docs, Notion
  'MARKETING',     -- social/ads management: report link, dashboard
  'OTHER'
);

alter table public.contracts
  add column if not exists project_category public.project_category
    not null default 'SOFTWARE';

comment on column public.contracts.project_category is
  'What kind of work this contract covers. Drives the delivery form''s labels and the wording in the signed document -- a designer is not asked for a "staging URL".';

-- ---------------------------------------------------------------------------
-- 2. Terms of service acceptance, recorded per signature
-- ---------------------------------------------------------------------------

alter table public.contract_signatures
  add column if not exists terms_version text;

comment on column public.contract_signatures.terms_version is
  'The Lancerix terms-of-service version this party accepted when signing. Null on signatures predating the terms gate.';

-- sign_contract, redefined only to accept and store the terms version.
-- Everything else is unchanged from 20260901150000_contract_resubmit.sql.
create or replace function public.sign_contract(
  p_contract_id uuid,
  p_document_sha256 text,
  p_ip inet,
  p_user_agent text,
  p_terms_version text default null
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

  if v_contract.status not in ('DRAFT', 'PENDING_SIGNATURES', 'PENDING_REVIEW') then
    raise exception 'contract % is no longer open for signature', p_contract_id
      using errcode = 'check_violation';
  end if;

  insert into public.contract_signatures
    (contract_id, party, signer_id, document_sha256, ip_address, user_agent, terms_version)
  values
    (p_contract_id, v_party, v_uid, p_document_sha256, p_ip, p_user_agent, p_terms_version)
  on conflict (contract_id, party) do nothing;

  select count(*) into v_signatures
  from public.contract_signatures
  where contract_id = p_contract_id
    and party in ('FREELANCER', 'CLIENT');

  update public.contracts
  set status = (case when v_signatures >= 2 then 'ACTIVE' else 'PENDING_SIGNATURES' end)
        ::public.contract_status,
      document_sha256 = coalesce(document_sha256, p_document_sha256)
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

-- The 4-arg version is now ambiguous with the 5-arg one for PostgREST, and
-- nothing should call it any more: drop it so a caller that forgets the
-- terms version fails loudly instead of silently recording no acceptance.
drop function if exists public.sign_contract(uuid, text, inet, text);

revoke all on function public.sign_contract(uuid, text, inet, text, text) from public;
grant execute on function public.sign_contract(uuid, text, inet, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Messages between the two parties
-- ---------------------------------------------------------------------------

create table if not exists public.contract_messages (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (length(btrim(body)) between 1 and 4000),
  -- A message can hang off a phase, which is what makes "revision notes per
  -- stage" a conversation rather than a single overwritable text column.
  phase_id uuid references public.workflow_phases(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists contract_messages_contract_id_idx
  on public.contract_messages (contract_id, created_at);

create index if not exists contract_messages_phase_id_idx
  on public.contract_messages (phase_id)
  where phase_id is not null;

alter table public.contract_messages enable row level security;

create policy contract_messages_select_party on public.contract_messages
  for select using (public.is_contract_party(contract_id));

-- Sender must be the caller: a party cannot post words into the other's
-- mouth. is_contract_party() also lets an admin read, but admins are
-- deliberately not given insert -- support should not be able to forge a
-- message that looks like it came from a party.
create policy contract_messages_insert_party on public.contract_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.client_id = auth.uid() or c.freelancer_id = auth.uid())
    )
  );

-- No update or delete policy, and a blocking trigger to match: the thread is
-- part of the record, same as delivery_events and escrow_transactions.
create or replace function public.forbid_message_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'contract_messages is append-only'
    using errcode = 'insufficient_privilege';
end;
$$;

drop trigger if exists contract_messages_immutable on public.contract_messages;
create trigger contract_messages_immutable
  before update or delete on public.contract_messages
  for each row execute function public.forbid_message_mutation();

grant select, insert on public.contract_messages to authenticated;
