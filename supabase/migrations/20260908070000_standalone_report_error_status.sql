-- A module that could not run must leave a trace (2026-09-08).
--
-- Until now createOrderAndRunCheck() filtered failed modules out of the
-- report insert entirely (`successfulRuns`), so a customer who paid ₺449 for
-- the 7-module Tam Tarama and whose accessibility scan failed received a
-- 6-module report with nothing anywhere saying a 7th was ever owed. That is
-- the same defect as a scan reporting numbers it never measured: the report
-- claims completeness it does not have.
--
-- Fix: every module in the purchased package now gets a row, and a module
-- that did not run is recorded as ERROR. 'ERROR' is a scan-execution
-- outcome, deliberately distinct from FAIL (the module ran and the site
-- failed it) -- conflating them would tell the customer their site is
-- broken when it was our scanner that was.
--
-- document_sha256 stays NOT NULL and 64-hex: an ERROR row is sealed the
-- same way as any other, over its own results payload, so an incomplete
-- audit is still tamper-evident evidence of what was and wasn't run.

alter table public.standalone_qa_reports
  drop constraint standalone_qa_reports_status_check;

alter table public.standalone_qa_reports
  add constraint standalone_qa_reports_status_check
  check (status in ('PASS', 'FAIL', 'PARTIAL', 'ERROR'));
