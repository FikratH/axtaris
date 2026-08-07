-- ============================================================
-- P1 fix: candidate_invites had only non-unique indexes on
-- (company_id, candidate_id), unlike `applications` (which has
-- UNIQUE(vacancy_id, candidate_id)). Combined with the client-side
-- check-then-insert idempotency bug fixed in talentService.ts (the
-- existing-invite lookup didn't inspect `.error`, so a transient network
-- failure fell through to a duplicate INSERT), there was no database
-- backstop against duplicate invites + duplicate notifications. Verified
-- no existing duplicate rows before adding this (`GROUP BY ... HAVING
-- count(*) > 1` returned zero rows).
-- ============================================================

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_invites_company_candidate_unique
  ON public.candidate_invites(company_id, candidate_id);

COMMIT;
