-- 20260901070000_public_ids.sql redefined party_display_names() to add
-- public_id, but dropped the party check in the process. The function is
-- SECURITY DEFINER (it bypasses RLS by design, the same reason profiles is
-- readable only by its owner: a party who cannot see a counterparty's row
-- directly still needs their name). Without the check, ANY authenticated
-- caller could pass any array of profile ids and get back the full_name and
-- public_id of every one of them -- not just people they share a contract
-- with. The migration's own comment claimed this was "already handled by
-- existing party policies", which was not true: the query never checked.
--
-- Restores the original scope from 20260830200000_contract_party_details.sql
-- (self, admin, or a shared contract) with public_id added to the projection.

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
    );
$$;

comment on function public.party_display_names is
  'Names of contract counterparties, plus their public_id. Returns id, full_name and public_id only; the TCKN and IBAN on the same row are never selected. Scoped to self, admins, and shared-contract counterparties -- see 20260901110000 for why this check must never be dropped.';

revoke all on function public.party_display_names(uuid[]) from public;
grant execute on function public.party_display_names(uuid[]) to authenticated;
