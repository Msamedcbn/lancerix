-- Caught while wiring admin search and the admin user-detail page to
-- project_requests (2026-09-06 /plan-eng-review): project_requests_select_party
-- was the one party-scoped SELECT policy in this schema with no `is_admin()`
-- branch. Every other one does -- contracts, deliveries, milestones,
-- contract_messages, workflow_phases, escrow_transactions -- checked by
-- grepping every `is_admin()` policy in the migration history. An admin page
-- reading this table through the normal session client (not a service-role
-- client) would get back zero rows and render "no requests", which looks
-- exactly like the honest answer instead of a permissions wall.
--
-- This was a plain oversight from 20260905000002, not a deliberate
-- restriction: nothing about project_requests calls for admins to see less
-- than they see on every other table in the product.

drop policy if exists project_requests_select_party on public.project_requests;

create policy project_requests_select_party on public.project_requests
  for select using (
    client_id = auth.uid()
    or freelancer_id = auth.uid()
    or public.is_admin()
    or (
      freelancer_id is null
      and lower(freelancer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and coalesce(auth.jwt() ->> 'email', '') <> ''
      and public.caller_email_confirmed()
    )
  );

comment on policy project_requests_select_party on public.project_requests is
  'Both parties, admins, and the invited-but-unclaimed address so claim_invited_request() can be reached. No policy lets a freelancer read requests addressed to anyone else.';
