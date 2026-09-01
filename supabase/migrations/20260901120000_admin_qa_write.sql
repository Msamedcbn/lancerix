-- Admin write policies the Faz 1 QA desk needs and never got.
--
-- qa_tier_orders had no update policy at all, so an admin could not mark a
-- Tier 3/4 fee paid or record who is reviewing after the fact. qa_reviewers
-- had no insert/update policy, so the roster TierPicker reads from could
-- only ever be seeded by hand in the SQL editor.

create policy qa_tier_orders_admin_update on public.qa_tier_orders
  for update using (public.is_admin()) with check (public.is_admin());

create policy qa_reviewers_admin_insert on public.qa_reviewers
  for insert with check (public.is_admin());

create policy qa_reviewers_admin_update on public.qa_reviewers
  for update using (public.is_admin()) with check (public.is_admin());
