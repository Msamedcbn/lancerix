-- sign_contract() failed every call with "column status is of type
-- contract_status but expression is of type text": the CASE branches were
-- bare string literals ('ACTIVE' / 'PENDING_SIGNATURES'), which Postgres
-- resolves to text, and an UPDATE ... SET does not implicitly cast that to
-- the enum column. This is the same class of bug as
-- 20260830160000_optional_tckn_check.sql -- caught this time by actually
-- clicking "Sözleşmeyi imzala" rather than only unit-testing the pieces
-- around it. No contract could ever reach PENDING_SIGNATURES/ACTIVE before
-- this fix.
--
-- 20260830210000_signing_and_objection_clock.sql carries the same corrected
-- cast, so a database created from scratch is right from the start; this
-- migration brings an already-deployed one to the same state.

create or replace function public.sign_contract(
  p_contract_id uuid,
  p_document_sha256 text,
  p_ip inet,
  p_user_agent text
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

  if v_contract.status not in ('DRAFT', 'PENDING_SIGNATURES') then
    raise exception 'contract % is no longer open for signature', p_contract_id
      using errcode = 'check_violation';
  end if;

  insert into public.contract_signatures
    (contract_id, party, signer_id, document_sha256, ip_address, user_agent)
  values
    (p_contract_id, v_party, v_uid, p_document_sha256, p_ip, p_user_agent)
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
