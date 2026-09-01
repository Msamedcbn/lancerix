-- Closes the REVISION_REQUESTED dead end.
--
-- request_revision() moves a contract to REVISION_REQUESTED but nothing ever
-- moved it back out -- no code path existed for the freelancer to say "I've
-- addressed this, please look again". A client asking for a revision made the
-- contract permanently unsignable.
--
-- resubmit_contract() closes the loop: REVISION_REQUESTED -> PENDING_REVIEW,
-- the one enum value contract_lifecycle.sql declared but never assigned.
-- PENDING_REVIEW distinguishes "this is a revised resubmission" from a fresh
-- DRAFT so the client's status badge tells the true story. sign_contract() is
-- extended to accept it as a valid starting point, same as DRAFT.
--
-- This does not add a contract-terms editor. What the freelancer actually
-- changes in response to a revision request is out of scope here -- this
-- only unblocks the state machine so a resubmission has somewhere to go.

create or replace function public.resubmit_contract(p_contract_id uuid)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_uid uuid := auth.uid();
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  if v_contract.freelancer_id <> v_uid then
    raise exception 'only the freelancer may resubmit a contract'
      using errcode = 'insufficient_privilege';
  end if;

  if v_contract.status <> 'REVISION_REQUESTED' then
    raise exception 'contract % is not awaiting resubmission (status %)', p_contract_id, v_contract.status
      using errcode = 'check_violation';
  end if;

  update public.contracts
  set status = 'PENDING_REVIEW'
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

revoke all on function public.resubmit_contract(uuid) from public;
grant execute on function public.resubmit_contract(uuid) to authenticated;

-- sign_contract, redefined only to accept PENDING_REVIEW as an open-for-
-- signature status alongside DRAFT and PENDING_SIGNATURES. Everything else
-- is unchanged from 20260830210000_signing_and_objection_clock.sql.
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

  if v_contract.status not in ('DRAFT', 'PENDING_SIGNATURES', 'PENDING_REVIEW') then
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
