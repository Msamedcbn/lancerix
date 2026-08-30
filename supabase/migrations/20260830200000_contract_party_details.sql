-- A contract could not display who it was with.
--
-- profiles is readable only by its owner and companies only by theirs, so
-- neither party could see the other's name, nor the freelancer the legal name
-- of the company they are invoicing. Widening those policies to "anyone I have
-- a contract with" is not an option: RLS grants a whole row, and the profiles
-- row carries the TCKN and the IBAN.
--
-- These two functions return columns instead of rows. They are scoped to
-- contracts the caller is actually a party to, and they return only what has to
-- appear on the contract itself. A TCKN or an IBAN can never come out of them,
-- because neither is selected.

-- Display names for the other side of a contract, plus the caller's own.
create or replace function public.party_display_names(p_ids uuid[])
returns table (id uuid, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name
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
  'Names of contract counterparties. Returns id and full_name only; the TCKN and IBAN on the same row are never selected.';

-- The billing entity on one contract, readable by either party to it.
create or replace function public.contract_company(p_contract_id uuid)
returns table (
  id uuid,
  legal_name text,
  vkn text,
  tax_office text,
  address text
)
language sql
stable
security definer
set search_path = public
as $$
  select co.id, co.legal_name, co.vkn, co.tax_office, co.address
  from public.contracts c
  join public.companies co on co.id = c.company_id
  where c.id = p_contract_id
    and (public.is_contract_party(p_contract_id) or public.is_admin());
$$;

comment on function public.contract_company is
  'Billing entity for one contract, for its parties. Everything returned is what appears on the invoice.';

revoke all on function public.party_display_names(uuid[]) from public;
grant execute on function public.party_display_names(uuid[]) to authenticated;

revoke all on function public.contract_company(uuid) from public;
grant execute on function public.contract_company(uuid) to authenticated;
