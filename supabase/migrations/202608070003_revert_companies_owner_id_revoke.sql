-- ============================================================
-- REVERT the F5 column-level revoke from 202608070001_security_hardening.sql.
--
-- companies.owner_id is read inside vacancies_select's own USING clause
-- (`... OR company_id IN (SELECT id FROM public.companies WHERE owner_id
-- = auth.uid())`), which has no TO clause and so applies to every role,
-- including anon. Revoking anon's column-level SELECT on owner_id broke
-- evaluation of that policy for anon entirely — Postgres needs SELECT
-- privilege on every column a policy expression references for the
-- querying role, even on OR-branches that will end up false for that
-- role. Confirmed live: anon browsing /vacancies (core "browse jobs
-- without login" functionality) started failing with `permission denied
-- for table companies` immediately after that migration.
--
-- F5 (owner_id — a real auth.users UUID — being anon-readable) is real
-- but lower severity (P1) than the breakage caused by this fix attempt.
-- Restoring full anon SELECT on companies for now; the correct fix needs
-- a different shape (e.g. rewrite the ownership check in vacancies_select
-- and friends to go through a SECURITY DEFINER function instead of a raw
-- correlated subquery against companies, so the column-level restriction
-- only has to satisfy that function's owner, not every querying role) —
-- tracked as a follow-up in PUNCHLIST.md, not attempted again under
-- time pressure in this pass.
-- ============================================================

BEGIN;

REVOKE SELECT (
  id, name, industry, description, logo_url, cover_url, website,
  employee_count, location, founded_year, verification_status, rating,
  created_at, updated_at
) ON public.companies FROM anon;
GRANT SELECT ON public.companies TO anon;

COMMIT;
