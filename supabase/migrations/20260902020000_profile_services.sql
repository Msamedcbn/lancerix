-- Hizmetler: a structured, categorized alternative to the free-text skills
-- tags, so a profile can say "I do frontend geliştirme and web sitesi
-- kurulumu" as selectable facts rather than whatever words someone typed.
-- Values are validated against SERVICE_CATALOG in
-- src/lib/validations/services.ts, not an enum here -- the catalog changes
-- more often than a migration should.

alter table public.profiles
  add column if not exists services text[] not null default '{}';

comment on column public.profiles.services is
  'Selected service tags from SERVICE_CATALOG (src/lib/validations/services.ts), grouped by project category. Validated in TypeScript, not a DB enum, so the catalog can grow without a migration.';

-- Postgres refuses CREATE OR REPLACE when the OUT parameter list changes
-- (adding `services` here), so the old signature has to go first.
drop function if exists public.public_profile(text);

create function public.public_profile(p_public_id text)
returns table (
  public_id text,
  full_name text,
  role public.user_role,
  headline text,
  bio text,
  skills text[],
  services text[],
  location text,
  website_url text,
  created_at timestamptz,
  completed_contracts bigint,
  companies jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.public_id,
    p.full_name,
    p.role,
    p.headline,
    p.bio,
    p.skills,
    p.services,
    p.location,
    p.website_url,
    p.created_at,
    (
      select count(*)
      from public.contracts c
      where (c.freelancer_id = p.id or c.client_id = p.id)
        and c.status = 'FULFILLED'
    ) as completed_contracts,
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object('id', co.id, 'legal_name', co.legal_name)
                 order by co.legal_name
               )
        from public.companies co
        where co.owner_id = p.id
      ),
      '[]'::jsonb
    ) as companies
  from public.profiles p
  where upper(btrim(p.public_id)) = upper(btrim(p_public_id))
  limit 1;
$$;

revoke all on function public.public_profile(text) from public;
grant execute on function public.public_profile(text) to anon, authenticated;
