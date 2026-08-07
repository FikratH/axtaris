-- Hotfix for 202608070014: a column-level REVOKE does NOT override a
-- pre-existing table-level GRANT SELECT — Postgres column privileges are
-- additive on top of table-level ones, not a restrictive override. anon
-- still had SELECT on owner_id after that migration (confirmed live via
-- both a direct REST query and information_schema.column_privileges).
-- Same fix shape as the original F1 PII lockdown (202608070001): revoke the
-- table-level grant entirely, then re-grant the explicit safe column list —
-- matches publicCompanySelect in vacancyService.ts exactly.
REVOKE SELECT ON public.companies FROM anon;
GRANT SELECT (
  id, name, industry, description, logo_url, cover_url, website,
  employee_count, location, founded_year, verification_status, rating,
  created_at, updated_at
) ON public.companies TO anon;
