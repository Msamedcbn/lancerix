-- Dispute Shield price revised from $49 to $29 (2026-09-13, same day as
-- 20260913120000_dispute_shield_package.sql -- launched at a placeholder
-- price, revised before any real order was ever placed against it).
-- Matches the Dispute Shield Retainer's own $29/mo price: one number for
-- both "one incident" and "up to 10 a month".

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
      or (package_id = 'DISPUTE_SHIELD' and fee_kurus = 34900)
    )
  );
