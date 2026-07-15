-- Admin surface access control + push notification token storage.

-- ============================================================
-- 1. Admin helper — is the current user an admin?
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================
-- 2. Admin full-access policies (additive to existing owner policies)
-- ============================================================
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;
CREATE POLICY "admin_all_profiles" ON public.profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_companies" ON public.companies;
CREATE POLICY "admin_all_companies" ON public.companies
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_vacancies" ON public.vacancies;
CREATE POLICY "admin_all_vacancies" ON public.vacancies
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_applications" ON public.applications;
CREATE POLICY "admin_all_applications" ON public.applications
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 3. Moderation flags — RLS: admins manage all, users file/read their own
-- ============================================================
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moderation_admin_all" ON public.moderation_flags;
CREATE POLICY "moderation_admin_all" ON public.moderation_flags
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "moderation_user_insert" ON public.moderation_flags;
CREATE POLICY "moderation_user_insert" ON public.moderation_flags
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "moderation_user_select" ON public.moderation_flags;
CREATE POLICY "moderation_user_select" ON public.moderation_flags
  FOR SELECT USING (auth.uid() = reported_by OR public.is_admin());

-- ============================================================
-- 4. Push notification token on the user profile
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Promote a user to admin (run manually with the service role / SQL editor):
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';
