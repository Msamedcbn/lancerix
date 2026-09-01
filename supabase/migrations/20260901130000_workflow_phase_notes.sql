-- A phase needs somewhere for the freelancer to say what happened during it,
-- not just whether it is done. The client reads the same field -- no separate
-- "client notes" column, because a phase has one story, not two competing
-- ones. Write access is already workflow_phases_update_freelancer; nothing new
-- to grant.

alter table public.workflow_phases
  add column if not exists notes text;
