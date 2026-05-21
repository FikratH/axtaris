-- Employer-side structured review metadata for application review.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS employer_notes TEXT,
  ADD COLUMN IF NOT EXISTS employer_rating INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_employer_rating_check'
      AND conrelid = 'public.applications'::regclass
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_employer_rating_check
      CHECK (employer_rating BETWEEN 1 AND 5);
  END IF;
END $$;
