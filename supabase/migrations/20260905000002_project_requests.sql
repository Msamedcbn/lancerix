-- Client-initiated intake.
--
-- Until now every contract started with the freelancer: createContract is
-- FREELANCER-only and every client route is read-or-approve. A client who
-- found Lancerix and wanted to use it with the developer they already work
-- with had no way in -- which is backwards, because the client is the paying
-- side (the platform fee is charged to them, and they pick the QA tier before
-- signing). The empty state said it out loud: "Bir freelancer seninle
-- sözleşme paylaştığında burada görünür."
--
-- This is NOT a job board, and the shape enforces that:
--
--   * A request is ADDRESSED. One freelancer, by Lancerix public id or by a
--     single email address. There is no listing, no broadcast, no audience.
--   * There is no discovery. No directory, no search, no ranking -- the same
--     rule /profile/[publicId] already follows: you reach someone only if you
--     already know who they are.
--   * There is no bidding. One request, one counterparty, and it ends in
--     exactly one of: converted to a contract, or declined.
--   * Rate limited, because "addressed" alone does not stop someone sending
--     the same brief to fifty people one at a time.
--
-- If any of those four stop being true, this table has become a marketplace
-- and the product has changed. They are load-bearing, not decoration.

create type public.project_request_status as enum ('OPEN', 'CONVERTED', 'DECLINED');

create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,

  -- Exactly one of these addresses the freelancer: an existing account, or an
  -- email that claim_invited_request() attaches once that address is behind a
  -- confirmed session. Mirrors how contracts address an un-registered client.
  freelancer_id uuid references public.profiles(id) on delete set null,
  freelancer_email text not null default '',

  title text not null check (length(btrim(title)) between 3 and 200),
  brief text not null check (length(btrim(brief)) between 20 and 4000),

  -- Kurus, like every other amount in this schema -- never a float. A range
  -- rather than one figure because at this stage the client is describing a
  -- budget, not agreeing to a price; the contract amount is set later, by the
  -- freelancer, in the wizard.
  budget_min_kurus bigint check (budget_min_kurus is null or budget_min_kurus >= 0),
  budget_max_kurus bigint check (budget_max_kurus is null or budget_max_kurus >= 0),

  status public.project_request_status not null default 'OPEN',
  decline_reason text check (decline_reason is null or length(btrim(decline_reason)) between 1 and 1000),

  -- Set when the freelancer turns this into a real contract, so the request
  -- and the contract it produced stay linked in the record.
  contract_id uuid references public.contracts(id) on delete set null,

  created_at timestamptz not null default now(),
  decided_at timestamptz,

  constraint project_requests_addressed check (
    freelancer_id is not null or btrim(freelancer_email) <> ''
  ),
  constraint project_requests_budget_order check (
    budget_min_kurus is null
    or budget_max_kurus is null
    or budget_min_kurus <= budget_max_kurus
  ),
  constraint project_requests_decided check (
    (status = 'OPEN' and decided_at is null)
    or (status <> 'OPEN' and decided_at is not null)
  ),
  constraint project_requests_declined_has_reason check (
    status <> 'DECLINED' or decline_reason is not null
  ),
  constraint project_requests_converted_has_contract check (
    status <> 'CONVERTED' or contract_id is not null
  )
);

create index if not exists project_requests_freelancer_idx
  on public.project_requests (freelancer_id, status, created_at desc)
  where freelancer_id is not null;

create index if not exists project_requests_client_idx
  on public.project_requests (client_id, created_at desc);

-- Lowercased so the claim path can find an invite by address without a scan.
create index if not exists project_requests_email_idx
  on public.project_requests (lower(freelancer_email))
  where freelancer_id is null and btrim(freelancer_email) <> '';

alter table public.project_requests enable row level security;

-- Either party to the request can read it. Deliberately no policy that lets a
-- freelancer browse requests addressed to anyone else -- that would be the
-- job board this is not.
create policy project_requests_select_party on public.project_requests
  for select using (
    client_id = auth.uid() or freelancer_id = auth.uid()
  );

