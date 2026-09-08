-- Five more standalone check_type values (2026-09-08, user decision:
-- "uçtan uca test platformuna evriliyoruz"). All deterministic, zero LLM
-- cost -- same append-only pattern as PERFORMANCE
-- (20260908030000_standalone_qa_orders_add_performance.sql). Same fee
-- (9900 kurus) as every other standalone check, so the fee_check policy
-- (20260908020000) needs no change.

alter table public.standalone_qa_orders
  drop constraint if exists standalone_qa_orders_check_type_check;

alter table public.standalone_qa_orders
  add constraint standalone_qa_orders_check_type_check
  check (check_type in (
    'ACCESSIBILITY', 'PERFORMANCE', 'SEO_META', 'VISUAL_OVERFLOW',
    'DEAD_LINKS', 'FORM_VALIDATION', 'INTERACTION_SCAN'
  ));
