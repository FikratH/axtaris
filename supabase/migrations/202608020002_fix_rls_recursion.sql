-- ============================================================
-- FIX: infinite recursion (Postgres 42P17) introduced by
-- 202608010001_rls_pii_lockdown.sql.
--
-- The candidate_profiles / sub-entity SELECT policies used inline
-- EXISTS subqueries over `applications`, whose own policy
-- (applications_select_candidate) selects from candidate_profiles —
-- a mutual reference that recurses infinitely for the `authenticated`
-- role, 500-ing every logged-in read of candidate_profiles and the 4
-- sub-entity tables. (Anon was unaffected because those policies are
-- TO authenticated, so anon never evaluated them.)
--
-- Fix: perform every cross-table relationship check inside SECURITY
-- DEFINER functions. A definer function runs as its owner and bypasses
-- RLS on the tables it reads, so the policy no longer re-enters another
-- RLS-protected table — breaking the loop (same technique as is_admin()).
-- Policies now reference only the row's own columns + these functions.
-- ============================================================

BEGIN;

-- ── SECURITY DEFINER relationship helpers ───────────────────────────
-- Does the current user own this candidate profile?
CREATE OR REPLACE FUNCTION public.owns_candidate_profile(cp_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.candidate_profiles cp
    WHERE cp.id = cp_id AND cp.user_id = auth.uid()
  );
$$;

-- Is this candidate discoverable (opted into talent search)?
CREATE OR REPLACE FUNCTION public.candidate_discoverable(cp_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT cp.is_discoverable FROM public.candidate_profiles cp WHERE cp.id = cp_id),
    false
  );
$$;

-- Does the current user (an employer) have an application from this
-- candidate to one of their company's vacancies?
CREATE OR REPLACE FUNCTION public.employer_sees_candidate(cp_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.vacancies v ON v.id = a.vacancy_id
    JOIN public.companies c ON c.id = v.company_id
    WHERE a.candidate_id = cp_id
      AND c.owner_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.owns_candidate_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.candidate_discoverable(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.employer_sees_candidate(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_candidate_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.candidate_discoverable(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.employer_sees_candidate(uuid) TO authenticated;

-- ── candidate_profiles: recursion-free rewrite ──────────────────────
DROP POLICY IF EXISTS "candidate_profiles_select" ON public.candidate_profiles;
CREATE POLICY "candidate_profiles_select" ON public.candidate_profiles
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id            -- own row (own column, no recursion)
    OR is_discoverable = true       -- own column
    OR public.is_admin()            -- SECURITY DEFINER
    OR public.employer_sees_candidate(id)  -- SECURITY DEFINER
  );

-- ── 4 sub-entity tables: recursion-free rewrite ─────────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['work_experiences', 'education', 'language_skills', 'certifications']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_owner_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_admin_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_employer_select', tbl);

    -- Owner CRUD (definer check — no candidate_profiles RLS re-entry).
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (public.owns_candidate_profile(candidate_id))
        WITH CHECK (public.owns_candidate_profile(candidate_id));
    $f$, tbl || '_owner_all', tbl);

    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    $f$, tbl || '_admin_all', tbl);

    -- Employer read: applicant relationship OR discoverable candidate.
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR SELECT TO authenticated
        USING (
          public.employer_sees_candidate(candidate_id)
          OR public.candidate_discoverable(candidate_id)
        );
    $f$, tbl || '_employer_select', tbl);
  END LOOP;
END $$;

COMMIT;
