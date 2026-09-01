-- Unique, human-readable public IDs for profiles and companies.
--
-- Every user and company gets an 8-character uppercase alphanumeric ID
-- generated at signup. This is what parties exchange to find each other,
-- replacing the email-based lookup entirely.

-- ---------------------------------------------------------------------------
-- profiles.public_id
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists public_id text;

-- Backfill existing rows
update public.profiles
set public_id = upper(substr(md5(id::text || extract(epoch from created_at)::text), 1, 8))
where public_id is null;

alter table public.profiles
  alter column public_id set not null;

-- The index must be created separately so IF NOT EXISTS works.
create unique index if not exists profiles_public_id_key on public.profiles (public_id);

-- ---------------------------------------------------------------------------
-- companies.public_id
-- ---------------------------------------------------------------------------

alter table public.companies
  add column if not exists public_id text;

update public.companies
set public_id = upper(substr(md5(id::text || extract(epoch from created_at)::text), 1, 8))
where public_id is null;

alter table public.companies
  alter column public_id set not null;

create unique index if not exists companies_public_id_key on public.companies (public_id);

-- ---------------------------------------------------------------------------
-- Generate a unique public_id for new users (update handle_new_user)
-- ---------------------------------------------------------------------------

create or replace function public.generate_public_id()
returns text
language plpgsql
as $$
declare
  candidate text;
  attempts integer := 0;
begin
  loop
    candidate := upper(substr(md5(gen_random_uuid()::text), 1, 8));
    -- Make sure it doesn't collide (astronomically unlikely but safe)
    if not exists (select 1 from public.profiles where public_id = candidate)
       and not exists (select 1 from public.companies where public_id = candidate) then
      return candidate;
    end if;
    attempts := attempts + 1;
    if attempts > 10 then
      raise exception 'could not generate unique public_id after 10 attempts';
    end if;
  end loop;
end;
$$;

-- Replace handle_new_user to include public_id generation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, public_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data ->> 'role' = 'CLIENT' then 'CLIENT'::public.user_role
      else 'FREELANCER'::public.user_role
    end,
    public.generate_public_id()
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- find_by_public_id: replaces find_counterparty (email-based)
-- ---------------------------------------------------------------------------

create or replace function public.find_by_public_id(p_public_id text)
returns table (
  id uuid,
  full_name text,
  role public.user_role,
  public_id text,
  companies jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.role,
    p.public_id,
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object(
                   'id', c.id,
                   'legal_name', c.legal_name,
                   'vkn', c.vkn,
                   'public_id', c.public_id
                 )
                 order by c.legal_name
               )
        from public.companies c
        where c.owner_id = p.id
      ),
      '[]'::jsonb
    ) as companies
  from public.profiles p
  where upper(btrim(p.public_id)) = upper(btrim(p_public_id))
    and p.id <> auth.uid()
  limit 1;
$$;

comment on function public.find_by_public_id is
  'Look up a user by their public ID. Returns profile + companies. Used for contract counterparty search.';

revoke all on function public.find_by_public_id(text) from public;
grant execute on function public.find_by_public_id(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: allow authenticated users to see public_id of profiles they share a
-- contract with (already handled by existing party policies)
-- ---------------------------------------------------------------------------

-- party_display_names return type changed (added public_id), so we must drop first
drop function if exists public.party_display_names(uuid[]);

create function public.party_display_names(p_ids uuid[])
returns table (id uuid, full_name text, public_id text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.public_id
  from public.profiles p
  where p.id = any(p_ids);
$$;

revoke all on function public.party_display_names(uuid[]) from public;
grant execute on function public.party_display_names(uuid[]) to authenticated;
