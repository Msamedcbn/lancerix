-- Adds PERFORMANCE as a second standalone check_type (Core Web Vitals via
-- Lighthouse), exactly the append-only extension the original migration's
-- comment anticipated ("Adding PERFORMANCE later is one more value in this
-- check constraint"). Same fee (9900 kurus) as ACCESSIBILITY, so
-- standalone_qa_orders_insert's fee check
-- (20260908020000_standalone_qa_orders_fee_check.sql) needs no change.

alter table public.standalone_qa_orders
  drop constraint if exists standalone_qa_orders_check_type_check;

alter table public.standalone_qa_orders
  add constraint standalone_qa_orders_check_type_check
  check (check_type in ('ACCESSIBILITY', 'PERFORMANCE'));
