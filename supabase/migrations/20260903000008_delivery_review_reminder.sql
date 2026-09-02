-- Faz E item #3 (accepted expansion, 2026-09-03 CEO strategy review): a
-- reminder to the freelancer before the 5-day silence-is-acceptance window
-- closes, so they can chase a client who has gone quiet -- using the same
-- cron infrastructure expire-deliveries already runs on.
--
-- reminder_sent_at tracks whether this delivery's reminder already went out,
-- the same "idempotent marker" shape as work_started_at on contracts --
-- without it, the daily cron would re-remind every day of the window.

alter table public.deliveries
  add column if not exists reminder_sent_at timestamptz;

comment on column public.deliveries.reminder_sent_at is
  'Set once a review-deadline-approaching reminder has been sent to the freelancer, so the daily cron never sends a second one for the same delivery.';
