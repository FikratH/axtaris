-- Align the pro-plan daily application limit with the client + product copy,
-- and one-time cleanup of duplicate candidate sub-entity rows that accumulated
-- from the previous (id-classification) profile-sync logic.

-- 1. Pro daily application limit: client + feature comparison advertise 10, but
--    the enforcement function previously returned 7, so pro users hit a raw
--    "Daily application limit reached" error before their advertised quota.
CREATE OR REPLACE FUNCTION public.resolve_plan_daily_application_limit(plan_code subscription_plan)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE plan_code
    WHEN 'free' THEN 3
    WHEN 'pro' THEN 10
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Collapse duplicate child rows, keeping the earliest per logical key.
--    (The app now reconciles these tables and de-duplicates on read, so this is
--    a one-time backfill for data written by the old sync path.)
DELETE FROM public.language_skills a
USING public.language_skills b
WHERE a.candidate_id = b.candidate_id
  AND lower(btrim(a.language)) = lower(btrim(b.language))
  AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id));

DELETE FROM public.work_experiences a
USING public.work_experiences b
WHERE a.candidate_id = b.candidate_id
  AND a.job_title = b.job_title
  AND a.company = b.company
  AND a.start_date IS NOT DISTINCT FROM b.start_date
  AND a.end_date IS NOT DISTINCT FROM b.end_date
  AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id));

DELETE FROM public.education a
USING public.education b
WHERE a.candidate_id = b.candidate_id
  AND a.degree = b.degree
  AND a.field_of_study = b.field_of_study
  AND a.institution = b.institution
  AND a.start_date IS NOT DISTINCT FROM b.start_date
  AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id));

DELETE FROM public.certifications a
USING public.certifications b
WHERE a.candidate_id = b.candidate_id
  AND a.name = b.name
  AND a.issuer = b.issuer
  AND a.issue_date IS NOT DISTINCT FROM b.issue_date
  AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id));
