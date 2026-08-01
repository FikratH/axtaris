-- ============================================================
-- Security hardening — close unauthenticated PII exposure.
--
-- Fixes three findings from the production-readiness audit:
--   P0  profiles.SELECT USING(true)  -> anon key could dump every
--       user's email / phone / expo_push_token via PostgREST.
--   P0  work_experiences / education / language_skills /
--       certifications had RLS DISABLED -> full anon read+write+delete.
--   P1  candidate_profiles.SELECT USING(true) -> professional data
--       readable by anon AND the is_discoverable opt-out was ignored
--       server-side (enforced only in client code).
--
-- Cross-user reads the app legitimately needs are preserved:
--   * self reads/writes own rows
--   * admins (is_admin()) retain full access
--   * employers read the profile + sub-entities of candidates who
--     applied to one of their vacancies (mirrors the existing
--     cv_uploads_employer_select relationship)
--   * employers browse candidate_profiles + work_experiences count
--     of candidates who opted in (is_discoverable)
--   * profiles name/avatar stay broadly readable by authenticated
--     users (talent cards, chat participant display)
--
-- RESIDUAL (tracked, needs a follow-up with employer+candidate test
-- accounts): any *authenticated* user can still SELECT another user's
-- profiles.email / phone / expo_push_token (RLS is row-level, not
-- column-level; a table-wide SELECT grant cannot be pared down per
-- column without re-granting an explicit column list). The correct
-- next step is a relationship-gated RPC/view for applicant contact so
-- the base table can be locked to self+admin. This migration removes
-- the far more severe *anonymous* (public anon-key) scrape — after it,
-- anon can read NO profiles column at all, incl. the push token.
-- ============================================================

BEGIN;

-- ── 1) profiles: deny anonymous access (was USING(true) for all roles).
--       After this, anon reads no profiles column (incl. expo_push_token);
--       authenticated reads stay broad (talent cards, chat display names,
--       employer applicant contact, admin) — see RESIDUAL note above.
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- ── 2) candidate_profiles: deny anon, enforce the is_discoverable
--       opt-out server-side, keep self/admin/employer-relationship reads
DROP POLICY IF EXISTS "candidate_profiles_select" ON public.candidate_profiles;
CREATE POLICY "candidate_profiles_select" ON public.candidate_profiles
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR is_discoverable = true
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      JOIN public.companies c ON c.id = v.company_id
      WHERE a.candidate_id = candidate_profiles.id
        AND c.owner_id = auth.uid()
    )
  );

-- ── 3) Enable RLS + policies on the four candidate sub-entity tables
--       (currently RLS-DISABLED => world CRUD via the anon key).
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['work_experiences', 'education', 'language_skills', 'certifications']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_owner_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_admin_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_employer_select', tbl);

    -- Owner (the candidate) full CRUD via candidate_profiles ownership.
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (candidate_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()))
        WITH CHECK (candidate_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()));
    $f$, tbl || '_owner_all', tbl);

    -- Admins: full access.
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    $f$, tbl || '_admin_all', tbl);

    -- Employer read: candidates who applied to their vacancies, OR
    -- candidates who opted into discovery (talent search needs the
    -- work_experiences count for discoverable profiles).
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.vacancies v ON v.id = a.vacancy_id
            JOIN public.companies c ON c.id = v.company_id
            WHERE a.candidate_id = %I.candidate_id
              AND c.owner_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.candidate_profiles cp
            WHERE cp.id = %I.candidate_id
              AND cp.is_discoverable = true
          )
        );
    $f$, tbl || '_employer_select', tbl, tbl, tbl);
  END LOOP;
END $$;

COMMIT;
