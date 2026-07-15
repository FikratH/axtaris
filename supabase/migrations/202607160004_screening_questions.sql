-- Screening questions (ROADMAP #7 — structured apply).
-- Employers can attach optional per-vacancy questions; candidates answer them
-- when applying; employers see the answers on the applicant.

ALTER TABLE public.vacancies
  ADD COLUMN IF NOT EXISTS screening_questions JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS screening_answers JSONB NOT NULL DEFAULT '[]'::jsonb;
