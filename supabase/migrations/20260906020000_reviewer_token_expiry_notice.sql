-- Idempotency marker for expire-reviewer-tokens' cron, same shape as
-- deliveries.reminder_sent_at and admin_digest_sends: without it, an expired
-- token would get renotified to the admin every day the cron runs, forever.

alter table public.qa_reviewer_tokens
  add column if not exists admin_notified_at timestamptz;

comment on column public.qa_reviewer_tokens.admin_notified_at is
  'Set once by /api/cron/expire-reviewer-tokens after a successful admin-alert email, so an expired-and-unused token is never renotified.';
