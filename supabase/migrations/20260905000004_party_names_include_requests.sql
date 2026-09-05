-- Caught in browser verification of the project-request UI: a client who had
-- just sent a request saw "Geliştirici: Hesap oluşturulmadı" next to it, and
-- the freelancer would have seen the same blank on their side.
--
-- party_display_names() scopes name lookup to people you share a CONTRACT
-- with (20260901110000, which restored that check after it was dropped and is
-- emphatic that it must never be dropped again). A project request is not a
-- contract, so neither party could resolve the other's name -- on the one
-- screen whose entire job is "someone specific is asking you to work with
-- them".
--
-- Widened rather than worked around in the UI: a request IS a relationship
-- between two named accounts, and it is exactly the kind the function exists
-- to serve. The scope check stays a check -- self, admin, shared contract, or
-- now shared request -- so it still never returns a stranger.

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
  where p.id = any(p_ids)
    and (
      p.id = auth.uid()
      or public.is_admin()
      or exists (
        select 1
        from public.contracts c
        where (c.client_id = auth.uid() and c.freelancer_id = p.id)
           or (c.freelancer_id = auth.uid() and c.client_id = p.id)
      )
      or exists (
        select 1
        from public.project_requests r
        where (r.client_id = auth.uid() and r.freelancer_id = p.id)
           or (r.freelancer_id = auth.uid() and r.client_id = p.id)
      )
    );
$$;

comment on function public.party_display_names is
  'Names of counterparties on a shared contract or project request, plus their public_id. Returns id, full_name and public_id only; the TCKN and IBAN on the same row are never selected. Scoped to self, admins, and actual counterparties -- see 20260901110000 for why this check must never be dropped.';

revoke all on function public.party_display_names(uuid[]) from public;
grant execute on function public.party_display_names(uuid[]) to authenticated;
