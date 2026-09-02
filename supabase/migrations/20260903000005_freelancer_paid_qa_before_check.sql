-- Faz E item #4 follow-up: the pre-selection hint ("this would be free")
-- needs to check whether the FREELANCER has ever had a paid Tier 1/2
-- selection, but the page is rendered for the CLIENT (side === "client",
-- pre-signature) -- and RLS correctly does not let a client see a
-- freelancer's OTHER contracts with other clients. A security-definer
-- function that returns only a boolean (never row data) is the standard,
-- narrow way to answer this without widening contracts' RLS.

create or replace function public.freelancer_has_paid_qa_before(
  p_freelancer_id uuid,
  p_exclude_contract_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.contracts c
    where c.freelancer_id = p_freelancer_id
      and (p_exclude_contract_id is null or c.id <> p_exclude_contract_id)
      and coalesce(c.qa_fee_kurus, 0) > 0
  );
$$;

revoke all on function public.freelancer_has_paid_qa_before(uuid, uuid) from public;
grant execute on function public.freelancer_has_paid_qa_before(uuid, uuid) to authenticated;

comment on function public.freelancer_has_paid_qa_before is
  'Whether this freelancer has ever had a contract with a non-zero qa_fee_kurus. Used only to show/hide the first-contract-free hint before a client commits to a Tier 1/2 selection -- returns a boolean only, never contract data, so it is safe for a client to call about a freelancer they are not yet contractually tied to on other contracts.';
