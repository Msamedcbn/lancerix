-- Faz 1b: a contract can be drafted before the other side has an account, and
-- an acceptance criterion is machine-readable rather than free prose.
--
-- Two problems, one migration, because they are the same problem: the contract
-- shape was inherited from escrow and it asks for things a QA-only contract
-- has no use for.
--
-- 1. COLD START. contracts.client_id and company_id were both NOT NULL, so a
--    freelancer could not draft a contract until the client had (a) registered
--    and (b) added a company with a valid VKN. The freelancer's own work was
--    blocked on someone else's homework. Now the contract carries the client's
--    email, client_id stays null until they register, and the row attaches
--    itself on sign-up.
--
-- 2. UNRUNNABLE CRITERIA. acceptance_criteria.check_type accepted five values
--    but check_config was a free-form jsonb with no shape, and the app wrote
--    'MANUAL' for everything. Tier 2 (the Playwright agent) cannot run a
--    sentence. A criterion now has to carry the fields its type needs, checked
--    in Postgres so a bad row cannot exist -- mirrored by Zod in
--    src/lib/validations/acceptance-criteria.ts.

-- ---------------------------------------------------------------------------
-- 1. Invite by email
-- ---------------------------------------------------------------------------

alter table public.contracts
  alter column client_id drop not null,
  alter column company_id drop not null;

alter table public.contracts
  add column client_email text not null default ''
    check (client_email = '' or client_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- Backfill from the profile each existing contract already points at, so the
-- column is true for rows that predate it before the default is dropped.
update public.contracts c
set client_email = p.email
from public.profiles p
where p.id = c.client_id and c.client_email = '';

alter table public.contracts
  alter column client_email drop default;

comment on column public.contracts.client_email is
  'The client side of the contract, by address. Always set. client_id is null until that address registers, at which point handle_new_user() attaches the row.';

-- A freelancer inviting their own address would produce a contract with one
-- party, which contracts_distinct_parties cannot catch while client_id is null.
create or replace function public.contract_parties_differ(
  p_client_id uuid,
  p_freelancer_id uuid,
  p_client_email text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p_client_id, '00000000-0000-0000-0000-000000000000'::uuid) <> p_freelancer_id
     and not exists (
       select 1 from public.profiles p
       where p.id = p_freelancer_id
         and lower(p.email) = lower(btrim(p_client_email))
     );
$$;

alter table public.contracts
  add constraint contracts_distinct_parties_by_email
  check (public.contract_parties_differ(client_id, freelancer_id, client_email));

create index contracts_client_email_idx
  on public.contracts (lower(client_email))
  where client_id is null;

-- An unclaimed contract is visible to the address it names. Scoped to
-- client_id IS NULL so this can never widen access to a claimed contract:
-- once claimed, the client_id branch is the only one that applies.
create or replace function public.is_contract_party(p_contract_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.contracts c
    where c.id = p_contract_id
      and (
        c.client_id = auth.uid()
        or c.freelancer_id = auth.uid()
        or (
          c.client_id is null
          and lower(c.client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          and coalesce(auth.jwt() ->> 'email', '') <> ''
        )
      )
  );
$$;

drop policy if exists contracts_select_party on public.contracts;

create policy contracts_select_party on public.contracts
  for select using (
    client_id = auth.uid()
    or freelancer_id = auth.uid()
    or public.is_admin()
    or (
      client_id is null
      and lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and coalesce(auth.jwt() ->> 'email', '') <> ''
    )
  );

-- Sign-up attaches every contract already addressed to this person. Runs
-- inside handle_new_user() so there is no window where a freshly registered
-- client cannot see the contract that invited them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data ->> 'role' = 'CLIENT' then 'CLIENT'::public.user_role
      else 'FREELANCER'::public.user_role
    end
  );

  update public.contracts
  set client_id = new.id
  where client_id is null
    and lower(client_email) = lower(new.email)
    -- Never attach someone to a contract they drafted themselves.
    and freelancer_id <> new.id;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Structured acceptance criteria
-- ---------------------------------------------------------------------------

-- Each check_type needs its own fields. The shape lives here as well as in Zod
-- so a row written by anything other than the app is still well-formed. MANUAL
-- is the escape hatch: a human reads it, so it carries no config.
create or replace function public.criterion_config_valid(
  p_check_type text,
  p_config jsonb
)
returns boolean
language sql
immutable
parallel safe
as $$
  select case p_check_type
    when 'HTTP_STATUS' then
      (p_config ->> 'url') ~ '^https?://'
      and (p_config ->> 'expectedStatus') ~ '^[1-5][0-9]{2}$'
    when 'FORM_SUBMIT' then
      (p_config ->> 'url') ~ '^https?://'
      and length(btrim(coalesce(p_config ->> 'selector', ''))) between 1 and 200
    when 'RESPONSIVE_BREAKPOINT' then
      (p_config ->> 'url') ~ '^https?://'
      and (p_config ->> 'width') ~ '^[0-9]{3,4}$'
    when 'BUTTON_ACTION' then
      (p_config ->> 'url') ~ '^https?://'
      and length(btrim(coalesce(p_config ->> 'label', ''))) between 1 and 200
    when 'MANUAL' then
      true
    else false
  end;
$$;

comment on function public.criterion_config_valid is
  'Shape of check_config per check_type. Mirrors acceptanceCriterionDraftSchema in src/lib/validations/acceptance-criteria.ts -- change both together.';

-- Existing rows were all written as MANUAL with an empty config, which the
-- function accepts, so no backfill is needed.
alter table public.acceptance_criteria
  add constraint acceptance_criteria_config_shape
  check (public.criterion_config_valid(check_type, check_config));
