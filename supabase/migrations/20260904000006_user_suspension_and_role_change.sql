-- User management, part 1: suspension + the columns role-change and delete
-- reuse. "Askıya alma" (suspend) deliberately does not touch login or any
-- in-flight contract/delivery/message RPC -- only new contract creation is
-- gated, at a single INSERT policy, rather than threading a check through
-- 8+ existing RPCs (sign_contract, submit_qa_delivery, set_qa_selection,
-- reject_contract, ...) and risking a regression in battle-tested logic.
-- Two people who already agreed to work together finish that work; a
-- suspended user just can't start anything new.
--
-- Role change needs no new security here: guard_profile_role()
-- (20260830000100_init.sql) already lets an admin change any profile's
-- role and blocks self-change -- this migration only adds what that
-- trigger didn't need: suspension.

alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references public.profiles(id) on delete set null,
  add column if not exists suspension_reason text;

drop policy if exists contracts_insert_freelancer on public.contracts;

create policy contracts_insert_freelancer on public.contracts
  for insert with check (
    freelancer_id = auth.uid()
    and public.current_user_role() = 'FREELANCER'
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.suspended_at is not null
    )
    and (
      client_id is null
      or not exists (
        select 1 from public.profiles p
        where p.id = client_id and p.suspended_at is not null
      )
    )
  );
