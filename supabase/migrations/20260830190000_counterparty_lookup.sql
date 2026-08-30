-- A freelancer could not create a contract, because the schema asked for two
-- identifiers RLS forbade them from ever seeing.
--
-- contracts_insert_freelancer requires client_id and company_id. profiles is
-- readable only by its owner, and companies only by theirs, so a freelancer had
-- no way to discover either. The insert policy described a flow the read
-- policies made impossible.
--
-- This is the narrowest opening that makes it work: an exact-email lookup that
-- returns the counterparty and the companies they own. It is deliberately not a
-- search -- no prefix, no partial match, no listing -- so it answers "does this
-- address have an account, and what may I bill" and nothing else. The address
-- has to be known already, which is the case: the freelancer is contracting
-- with someone they are already talking to.
--
-- What it exposes, and why that is acceptable: a full name, a role, and the
-- legal name plus VKN of the companies that account owns. A VKN is public
-- record in Turkey and a legal name is on every invoice the company issues.
-- Nothing here is private in the way a TCKN or an IBAN is, and neither of those
-- is returned.

create or replace function public.find_counterparty(p_email text)
returns table (
  id uuid,
  full_name text,
  role public.user_role,
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
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object(
                   'id', c.id,
                   'legal_name', c.legal_name,
                   'vkn', c.vkn
                 )
                 order by c.legal_name
               )
        from public.companies c
        where c.owner_id = p.id
      ),
      '[]'::jsonb
    ) as companies
  from public.profiles p
  where lower(p.email) = lower(btrim(p_email))
    -- Never resolve to the caller: a contract's two parties must differ, and
    -- contracts_distinct_parties would reject it anyway.
    and p.id <> auth.uid()
  limit 1;
$$;

comment on function public.find_counterparty is
  'Exact-email lookup of a contract counterparty and the companies they own. Not a search: no partial matching, one row, and only fields that are public record.';

revoke all on function public.find_counterparty(text) from public;
grant execute on function public.find_counterparty(text) to authenticated;
