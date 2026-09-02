-- Hotfix for 20260903000000: contracts_select_party's USING clause queried
-- auth.users directly. is_contract_party() is SECURITY DEFINER (its internal
-- query runs as the function owner, bypassing RLS and the auth.users grant
-- restriction), but the RLS policy body itself is not -- it evaluates as the
-- querying role ("authenticated"), which has no SELECT grant on auth.users.
-- Postgres does not guarantee left-to-right short-circuit evaluation of OR
-- branches in a USING clause, so this broke every contracts read (not just
-- the invite path) with "permission denied for table users", confirmed live
-- immediately after deploying 20260903000000.
--
-- Fix: the policy now calls is_contract_party(id) instead of duplicating its
-- logic inline -- single source of truth, and the auth.users check only ever
-- runs inside the security-definer function where it has the right to.

drop policy if exists contracts_select_party on public.contracts;

create policy contracts_select_party on public.contracts
  for select using (public.is_contract_party(id));
