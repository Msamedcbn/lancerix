-- Dispute Shield package (2026-09-13, user decision): a fourth standalone
-- package -- INTERACTION_SCAN + FORM_VALIDATION + DEAD_LINKS +
-- VISUAL_OVERFLOW at 54900 kurus -- replacing BASIC/PRO/FULL as the
-- homepage's only promoted one-time offer. Those three had zero real
-- customers (every "PAID" order on file was an admin free-trial test scan)
-- and stay orderable from /site-kontrol, just no longer marketed.
--
-- Mirrors 20260908060000_standalone_packages.sql's shape: widen the
-- package_id check constraint and the fee_check RLS policy together, same
-- as that migration's own comment warns.

alter table public.standalone_qa_orders
  drop constraint if exists standalone_qa_orders_package_id_check;

alter table public.standalone_qa_orders
  add constraint standalone_qa_orders_package_id_check
  check (package_id in ('BASIC', 'PRO', 'FULL', 'DISPUTE_SHIELD'));

drop policy standalone_qa_orders_insert on public.standalone_qa_orders;

create policy standalone_qa_orders_insert on public.standalone_qa_orders
  for insert with check (
    requested_by_user_id = auth.uid()
    and (
      -- legacy single-module orders
      (package_id is null and fee_kurus = 9900)
      -- packages
      or (package_id = 'BASIC' and fee_kurus = 19900)
      or (package_id = 'PRO'   and fee_kurus = 34900)
      or (package_id = 'FULL'  and fee_kurus = 44900)
      or (package_id = 'DISPUTE_SHIELD' and fee_kurus = 54900)
    )
  );
