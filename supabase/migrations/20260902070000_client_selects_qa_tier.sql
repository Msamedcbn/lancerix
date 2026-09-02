-- The client picks the QA tier (and, for Tier3/4, the reviewer) before
-- signing -- not the freelancer after delivery.
--
-- The freelancer being graded choosing how rigorously they get graded is a
-- conflict of interest. The client is the one buying assurance; they decide
-- what they're buying, the same moment they set the acceptance criteria.
-- Once set, it is fixed for the life of the contract -- a rejected delivery
-- is resubmitted against the same standard, not re-picked.

alter table public.contracts
  add column qa_tier text check (qa_tier in ('TIER1', 'TIER2', 'TIER3', 'TIER4')),
  add column qa_reviewer_id uuid references public.qa_reviewers(id),
  add column qa_fee_kurus bigint check (qa_fee_kurus is null or qa_fee_kurus >= 0);

comment on column public.contracts.qa_tier is
  'QA tier the client selected before signing (QA_ONLY contracts). Locked once a signature exists.';
comment on column public.contracts.qa_fee_kurus is
  'Reviewer''s rate_kurus snapshotted at selection time, same reasoning as platform_fee_bps/stopaj_bps -- a later change to the reviewer''s rate must not alter what was agreed.';

-- ---------------------------------------------------------------------------
-- set_qa_selection: the client's pre-signature choice
-- ---------------------------------------------------------------------------

create or replace function public.set_qa_selection(
  p_contract_id uuid,
  p_tier text,
  p_reviewer_id uuid default null
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_fee_kurus bigint := 0;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  if v_contract.client_id <> auth.uid() then
    raise exception 'only the client may set the QA selection' using errcode = 'insufficient_privilege';
  end if;

  if exists (select 1 from public.contract_signatures where contract_id = p_contract_id) then
    raise exception 'contract % already has a signature -- the QA selection is locked', p_contract_id
      using errcode = 'check_violation';
  end if;

  if p_tier not in ('TIER1', 'TIER2', 'TIER3', 'TIER4') then
    raise exception 'unknown QA tier %', p_tier using errcode = 'invalid_parameter_value';
  end if;

  if p_tier in ('TIER3', 'TIER4') then
    if p_reviewer_id is null then
      raise exception 'a reviewer is required for %', p_tier using errcode = 'invalid_parameter_value';
    end if;

    select rate_kurus into v_fee_kurus
    from public.qa_reviewers
    where id = p_reviewer_id and active;

    if not found then
      raise exception 'reviewer % not found or inactive', p_reviewer_id using errcode = 'no_data_found';
    end if;
    if v_fee_kurus is null then
      raise exception 'reviewer % has not set a fee yet', p_reviewer_id using errcode = 'check_violation';
    end if;
  end if;

  update public.contracts
  set qa_tier = p_tier,
      qa_reviewer_id = case when p_tier in ('TIER3', 'TIER4') then p_reviewer_id else null end,
      qa_fee_kurus = v_fee_kurus
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

revoke all on function public.set_qa_selection(uuid, text, uuid) from public;
grant execute on function public.set_qa_selection(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- sign_contract: also require a QA selection, same gate shape as criteria
-- ---------------------------------------------------------------------------

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

    if v_contract.qa_tier is null then
      raise exception 'contract % has no QA tier selected yet -- the client has to choose one before either party can sign', p_contract_id
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

-- ---------------------------------------------------------------------------
-- submit_qa_delivery: submitting IS choosing now, one transaction
-- ---------------------------------------------------------------------------
--
-- Replaces the freelancer's separate choose_qa_tier() call after delivery.
-- The tier/reviewer/fee are already fixed on the contract from signing time,
-- so this folds the old two-step (insert delivery, then transition +
-- qa_tier_orders insert) into one atomic function, using the pre-selected
-- values instead of ones passed in by the caller.

create or replace function public.submit_qa_delivery(
  p_contract_id uuid,
  p_staging_url text,
  p_pr_url text default null,
  p_notes text default null
)
returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_delivery public.deliveries;
  v_target public.delivery_status;
  v_payment_status text;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  if v_contract.freelancer_id <> auth.uid() then
    raise exception 'only the freelancer may submit a delivery' using errcode = 'insufficient_privilege';
  end if;

  if v_contract.qa_tier is null then
    raise exception 'contract % has no QA tier selected', p_contract_id using errcode = 'check_violation';
  end if;

  insert into public.deliveries (contract_id, submitted_by, staging_url, pr_url, notes)
  values (p_contract_id, auth.uid(), p_staging_url, p_pr_url, p_notes)
  returning * into v_delivery;

  v_target := case when v_contract.qa_tier = 'TIER1' then 'AWAITING_CLIENT' else 'QA_QUEUED' end;
  v_delivery := public.transition_delivery(
    v_delivery.id,
    v_target,
    format('%s paketi (sözleşmede önceden seçilmiş)', v_contract.qa_tier)
  );

  v_payment_status := case when coalesce(v_contract.qa_fee_kurus, 0) > 0 then 'PENDING' else 'WAIVED' end;

  insert into public.qa_tier_orders (delivery_id, tier, fee_kurus, payment_status, reviewer_id)
  values (v_delivery.id, v_contract.qa_tier, coalesce(v_contract.qa_fee_kurus, 0), v_payment_status, v_contract.qa_reviewer_id);

  return v_delivery;
end;
$$;

revoke all on function public.submit_qa_delivery(uuid, text, text, text) from public;
grant execute on function public.submit_qa_delivery(uuid, text, text, text) to authenticated;
