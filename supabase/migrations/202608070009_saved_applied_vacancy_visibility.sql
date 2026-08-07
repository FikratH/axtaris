-- ============================================================
-- P1 fix: saved jobs and applications for a vacancy that has left
-- `active` (paused/closed/draft) silently disappear from the candidate's
-- UI — the client-side fetch has no status filter, but vacancies_select
-- RLS still gates on `status = 'active' OR <owner>`, so a candidate can no
-- longer read a vacancy they saved or applied to once it's no longer
-- active. Extend the policy to also allow a candidate who saved or
-- applied to a vacancy to keep reading it regardless of status.
--
-- IMPORTANT: vacancies_select has no `TO` clause (applies to every role,
-- including anon) and `applications_select_candidate`'s own policy already
-- references `vacancies` — a naive inline subquery here would create the
-- same candidate_profiles<->applications mutual-reference recursion that
-- 202608020002_fix_rls_recursion.sql already had to fix once. Route the
-- check through a SECURITY DEFINER function instead (breaks the RLS
-- re-entry), and grant it to anon too — Postgres must be able to evaluate
-- every function a {public}-scoped policy references for every role, even
-- on branches that end up false for that role (this exact class of bug
-- bit the is_admin() and companies.owner_id changes earlier in this pass).
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.candidate_has_vacancy_access(v_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.saved_jobs sj
      WHERE sj.vacancy_id = v_id AND sj.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_id
      WHERE a.vacancy_id = v_id AND cp.user_id = auth.uid()
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.candidate_has_vacancy_access(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.candidate_has_vacancy_access(UUID) TO authenticated;

DROP POLICY IF EXISTS "vacancies_select" ON public.vacancies;
CREATE POLICY "vacancies_select" ON public.vacancies FOR SELECT USING (
  status = 'active'
  OR company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  OR public.candidate_has_vacancy_access(id)
);

COMMIT;
