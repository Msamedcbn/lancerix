-- Second hotfix for 20260903000000/1. Confirmed by direct reproduction:
-- routing contracts_select_party through is_contract_party(id) (20260903000001's
-- fix for the auth.users permission error) broke INSERT ... RETURNING for a
-- freelancer creating their own contract -- "new row violates row-level
-- security policy for table contracts".
--
-- Root cause: is_contract_party() re-queries public.contracts by id. For an
-- INSERT ... RETURNING evaluated in the same statement, that self-referential
-- subquery does not reliably see the row still being inserted, even though a
-- bare column reference against the row being evaluated (client_id,
-- freelancer_id) does. Reproduced directly: a plain SELECT of
-- is_contract_party() against an already-committed row returns true; the same
-- call embedded in an INSERT...RETURNING's RLS check on the row it is
-- currently inserting fails.
--
-- The original (abandoned) 20260901030000 migration got this right by
-- duplicating the boolean logic inline with bare column comparisons instead
-- of a function call -- that is restored here. The auth.users confirmed-email
-- check (this migration's actual reason to exist, closing the Section 3
-- finding) is pulled into its own tiny helper with NO self-reference to
-- contracts, so it carries none of this risk either way.

create or replace function public.caller_email_confirmed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;

comment on function public.caller_email_confirmed is
  'Whether the calling session''s own auth.users row has a confirmed email. No self-reference to any other table -- safe to use from any RLS policy, including one evaluated mid-INSERT on the row it is currently inserting.';

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
        or public.is_admin()
        or (
          c.client_id is null
          and lower(c.client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          and coalesce(auth.jwt() ->> 'email', '') <> ''
          and public.caller_email_confirmed()
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
      and public.caller_email_confirmed()
    )
  );
