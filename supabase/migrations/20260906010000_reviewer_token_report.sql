-- 2026-09-06 CEO + eng review ("four-role first-user audit"), Finding 1: a
-- Tier 3/4 reviewer has no login, no notification, and no way to submit a
-- report directly -- the admin is a permanent manual relay for both. This
-- closes that gap with the lightweight design the review settled on after
-- outside-voice review priced a full REVIEWER login role at XL (a new
-- Postgres enum value needs its own migration before anything can reference
-- it, plus re-deriving this codebase's contract-invite claim flow, which
-- already broke once in production): no new role, no new enum value, no new
-- RLS-readable columns on an existing party-visible table. A reviewer gets a
-- single-use, time-limited, unpredictable token by email instead.
--
-- The token lives in its OWN table with zero RLS policies (matching
-- contract_message_notices' "not something the sender's own session should
-- reach" pattern) -- qa_tier_orders is readable by both contract parties
-- (qa_tier_orders_select), so a write-capable token must never be a plain
-- column there or either party could read the other's reviewer's link.
--
-- The write path cannot be a plain SECURITY DEFINER function checking the
-- token alone, the way public_qa_report() checks share_token for a READ:
-- transition_delivery() gates every move on
-- v_is_client/v_is_freelancer/v_is_admin/v_is_system, computed from
-- auth.uid()/auth.role() -- a SECURITY DEFINER wrapper does not change what
-- those evaluate to for the calling session. The precedent this codebase
-- already uses for "a non-human caller needs to move a delivery" is
-- auth.role() = 'service_role' (v_is_system), first established here by the
-- Tier2 agent worker (see 20260902060000_fix_agent_escalation.sql). This
-- migration's submit_reviewer_report() is only ever granted to service_role
-- and must be called through src/lib/supabase/admin.ts's client, never a
-- normal session client -- the token check inside it is then the SOLE gate
-- (no user-identity check backs it up), which is why the token is also
-- single-use and 14-day-limited, not just unpredictable.

-- ---------------------------------------------------------------------------
-- qa_reviewers: profile_id becomes optional, plus a name/email a reviewer can
-- be reached at even when they have no Lancerix account yet.
-- ---------------------------------------------------------------------------

alter table public.qa_reviewers
  alter column profile_id drop not null,
  add column if not exists full_name text,
  add column if not exists email text;

alter table public.qa_reviewers
  add constraint qa_reviewers_identity_check
  check (profile_id is not null or (full_name is not null and email is not null));

comment on column public.qa_reviewers.full_name is
  'Only set when profile_id is null -- a reviewer added by email with no Lancerix account yet. When profile_id is set, the profile''s own name is authoritative and this stays null.';

comment on column public.qa_reviewers.email is
  'Only set when profile_id is null, for the same reason as full_name. Never shown to a client -- qa_reviewers_select''s column list for TierPicker never included contact info, and this does not change that.';

-- ---------------------------------------------------------------------------
-- qa_reports: which reviewer actually wrote this one, when it was a
-- token-authenticated submission rather than an admin's own account acting.
-- ---------------------------------------------------------------------------

alter table public.qa_reports
  add column if not exists reviewer_id uuid references public.qa_reviewers(id) on delete set null;

comment on column public.qa_reports.reviewer_id is
  'Set only by submit_reviewer_report() (the token path). Null for admin-entered reports (submit_qa_report), matching that path having no reviewer identity beyond the admin session itself.';

-- ---------------------------------------------------------------------------
-- qa_reviewer_tokens: the write-capable link, isolated from every RLS-visible
-- table on purpose.
-- ---------------------------------------------------------------------------

create table public.qa_reviewer_tokens (
  id uuid primary key default gen_random_uuid(),
  tier_order_id uuid not null references public.qa_tier_orders(id) on delete cascade,
  reviewer_id uuid not null references public.qa_reviewers(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index qa_reviewer_tokens_tier_order_id_idx on public.qa_reviewer_tokens (tier_order_id);

alter table public.qa_reviewer_tokens enable row level security;

-- No select/insert/update/delete policy at all: only a SECURITY DEFINER
-- function's owner (which bypasses RLS the same way every other function in
-- this file does) or a service-role connection may ever touch this table.
-- Neither contract party, and no plain authenticated user, gets a row here
-- under any policy -- that absence is the whole security property.

-- ---------------------------------------------------------------------------
-- _record_qa_report: the shared write both entry points call.
--
-- Extracted from the old submit_qa_report() body verbatim (same transition
-- sequence, same deadline math, same qa_reports insert) plus one addition:
-- p_reviewer_id, stamped on the report row when the caller is a reviewer
-- acting through their token rather than an admin.
-- ---------------------------------------------------------------------------

create or replace function public._record_qa_report(
  p_delivery_id uuid,
  p_contract_id uuid,
  p_status text,
  p_findings text,
  p_document_sha256 text,
  p_reviewer_id uuid default null
)
returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery public.deliveries;
  v_order_id uuid;
  v_window_days integer;
  v_deadline timestamptz;
begin
  if p_status not in ('PASS', 'FAIL', 'PARTIAL') then
    raise exception 'unknown QA report status %', p_status using errcode = 'invalid_parameter_value';
  end if;

  select id into v_order_id
  from public.qa_tier_orders
  where delivery_id = p_delivery_id
  order by created_at desc
  limit 1;

  if v_order_id is null then
    raise exception 'no QA tier order for delivery %', p_delivery_id
      using errcode = 'no_data_found';
  end if;

  select objection_window_days into v_window_days
  from public.contracts
  where id = p_contract_id;

  if v_window_days is null then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  v_delivery := public.transition_delivery(
    p_delivery_id, 'QA_DONE', format('QA raporu hazırlandı (%s)', p_status)
  );

  v_deadline := now() + make_interval(days => v_window_days);

  insert into public.qa_reports
    (delivery_id, tier_order_id, status, results, document_sha256, client_review_deadline, reviewer_id)
  values (
    p_delivery_id,
    v_order_id,
    p_status,
    jsonb_build_object('summary', p_findings),
    p_document_sha256,
    v_deadline,
    p_reviewer_id
  );

  v_delivery := public.transition_delivery(
    p_delivery_id, 'AWAITING_CLIENT', 'QA raporu ile müşteri kontrolüne açıldı'
  );

  return v_delivery;
end;
$$;

-- Not granted to anyone directly -- only called from submit_qa_report() and
-- submit_reviewer_report() below, which own the actual authorization checks.
revoke all on function public._record_qa_report(uuid, uuid, text, text, text, uuid) from public;

create or replace function public.submit_qa_report(
  p_delivery_id uuid,
  p_contract_id uuid,
  p_status text,
  p_findings text,
  p_document_sha256 text
)
returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'only an admin may submit a QA report'
      using errcode = 'insufficient_privilege';
  end if;

  return public._record_qa_report(
    p_delivery_id, p_contract_id, p_status, p_findings, p_document_sha256, null
  );
end;
$$;

revoke all on function public.submit_qa_report(uuid, uuid, text, text, text) from public;
grant execute on function public.submit_qa_report(uuid, uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- submit_reviewer_report: the token entry point. service_role only.
-- ---------------------------------------------------------------------------

create or replace function public.submit_reviewer_report(
  p_token text,
  p_status text,
  p_findings text,
  p_document_sha256 text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token public.qa_reviewer_tokens;
  v_order public.qa_tier_orders;
  v_contract_id uuid;
begin
  -- Belt and suspenders: this function is only granted to service_role below,
  -- but a future grant mistake must not silently turn the token check into
  -- the only thing standing between an authenticated user and this write.
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'submit_reviewer_report may only be called with the service role'
      using errcode = 'insufficient_privilege';
  end if;

  -- Row lock so two concurrent submissions on the same token (two tabs) do
  -- not both pass the used_at check -- the second waits for the first's
  -- transaction, then sees used_at already set.
  select * into v_token
  from public.qa_reviewer_tokens
  where token = p_token
  for update;

  if not found then
    raise exception 'reviewer token not found' using errcode = 'no_data_found';
  end if;
  if v_token.used_at is not null then
    raise exception 'reviewer token already used' using errcode = 'check_violation';
  end if;
  if v_token.expires_at < now() then
    raise exception 'reviewer token expired' using errcode = 'check_violation';
  end if;

  select * into v_order from public.qa_tier_orders where id = v_token.tier_order_id;
  select contract_id into v_contract_id from public.deliveries where id = v_order.delivery_id;

  perform public._record_qa_report(
    v_order.delivery_id, v_contract_id, p_status, p_findings, p_document_sha256, v_token.reviewer_id
  );

  update public.qa_reviewer_tokens set used_at = now() where id = v_token.id;
end;
$$;

revoke all on function public.submit_reviewer_report(text, text, text, text) from public;
grant execute on function public.submit_reviewer_report(text, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- reviewer_report_token_info: what the no-login page reads to decide what to
-- show (valid / already-submitted / expired / not-found) before the reviewer
-- types anything. Same shape as public_qa_report(): anon-readable,
-- hand-picked columns, security definer.
-- ---------------------------------------------------------------------------

create or replace function public.reviewer_report_token_info(p_token text)
returns table (
  valid boolean,
  reason text,
  contract_title text,
  reviewer_level text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (t.used_at is null and t.expires_at > now()) as valid,
    case
      when t.used_at is not null then 'used'
      when t.expires_at <= now() then 'expired'
      else null
    end as reason,
    c.title,
    r.level
  from public.qa_reviewer_tokens t
  join public.qa_tier_orders o on o.id = t.tier_order_id
  join public.deliveries d on d.id = o.delivery_id
  join public.contracts c on c.id = d.contract_id
  join public.qa_reviewers r on r.id = t.reviewer_id
  where t.token = p_token
    and p_token is not null
    and p_token <> '';
$$;

revoke all on function public.reviewer_report_token_info(text) from public;
grant execute on function public.reviewer_report_token_info(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- submit_qa_delivery: generate the reviewer's token at the one moment there
-- is actually something to review -- when the delivery creates the
-- qa_tier_orders row with a real reviewer_id, not earlier at signature time
-- (setQaSelection), when the freelancer may not deliver for weeks.
-- ---------------------------------------------------------------------------

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
  v_order_id uuid;
  v_token text;
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
  values (v_delivery.id, v_contract.qa_tier, coalesce(v_contract.qa_fee_kurus, 0), v_payment_status, v_contract.qa_reviewer_id)
  returning id into v_order_id;

  -- Only Tier 3/4 (a human reviewer) gets a token; Tier 1/2 have no reviewer
  -- to notify.
  if v_contract.qa_reviewer_id is not null then
    v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    insert into public.qa_reviewer_tokens (tier_order_id, reviewer_id, token, expires_at)
    values (v_order_id, v_contract.qa_reviewer_id, v_token, now() + interval '14 days');
  end if;

  return v_delivery;
end;
$$;

revoke all on function public.submit_qa_delivery(uuid, text, text, text) from public;
grant execute on function public.submit_qa_delivery(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin-facing lookup for the notify step: submitQaDelivery's TS action
-- fetches the freshly-created token + reviewer contact info via the
-- service-role client (never the freelancer's own session -- the freelancer
-- must never see the reviewer's write-capable link) to compose the email.
-- No new RPC needed for this: it is a plain select against
-- qa_reviewer_tokens/qa_reviewers, and the service-role connection bypasses
-- RLS the same way it does everywhere else in this codebase.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Reviewer roster: profile_id may now be null, so addReviewer() no longer
-- requires a pre-existing account -- the admin can add someone by name+email
-- alone, since the token flow needs no login at all.
-- ---------------------------------------------------------------------------
