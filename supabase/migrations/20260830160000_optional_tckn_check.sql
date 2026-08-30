-- profiles.tckn is optional, but its CHECK rejected every row that left it unset.
--
-- A CHECK passes when its expression is TRUE or NULL, and fails on FALSE.
-- is_valid_tckn() returns FALSE for a NULL input rather than NULL, so
-- `check (public.is_valid_tckn(tckn))` evaluated to FALSE on every profile
-- without a TCKN -- which is every profile handle_new_user() creates. Sign-up
-- failed with "Database error saving new user" for that reason, for everyone.
--
-- The function is left alone on purpose: returning FALSE for an absent value is
-- what isValidTckn() does in TypeScript too, and the two are required to stay
-- mirrors of each other. Optionality belongs to the column, so the constraint
-- is where it is expressed.
--
-- init.sql carries the same corrected constraint, so a database created from
-- scratch is right from the start; this migration brings an already-deployed
-- one to the same state. Both paths end identical.

alter table public.profiles
  drop constraint if exists profiles_tckn_check;

alter table public.profiles
  add constraint profiles_tckn_check
  check (tckn is null or public.is_valid_tckn(tckn));
