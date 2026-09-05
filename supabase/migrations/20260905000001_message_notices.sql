-- Messages were the one event on a contract that told nobody. postMessage()
-- inserted a row and revalidated the page; the other party found out only if
-- they happened to open the contract. On a product whose whole claim is that
-- silence has consequences, a question that never reaches the other side
-- pushes the conversation off-platform -- and the ledger that is supposed to
-- settle disputes then has a hole exactly where the disagreement started.
--
-- Notification bookkeeping lives here rather than as a column on
-- contract_messages, because that table is append-only by design (a trigger
-- rejects every UPDATE, service role included) and that guard is worth more
-- than the convenience of one nullable timestamp. This table holds no message
-- content -- only "the last time we emailed this person about this thread".
--
-- RLS is enabled with no policies on purpose: nobody reaches this through
-- PostgREST. The only writer is the server action's admin client, and there is
-- nothing here a party needs to read.

create table if not exists public.contract_message_notices (
  contract_id uuid not null references public.contracts(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  notified_at timestamptz not null default now(),
  primary key (contract_id, recipient_id)
);

alter table public.contract_message_notices enable row level security;

comment on table public.contract_message_notices is
  'Debounce state for new-message emails: last time each party was emailed about a contract thread. Service-role only, no RLS policies.';
