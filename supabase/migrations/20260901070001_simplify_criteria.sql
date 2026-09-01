-- Simplify acceptance criteria: remove preset check types.
--
-- Every job is unique — constraining criteria to HTTP_STATUS, FORM_SUBMIT etc.
-- doesn't work for non-web projects. Criteria become free-text descriptions
-- that the freelancer writes and both parties agree on.
--
-- The check_type and check_config columns are kept but made optional so
-- existing rows are not broken. New rows will only use description.

-- Make check_type and check_config optional (they were effectively required before)
alter table public.acceptance_criteria
  alter column check_type set default 'MANUAL';

-- Drop the strict config validation trigger if it exists
-- The criterion_config_valid function is too restrictive for free-text criteria
drop function if exists public.criterion_config_valid(text, jsonb) cascade;

-- Replace with a permissive version that always passes
create or replace function public.criterion_config_valid(p_check_type text, p_config jsonb)
returns boolean
language sql
immutable
parallel safe
as $$
  select true;
$$;
