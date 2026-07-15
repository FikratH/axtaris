-- Fix: "CV is not downloaded from HR account — 400 Bad Request".
--
-- The cv-uploads bucket is private and the only SELECT policy
-- (cv_uploads_owner_select) allows the file OWNER (the candidate) to read.
-- When an employer calls storage.createSignedUrl(...) for an applicant's CV,
-- storage RLS blocks it, which surfaces as a 400 from the Storage API.
--
-- This adds a second, tightly-scoped SELECT policy: an employer may read a
-- candidate's CV only when that candidate has applied to a vacancy belonging
-- to a company the employer owns.
--
-- Path shape (see fileStorageService.uploadCandidateCv):
--   cv-uploads/candidates/{authUserId}/cv/{ts}-{file}
-- so (storage.foldername(name))[2] == the candidate's auth user id, which
-- equals candidate_profiles.user_id (NOT candidate_profiles.id — that is the
-- value stored in applications.candidate_id, hence the join below).

CREATE OR REPLACE FUNCTION public.employer_can_view_candidate_cv(candidate_user_id_text TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.vacancies v ON v.id = a.vacancy_id
    JOIN public.companies c ON c.id = v.company_id
    JOIN public.candidate_profiles cp ON cp.id = a.candidate_id
    WHERE c.owner_id = auth.uid()
      AND cp.user_id::text = candidate_user_id_text
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.employer_can_view_candidate_cv(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.employer_can_view_candidate_cv(TEXT) TO authenticated;

DROP POLICY IF EXISTS "cv_uploads_employer_select" ON storage.objects;

CREATE POLICY "cv_uploads_employer_select"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND public.employer_can_view_candidate_cv((storage.foldername(name))[2])
  );
