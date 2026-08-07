-- Prerequisite refactor for closing F5 (companies.owner_id anon exposure,
-- see PUNCHLIST.md §1.5): route vacancies_select/vacancies_update's
-- ownership check through a SECURITY DEFINER function instead of a raw
-- correlated subquery on companies.owner_id. This is behavior-neutral on
-- its own (same access decisions as before) — it just stops these
-- {public}-scoped policies from requiring the querying role to hold direct
-- column privilege on companies.owner_id, which is what a future
-- REVOKE SELECT (owner_id) ... FROM anon needs in order to not break
-- vacancy browsing (see the F5 note for why the column revoke itself is
-- NOT done here; the client's shared select still requests owner_id in
-- every guest-reachable fetch, so revoking now would just move the
-- regression from the policy to the query's select list).

CREATE OR REPLACE FUNCTION public.is_company_owner(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id AND owner_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_company_owner(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS vacancies_select ON public.vacancies;
CREATE POLICY vacancies_select ON public.vacancies
  FOR SELECT
  USING (
    status = 'active'
    OR public.is_company_owner(company_id)
    OR public.candidate_has_vacancy_access(id)
  );

DROP POLICY IF EXISTS vacancies_update ON public.vacancies;
CREATE POLICY vacancies_update ON public.vacancies
  FOR UPDATE
  USING (public.is_company_owner(company_id));
