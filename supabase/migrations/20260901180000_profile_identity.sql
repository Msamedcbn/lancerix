-- A profile was a name and an 8-character code. That is enough to be looked
-- up by a counterparty and not enough to be chosen by one.
--
-- Everything a freelancer would use to say "this is what I do" -- a headline,
-- a bio, what they work on, where they are -- had nowhere to live, so the
-- public profile page rendered a name over an empty grid. These columns are
-- what makes that page worth linking to.

alter table public.profiles
  add column if not exists headline text
    check (headline is null or length(btrim(headline)) between 2 and 120),
  add column if not exists bio text
    check (bio is null or length(btrim(bio)) <= 2000),
  add column if not exists skills text[] not null default '{}',
  add column if not exists location text
    check (location is null or length(btrim(location)) <= 120),
  add column if not exists website_url text
    check (website_url is null or website_url ~ '^https?://');

comment on column public.profiles.headline is
  'One line under the name: "Kıdemli Video Editörü". What a counterparty reads before deciding to keep reading.';
comment on column public.profiles.skills is
  'Free-text tags. Not an enum on purpose -- the point of the category work is that this platform is not only for developers.';

-- ---------------------------------------------------------------------------
-- Reading a profile publicly, without the service role
-- ---------------------------------------------------------------------------
--
-- The public profile page used createAdminClient() with a hand-written column
-- allow-list, because profiles RLS is self-or-admin only. That works, but it
-- puts the service-role key on an unauthenticated route, where the only thing
-- standing between a stranger and a TCKN is that allow-list staying correct
-- forever. A security-definer function moves that guarantee into the database:
-- the columns a stranger can read are the columns this function returns, and
-- there is no key involved.

create or replace function public.public_profile(p_public_id text)
returns table (
  public_id text,
  full_name text,
  role public.user_role,
  headline text,
  bio text,
  skills text[],
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

comment on function public.public_profile is
  'Everything a stranger may see about a profile, and nothing else. Deliberately omits email, tckn and iban -- the omission is the security boundary, which is why this returns named columns rather than a row.';

revoke all on function public.public_profile(text) from public;
-- anon too: the profile page is reachable without signing in, which is the
-- point of a public ID you can paste to someone.
grant execute on function public.public_profile(text) to anon, authenticated;
