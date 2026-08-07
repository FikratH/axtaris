-- ============================================================
-- HOTFIX for 202608070001_security_hardening.sql.
--
-- That migration revoked EXECUTE on is_admin() from anon as part of F6
-- (closing an anon-callable-RPC oracle). That broke production: is_admin()
-- is also referenced inside several {public}-scoped (i.e. every role,
-- including anon) RLS policies used for legitimate admin-bypass access —
-- admin_all_profiles, admin_all_companies, admin_all_vacancies,
-- admin_all_applications, moderation_admin_all, moderation_user_select,
-- conversations_select/_update, analytics_admin_select. Postgres must be
-- able to EVALUATE a policy's expression for the querying role even when
-- that specific OR-branch will end up false — it needs EXECUTE on every
-- function the expression references, not just on the branches that
-- apply. Revoking it from anon broke anon's ability to read companies
-- and vacancies at all (core "browse without login" functionality),
-- confirmed live: `permission denied for function is_admin` (42501) on a
-- plain anon SELECT of profiles/companies.
--
-- is_admin() itself is safe to leave anon-executable directly too — it
-- only reads auth.uid() (null for anon) and returns false, no data
-- exposure. The other three F6 functions (owns_candidate_profile,
-- candidate_discoverable, employer_sees_candidate) are NOT referenced by
-- any {public}-scoped policy — only TO authenticated ones — so revoking
-- anon's EXECUTE on those three remains correct and stays in place.
-- ============================================================

BEGIN;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

COMMIT;
