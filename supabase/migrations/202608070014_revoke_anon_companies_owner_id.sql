-- Closes F5 (PUNCHLIST.md §1.5): companies.owner_id — a real auth.users UUID,
-- the join key for targeted attacks — was readable by anon with no login at
-- all, via companies_select's unrestricted `USING (true)`.
--
-- This was reverted once already this session (202608070003) because
-- vacancies_select's own policy read companies.owner_id in a raw correlated
-- subquery, and Postgres requires column privilege to even parse that
-- subquery for any role the {public}-scoped policy applies to — revoking
-- broke anon vacancy browsing outright. That prerequisite is now fixed
-- (202608070011: vacancies_select/vacancies_update call is_company_owner()
-- instead of reading the column directly), and the client's shared select
-- constants have been split (vacancyService.ts: publicCompanySelect /
-- publicVacancySelect, used by every guest-reachable browse/search/detail
-- function) so a guest session's query no longer names the column either.
-- Both verified via tsc/jest before this migration; live-verification of
-- this specific revoke happens immediately after applying it — see
-- PUNCHLIST.md §1.5 for the result.
REVOKE SELECT (owner_id) ON public.companies FROM anon;
GRANT SELECT (owner_id) ON public.companies TO authenticated;
