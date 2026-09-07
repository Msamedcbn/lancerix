-- Signup source tracking: "bizi nereden duydunuz?" -- lets the founder see
-- which channel actually brings freelancers/clients in, instead of guessing.
-- Nullable, no default: existing rows stay null rather than lying with a
-- fabricated value, and the field is optional at signup on purpose -- a
-- required field here costs signups for a data point that's nice to have,
-- not need to have.
alter table public.profiles
  add column referral_source text
  check (referral_source is null or referral_source in (
    'GOOGLE', 'SOCIAL_MEDIA', 'FRIEND_REFERRAL', 'ADVERTISEMENT', 'OTHER'
  ));

comment on column public.profiles.referral_source is
  'How the user found Lancerix, self-reported at signup. Optional, null for accounts created before this column existed.';

-- handle_new_user() re-created whole (Postgres has no ADD to a trigger
-- function body) -- the CASE below is a second, narrower validation on top
-- of the CHECK constraint, on purpose: raw_user_meta_data is
-- client-supplied, and letting an unrecognised value reach the CHECK would
-- fail the whole signup transaction instead of just dropping the one field
-- signup shouldn't hinge on.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, public_id, referral_source)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data ->> 'role' = 'CLIENT' then 'CLIENT'::public.user_role
      else 'FREELANCER'::public.user_role
    end,
    public.generate_public_id(),
    case new.raw_user_meta_data ->> 'referral_source'
      when 'GOOGLE' then 'GOOGLE'
      when 'SOCIAL_MEDIA' then 'SOCIAL_MEDIA'
      when 'FRIEND_REFERRAL' then 'FRIEND_REFERRAL'
      when 'ADVERTISEMENT' then 'ADVERTISEMENT'
      when 'OTHER' then 'OTHER'
      else null
    end
  );
  return new;
end;
$$;
