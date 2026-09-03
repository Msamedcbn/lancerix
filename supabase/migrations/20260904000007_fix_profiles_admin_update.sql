-- Bug found in review, before shipping: profiles had profiles_update_self
-- (using (id = auth.uid())) but no admin bypass -- every other
-- admin-managed table (qa_reviewers, qa_tier_orders, platform_invoices)
-- already has an is_admin() UPDATE policy from 20260901120000_admin_qa_write.sql;
-- profiles never got one.
--
-- Consequence, confirmed live: updateUserProfile()/suspendUser()/
-- unsuspendUser()/changeUserRole() all ran via the request-scoped client
-- (not createAdminClient()), so RLS silently excluded the target row from
-- the UPDATE. Supabase's client does not error on a zero-row UPDATE, so
-- every one of those actions reported success while writing nothing --
-- caught by checking the DB directly after a live test, not by the action's
-- own return value. guard_profile_role()'s "an existing admin can [change
-- role]" comment (20260830000100_init.sql) was correspondingly never
-- actually reachable through a normal client either: the trigger's
-- admin-allows logic can't run on a row RLS never let the UPDATE touch in
-- the first place.

create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());
