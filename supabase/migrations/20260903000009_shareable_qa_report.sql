-- Faz E item #1 (accepted expansion, 2026-09-03 CEO strategy review): a
-- freelancer can opt in to a public, unguessable link for an accepted QA
-- report -- something to put in a portfolio or a proposal, turning the
-- report into a growth loop instead of something only the two parties ever
-- see. Default off; the freelancer decides per report.
--
-- Privacy design (from the CEO review's Section 8 finding, closed here):
-- - share_token is a 256-bit random value, never a sequential/guessable ID.
-- - public_qa_report() returns a hand-picked column list -- contract title,
--   project category, acceptance criteria descriptions, the report's
--   status/hash/timestamp -- and nothing else: no emails, no TCKN/IBAN, no
--   money figures, no user IDs. Adding a column to qa_reports or contracts
--   later does NOT automatically become public; this function's own SELECT
--   list is the only thing that can expose a new field.
-- - Enabling sharing ALWAYS generates a fresh token, even if one already
--   existed. Disabling clears it entirely. A revoked link is truly dead --
--   re-sharing later is a different, new URL, not a reactivation of the old
--   one that may already be sitting in someone's browser history or a
--   search index.

alter table public.qa_reports
  add column if not exists share_token text unique;

comment on column public.qa_reports.share_token is
  'Opt-in public share token (256-bit random, url-safe hex). NULL = not shared. Set only by toggle_qa_report_share(), the freelancer''s own choice.';

-- ---------------------------------------------------------------------------
-- toggle_qa_report_share: freelancer-only, on/off
-- ---------------------------------------------------------------------------

create or replace function public.toggle_qa_report_share(
  p_report_id uuid,
  p_share boolean
)
returns public.qa_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.qa_reports;
  v_freelancer_id uuid;
  v_new_token text;
begin
  select * into v_report from public.qa_reports where id = p_report_id;

  if not found then
    raise exception 'QA report % not found', p_report_id using errcode = 'no_data_found';
  end if;

  select c.freelancer_id into v_freelancer_id
  from public.deliveries d
  join public.contracts c on c.id = d.contract_id
  where d.id = v_report.delivery_id;

  if v_freelancer_id is distinct from auth.uid() then
    raise exception 'only the freelancer may share their own QA report'
      using errcode = 'insufficient_privilege';
  end if;

  if p_share then
    -- Two gen_random_uuid() calls, dashes stripped: 256 bits of randomness,
    -- not the 128-bit shape a single UUID's version/variant bits slightly
    -- reduce. gen_random_uuid() is core Postgres 13+, no extension needed.
    v_new_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

    update public.qa_reports
    set share_token = v_new_token
    where id = p_report_id
    returning * into v_report;
  else
    update public.qa_reports
    set share_token = null
    where id = p_report_id
    returning * into v_report;
  end if;

  return v_report;
end;
$$;

revoke all on function public.toggle_qa_report_share(uuid, boolean) from public;
grant execute on function public.toggle_qa_report_share(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- public_qa_report: anon-readable, by token only, hand-picked columns
-- ---------------------------------------------------------------------------

create or replace function public.public_qa_report(p_token text)
returns table (
  contract_title text,
  project_category public.project_category,
  criteria text[],
  status text,
  document_sha256 text,
  generated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.title,
    c.project_category,
    array(
      select ac.description
      from public.acceptance_criteria ac
      where ac.contract_id = c.id
      order by ac.sequence_no
    ),
    r.status,
    r.document_sha256,
    r.generated_at
  from public.qa_reports r
  join public.deliveries d on d.id = r.delivery_id
  join public.contracts c on c.id = d.contract_id
  where r.share_token = p_token
    and p_token is not null
    and p_token <> '';
$$;

revoke all on function public.public_qa_report(text) from public;
grant execute on function public.public_qa_report(text) to anon, authenticated;

comment on function public.public_qa_report is
  'Public, token-gated read of one QA report. Column list is deliberately hand-picked and short -- never SELECT * or join anything beyond what is explicitly named here, that is the entire privacy boundary for this function.';
