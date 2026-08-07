-- ============================================================
-- HOTFIX for 202608070001_security_hardening.sql's F4 fix.
--
-- applications_update's new WITH CHECK read the row's own (pre-update)
-- candidate_id via `SELECT a.candidate_id FROM public.applications a
-- WHERE a.id = applications.id` — a self-referential subquery against the
-- very table the policy protects. Postgres has to evaluate RLS (the
-- SELECT policy) for that inner query too, which re-enters the same
-- table's policy machinery and throws "infinite recursion detected in
-- policy for relation applications" (42P17) — confirmed live, on both
-- the attack probe AND a plain legitimate status update (this took the
-- whole UPDATE path down, not just the intended-to-be-blocked attack).
--
-- Same root cause and same fix pattern as
-- 202608020002_fix_rls_recursion.sql: move the self-lookup into a
-- SECURITY DEFINER function, which bypasses RLS for its own internal
-- read and breaks the recursive dependency.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.application_candidate_id(app_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT candidate_id FROM public.applications WHERE id = app_id;
$$;

REVOKE ALL ON FUNCTION public.application_candidate_id(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.application_candidate_id(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.application_candidate_id(UUID) TO authenticated;

DROP POLICY IF EXISTS "applications_update" ON public.applications;
CREATE POLICY "applications_update" ON public.applications FOR UPDATE
  USING (
    vacancy_id IN (SELECT v.id FROM public.vacancies v JOIN public.companies c ON v.company_id = c.id WHERE c.owner_id = auth.uid())
  )
  WITH CHECK (
    vacancy_id IN (SELECT v.id FROM public.vacancies v JOIN public.companies c ON v.company_id = c.id WHERE c.owner_id = auth.uid())
    AND candidate_id = public.application_candidate_id(id)
  );

COMMIT;
