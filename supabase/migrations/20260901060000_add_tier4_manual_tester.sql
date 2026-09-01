-- Expand qa_tier_orders tier check constraint to include TIER4 (Pure Manuel Tester)
alter table public.qa_tier_orders
  drop constraint if exists qa_tier_orders_tier_check;

alter table public.qa_tier_orders
  add constraint qa_tier_orders_tier_check
  check (tier in ('TIER1', 'TIER2', 'TIER3', 'TIER4'));
