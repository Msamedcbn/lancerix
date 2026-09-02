-- Acceptance criteria move from the freelancer to the client.
--
-- The freelancer proposing what "done" means for the client's own money was
-- backwards: the client is the one who can be blindsided by a green QA
-- result that isn't the outcome they actually wanted. The freelancer still
-- writes the contract (title, scope, phases); the client now writes the
-- acceptance criteria before either party signs, and sign_contract() refuses
-- to let anyone sign a QA_ONLY contract with none.

drop policy if exists acceptance_criteria_insert on public.acceptance_criteria;

create policy acceptance_criteria_insert on public.acceptance_criteria
  for insert with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.client_id = auth.uid()
    )
    and not exists (
      select 1 from public.contract_signatures s where s.contract_id = acceptance_criteria.contract_id
    )
  );

-- The client's submission replaces the set (delete-then-insert), so a delete
-- policy is needed too -- scoped identically, so a criterion cannot be
-- removed once either party has signed.
create policy acceptance_criteria_client_delete on public.acceptance_criteria
  for delete using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.client_id = auth.uid()
    )
    and not exists (
      select 1 from public.contract_signatures s where s.contract_id = acceptance_criteria.contract_id
    )
  );

create or replace function public.sign_contract(
  p_contract_id uuid,
  p_document_sha256 text,
  p_ip inet,
  p_user_agent text,
  p_terms_version text default null
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_party public.contract_party;
  v_uid uuid := auth.uid();
  v_signatures integer;
  v_criteria_count integer;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  if v_contract.freelancer_id = v_uid then
    v_party := 'FREELANCER';
  elsif v_contract.client_id = v_uid then
    v_party := 'CLIENT';
  else
    raise exception 'not a party to contract %', p_contract_id
      using errcode = 'insufficient_privilege';
  end if;

  if v_contract.status not in ('DRAFT', 'PENDING_SIGNATURES', 'PENDING_REVIEW') then
    raise exception 'contract % is no longer open for signature', p_contract_id
      using errcode = 'check_violation';
  end if;

  if v_contract.product_type = 'QA_ONLY' then
    select count(*) into v_criteria_count
    from public.acceptance_criteria
    where contract_id = p_contract_id;

    if v_criteria_count = 0 then
      raise exception 'contract % has no acceptance criteria yet -- the client has to set these before either party can sign', p_contract_id
        using errcode = 'check_violation';
    end if;
  end if;

  insert into public.contract_signatures
    (contract_id, party, signer_id, document_sha256, ip_address, user_agent, terms_version)
  values
    (p_contract_id, v_party, v_uid, p_document_sha256, p_ip, p_user_agent, p_terms_version)
  on conflict (contract_id, party) do nothing;

  select count(*) into v_signatures
  from public.contract_signatures
  where contract_id = p_contract_id
    and party in ('FREELANCER', 'CLIENT');

  update public.contracts
  set status = (case when v_signatures >= 2 then 'ACTIVE' else 'PENDING_SIGNATURES' end)
        ::public.contract_status,
      document_sha256 = coalesce(document_sha256, p_document_sha256)
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;
