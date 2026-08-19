-- ============================================================
-- Admin read access to subscription tables.
--
-- The only SELECT policy on candidate_subscriptions/employer_subscriptions
-- is USING (auth.uid() = user_id), so the admin Finance screen aggregates
-- over the admin's own rows only and reports MRR/ARR/ARPU as zero while
-- real revenue rows exist (live-confirmed 2026-08-19: admin saw 1 of 8
-- candidate rows). Permissive policies OR together — adding an is_admin()
-- SELECT policy mirrors the pattern every other admin-read table already
-- uses (202607160001_admin_and_push.sql).
-- ============================================================

DROP POLICY IF EXISTS "candidate_subscriptions_admin_select" ON public.candidate_subscriptions;
CREATE POLICY "candidate_subscriptions_admin_select" ON public.candidate_subscriptions
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "employer_subscriptions_admin_select" ON public.employer_subscriptions;
CREATE POLICY "employer_subscriptions_admin_select" ON public.employer_subscriptions
  FOR SELECT USING (public.is_admin());
