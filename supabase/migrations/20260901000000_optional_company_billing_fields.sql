-- Faz 1 does not issue invoices, so a client had to fully paper a billing
-- entity -- valid VKN, tax office, address -- before a freelancer could even
-- find them to draft a QA-only contract. That gate belongs to Faz 2
-- (e-fatura/SMM issuance), not to signing a contract with acceptance
-- criteria and no money changing hands through the platform.
--
-- legal_name stays required: it is how a company is told apart in the
-- counterparty picker even with nothing else filled in. vkn keeps its
-- checksum check when present, same pattern as profiles.tckn in
-- 20260830160000_optional_tckn_check.sql: a CHECK is FALSE (not NULL) for a
-- NULL input in is_valid_vkn(), so the constraint has to say "null or valid"
-- explicitly rather than relying on CHECK's NULL-passes behaviour.

alter table public.companies
  alter column vkn drop not null,
  alter column tax_office drop not null,
  alter column address drop not null;

alter table public.companies
  drop constraint if exists companies_vkn_check;

alter table public.companies
  add constraint companies_vkn_check
  check (vkn is null or public.is_valid_vkn(vkn));
