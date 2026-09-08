-- 20260908010000's standalone_qa_orders_insert policy only checked
-- requested_by_user_id = auth.uid() -- fee_kurus was left to whatever the
-- Server Action sent, meaning a client holding a valid session could bypass
-- standalone-qa-actions.ts entirely and insert a row with fee_kurus:0 (or any
-- value) directly via the Supabase JS client. Every other money-bearing
-- insert in this codebase (choose_qa_tier, set_qa_selection) computes the fee
-- inside a SECURITY DEFINER RPC in Postgres; this closes the same gap for
-- standalone orders without the bigger RPC rewrite, by making the RLS policy
-- itself the enforcement point (matches CLAUDE.md's "RLS on every table, no
-- exceptions").
--
-- Hardcodes today's only price (9900 kurus, matching
-- STANDALONE_CHECK_FEE_KURUS in src/lib/validations/standalone-qa.ts -- keep
-- both in sync). When check_type gains a second value with a different fee,
-- this becomes a `case` on check_type in a later migration, not a redesign.

drop policy standalone_qa_orders_insert on public.standalone_qa_orders;

create policy standalone_qa_orders_insert on public.standalone_qa_orders
  for insert with check (
    requested_by_user_id = auth.uid()
    and fee_kurus = 9900
  );
