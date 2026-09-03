-- Admin operator toolkit (T4): a note an admin can leave on a user's
-- profile. Multiple notes over time, not a single editable field -- a
-- timestamped log is simpler to build and more honest about "who said what
-- when" than one field two different admins might silently overwrite.
--
-- RLS: is_admin()-only, matching the CEO+eng review's decision -- never
-- exposed to the profile owner or any other party.

create table if not exists public.admin_user_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists admin_user_notes_profile_id_idx
  on public.admin_user_notes (profile_id);

alter table public.admin_user_notes enable row level security;

create policy admin_user_notes_admin_only on public.admin_user_notes
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.admin_user_notes to authenticated;