-- No insert/update/delete policies: every write goes through the functions
-- below, which enforce the role check, the rate limit and the state machine.
-- A policy would let a client set status = 'CONVERTED' by hand.

-- ---------------------------------------------------------------------------
-- create_project_request
-- ---------------------------------------------------------------------------

/**
 * How many open requests one client may have created in the last day.
 *
 * The point is not to ration honest use -- a client with five live briefs is
 * already unusual. It is that "addressed, one at a time" is only a real
 * constraint if sending fifty of them costs something.
 */
create or replace function public.create_project_request(
  p_freelancer_public_id text default null,
  p_freelancer_email text default null,
  p_title text default null,
  p_brief text default null,
  p_budget_min_kurus bigint default null,
  p_budget_max_kurus bigint default null
)
returns public.project_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_freelancer_id uuid;
  v_email text := lower(btrim(coalesce(p_freelancer_email, '')));
  v_recent int;
  v_request public.project_requests;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;

  select role into v_role from public.profiles where id = v_uid;
  if v_role is distinct from 'CLIENT' then
    raise exception 'only a client can open a project request'
      using errcode = 'insufficient_privilege';
  end if;

  -- Addressed to exactly one freelancer, one way or the other.
  if (p_freelancer_public_id is null or btrim(p_freelancer_public_id) = '')
     and v_email = '' then
    raise exception 'a request must name one freelancer'
      using errcode = 'check_violation';
  end if;

  if p_freelancer_public_id is not null and btrim(p_freelancer_public_id) <> ''
     and v_email <> '' then
    raise exception 'name the freelancer by id or by email, not both'
      using errcode = 'check_violation';
  end if;

  if p_freelancer_public_id is not null and btrim(p_freelancer_public_id) <> '' then
    select id into v_freelancer_id
    from public.profiles
    where public_id = upper(btrim(p_freelancer_public_id));

    if v_freelancer_id is null then
      raise exception 'no account with that Lancerix ID'
        using errcode = 'no_data_found';
    end if;

    if v_freelancer_id = v_uid then
      raise exception 'cannot address a request to yourself'
        using errcode = 'check_violation';
    end if;

    if (select role from public.profiles where id = v_freelancer_id) is distinct from 'FREELANCER' then
      raise exception 'that account is not registered as a freelancer'
        using errcode = 'check_violation';
    end if;
  end if;

  select count(*) into v_recent
  from public.project_requests
  where client_id = v_uid
    and created_at > now() - interval '24 hours';

  if v_recent >= 5 then
    raise exception 'too many project requests in the last 24 hours'
      using errcode = 'check_violation';
  end if;

  insert into public.project_requests (
    client_id, freelancer_id, freelancer_email,
    title, brief, budget_min_kurus, budget_max_kurus
  )
  values (
    v_uid,
    v_freelancer_id,
    case when v_freelancer_id is null then v_email else '' end,
    btrim(p_title),
    btrim(p_brief),
    p_budget_min_kurus,
    p_budget_max_kurus
  )
  returning * into v_request;

  return v_request;
end;
$$;

