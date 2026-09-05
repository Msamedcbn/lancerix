-- Caught while wiring the UI for 20260905000002: an email-invited freelancer
-- could never reach their own request.
--
-- project_requests_select_party matched only client_id or freelancer_id, and
-- an email invite has freelancer_id NULL until it is claimed. So the row was
-- invisible to exactly the person it was addressed to, claim_invited_request()
-- could never be triggered by them opening the link, and the email path was
-- dead on arrival.
--
-- Fixed the same way contracts already solve it (is_contract_party, see
-- 20260903000002): let the confirmed, matching address see the unclaimed row.
-- Reusing that migration's two helpers rather than rewriting the condition --
-- caller_email_confirmed() is what stops an unconfirmed signup from reading a
-- stranger's brief by claiming their address.

drop policy if exists project_requests_select_party on public.project_requests;

create policy project_requests_select_party on public.project_requests
  for select using (
    client_id = auth.uid()
    or freelancer_id = auth.uid()
    or (
      freelancer_id is null
      and lower(freelancer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and coalesce(auth.jwt() ->> 'email', '') <> ''
      and public.caller_email_confirmed()
    )
  );

comment on policy project_requests_select_party on public.project_requests is
  'Both parties, plus the invited-but-unclaimed address so claim_invited_request() can actually be reached. No policy lets a freelancer read requests addressed to anyone else.';
