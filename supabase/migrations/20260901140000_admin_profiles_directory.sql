-- Belt-and-suspenders: profiles_select_self (20260830000100_init.sql) already
-- reads `id = auth.uid() or public.is_admin()`, so this policy is very likely
-- a no-op -- Postgres OR's multiple permissive policies for the same command,
-- and that OR-clause was already there. If the admin directory really was
-- returning nothing for other users before this migration, the cause was
-- something else (is_admin() itself, a stale session, a query that filtered
-- some other way) and has not been re-diagnosed. Kept rather than dropped
-- because a redundant grant is harmless and migrations aren't rewritten once
-- another one depends on them; do not treat this comment as proof the
-- original bug is understood.

create policy profiles_select_admin on public.profiles
  for select using (public.is_admin());