revoke all on function public.create_project_request(text, text, text, text, bigint, bigint) from public;
grant execute on function public.create_project_request(text, text, text, text, bigint, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- decline_project_request
-- ---------------------------------------------------------------------------

-- The freelancer's "no". A request that can only be accepted is a request the
-- recipient cannot get out of their queue, which is how an inbox turns into
-- something people stop opening.
create or replace function public.decline_project_request(
  p_request_id uuid,
  p_reason text
)
returns public.project_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_request public.project_requests;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  select * into v_request from public.project_requests where id = p_request_id for update;
  if not found then
    raise exception 'request % not found', p_request_id using errcode = 'no_data_found';
  end if;

  if v_request.freelancer_id is distinct from v_uid then
    raise exception 'only the addressed freelancer can decline this request'
      using errcode = 'insufficient_privilege';
  end if;

  if v_request.status <> 'OPEN' then
    raise exception 'this request has already been answered'
      using errcode = 'check_violation';
  end if;

  if v_reason is null then
    raise exception 'a decline has to say why' using errcode = 'check_violation';
  end if;

  update public.project_requests
  set status = 'DECLINED', decline_reason = v_reason, decided_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

revoke all on function public.decline_project_request(uuid, text) from public;
grant execute on function public.decline_project_request(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- convert_project_request
-- ---------------------------------------------------------------------------

-- Called by createContract after the contract row exists, so the request and
-- the contract it produced stay linked. Separate from contract creation on
-- purpose: a contract that fails to link is still a valid contract, but a
-- request marked CONVERTED with no contract would be a lie about the record.
create or replace function public.convert_project_request(
  p_request_id uuid,
  p_contract_id uuid
)
returns public.project_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_request public.project_requests;
  v_contract public.contracts;
begin
  select * into v_request from public.project_requests where id = p_request_id for update;
  if not found then
    raise exception 'request % not found', p_request_id using errcode = 'no_data_found';
  end if;

  if v_request.freelancer_id is distinct from v_uid then
    raise exception 'only the addressed freelancer can convert this request'
      using errcode = 'insufficient_privilege';
  end if;

  if v_request.status <> 'OPEN' then
    raise exception 'this request has already been answered'
      using errcode = 'check_violation';
  end if;

  select * into v_contract from public.contracts where id = p_contract_id;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  -- The contract has to be the one this request asked for: same freelancer,
  -- same client. Without this, a converted request could point at an
  -- unrelated contract and the record would no longer explain itself.
  if v_contract.freelancer_id <> v_uid then
    raise exception 'that contract belongs to another freelancer'
      using errcode = 'insufficient_privilege';
  end if;

  if v_contract.client_id is distinct from v_request.client_id then
    raise exception 'that contract is not with the client who asked'
      using errcode = 'check_violation';
  end if;

  update public.project_requests
  set status = 'CONVERTED', contract_id = p_contract_id, decided_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

revoke all on function public.convert_project_request(uuid, uuid) from public;
grant execute on function public.convert_project_request(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- claim_invited_request
-- ---------------------------------------------------------------------------

-- The mirror of claim_invited_contract (20260903000000), for a freelancer who
-- was addressed by email before they had an account. Same shape, same
-- reasoning: idempotent, safe to call on every load, and it matches on the
-- confirmed address rather than trusting the caller.
create or replace function public.claim_invited_request(p_request_id uuid)
returns public.project_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.project_requests;
  v_uid uuid := auth.uid();
  v_email text;
begin
  select * into v_request from public.project_requests where id = p_request_id for update;
  if not found then
    raise exception 'request % not found', p_request_id using errcode = 'no_data_found';
  end if;

  if v_request.freelancer_id is not null then
    return v_request;
  end if;

  if v_request.client_id = v_uid then
    raise exception 'the client cannot claim their own request as the freelancer'
      using errcode = 'insufficient_privilege';
  end if;

  select email into v_email
  from auth.users
  where id = v_uid and email_confirmed_at is not null;

  if v_email is null or lower(v_email) <> lower(v_request.freelancer_email) then
    raise exception 'not the invited address for request %', p_request_id
      using errcode = 'insufficient_privilege';
  end if;

  update public.project_requests
  set freelancer_id = v_uid
  where id = p_request_id and freelancer_id is null
  returning * into v_request;

  if not found then
    select * into v_request from public.project_requests where id = p_request_id;
  end if;

  return v_request;
end;
$$;

revoke all on function public.claim_invited_request(uuid) from public;
grant execute on function public.claim_invited_request(uuid) to authenticated;

comment on table public.project_requests is
  'Client-initiated intake: one client asking one named freelancer to start a project. Addressed, never listed -- see the migration header for the four constraints that keep this from being a job board.';
