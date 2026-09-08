-- Standalone QA paket yapısına geçiş (2026-09-08, user decision:
-- "yapı değişmeli, her birini tek tek vermek yerine özel paketler
-- geliştirmeliyiz"). Three predefined packages (BASIC / PRO / FULL), each
-- a bundle of check_types, replace the old pick-one-module model.
--
-- DB-level changes:
--   1) Add package_id to standalone_qa_orders -- every new order is placed
--      as a package, not a single check_type.
--   2) check_type stays on the row for legacy orders and because each
--      module still writes its own standalone_qa_reports row keyed on
--      order_id -- the report itself carries the module type. For new
--      package orders check_type is NULL (the package_id carries the intent;
--      which modules ran is in the reports).
--   3) fee_check RLS policy updated to accept all three package prices
--      (19900 / 34900 / 44900) alongside the old per-module price (9900)
--      for legacy rows.

-- 1) package_id column
alter table public.standalone_qa_orders
  add column package_id text check (package_id in ('BASIC', 'PRO', 'FULL'));

-- 2) make check_type nullable for new package-based orders
alter table public.standalone_qa_orders
  alter column check_type drop not null;

-- 3) add check_type column to standalone_qa_reports so each report row
--    records which module produced it (previously inferred from the order's
--    single check_type; now an order can have N modules → N reports).
alter table public.standalone_qa_reports
  add column check_type text;

-- 4) update the fee_check RLS policy to accept package prices
drop policy standalone_qa_orders_insert on public.standalone_qa_orders;

create policy standalone_qa_orders_insert on public.standalone_qa_orders
  for insert with check (
    requested_by_user_id = auth.uid()
    and (
      -- legacy single-module orders
      (package_id is null and fee_kurus = 9900)
      -- new package orders
      or (package_id = 'BASIC' and fee_kurus = 19900)
      or (package_id = 'PRO'   and fee_kurus = 34900)
      or (package_id = 'FULL'  and fee_kurus = 44900)
    )
  );
