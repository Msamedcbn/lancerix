-- Faz E item #2 (accepted expansion, 2026-09-03 CEO strategy review): a
-- homepage counter of accepted deliveries, as social proof from real usage
-- data instead of an invented claim.
--
-- deliveries has RLS on (party-only), and the landing page is visited by
-- anonymous, unauthenticated users -- a plain count query would return 0
-- for them regardless of the real number. This returns only an aggregate
-- count, never a row, so it's safe to grant to anon: it cannot be used to
-- enumerate or infer anything about a specific delivery or contract.

create or replace function public.public_verified_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.deliveries where status = 'ACCEPTED';
$$;

revoke all on function public.public_verified_count() from public;
grant execute on function public.public_verified_count() to anon, authenticated;

comment on function public.public_verified_count is
  'Count of ACCEPTED deliveries, for the public homepage counter. Aggregate only -- never returns row data, safe to grant to anon.';
