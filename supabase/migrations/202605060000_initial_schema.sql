-- AxtarIS MVP Database Schema
-- Supabase / PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('candidate', 'employer', 'admin');
CREATE TYPE application_status AS ENUM ('pending', 'reviewed', 'shortlisted', 'rejected', 'accepted');
CREATE TYPE vacancy_status AS ENUM ('draft', 'pending_moderation', 'active', 'paused', 'closed', 'rejected');
CREATE TYPE work_type AS ENUM ('full_time', 'part_time', 'remote', 'hybrid', 'onsite', 'internship');
CREATE TYPE experience_level AS ENUM ('no_experience', 'junior', 'mid', 'senior', 'lead', 'executive');
CREATE TYPE verification_status AS ENUM ('not_verified', 'pending', 'verified', 'rejected');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE language_proficiency AS ENUM ('beginner', 'intermediate', 'advanced', 'native');
CREATE TYPE availability_type AS ENUM ('immediate', 'two_weeks', 'one_month', 'negotiable');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired');
CREATE TYPE notification_type AS ENUM (
  'application_update', 'new_application', 'new_job_match',
  'profile_reminder', 'company_verification', 'vacancy_moderation', 'system'
);
CREATE TYPE ai_session_type AS ENUM ('build', 'improve', 'rewrite', 'suggest_skills');
CREATE TYPE ai_session_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'candidate',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CANDIDATE PROFILES
-- ============================================================

CREATE TABLE public.candidate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  bio TEXT,
  location TEXT,
  expected_salary INTEGER,
  salary_currency TEXT DEFAULT 'AZN',
  skills TEXT[] DEFAULT '{}',
  availability availability_type,
  work_preference work_type,
  portfolio_url TEXT,
  cv_url TEXT,
  cv_file_name TEXT,
  profile_completeness INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.work_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  highlights TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  institution TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.language_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  level language_proficiency NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  credential_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPANIES
-- ============================================================

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  website TEXT,
  employee_count TEXT,
  location TEXT,
  founded_year INTEGER,
  verification_status verification_status DEFAULT 'not_verified',
  rating NUMERIC(3,2),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMPLOYER PROFILES
-- ============================================================

CREATE TABLE public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.candidate_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  price_amount INTEGER NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'AZN',
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VACANCIES
-- ============================================================

CREATE TABLE public.vacancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  responsibilities TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'AZN',
  show_salary BOOLEAN DEFAULT true,
  city TEXT NOT NULL,
  work_type work_type NOT NULL DEFAULT 'full_time',
  experience_level experience_level NOT NULL DEFAULT 'mid',
  skills TEXT[] DEFAULT '{}',
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status vacancy_status DEFAULT 'draft',
  applicant_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  response_rate INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS
-- ============================================================

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  status application_status DEFAULT 'pending',
  subscription_plan subscription_plan NOT NULL DEFAULT 'free',
  visibility_score INTEGER NOT NULL DEFAULT 0,
  cover_letter TEXT,
  cv_url TEXT,
  employer_notes TEXT,
  employer_rating INTEGER CHECK (employer_rating BETWEEN 1 AND 5),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vacancy_id, candidate_id)
);

-- ============================================================
-- SAVED JOBS
-- ============================================================

CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vacancy_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPLOADED FILES
-- ============================================================

CREATE TABLE public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_provider TEXT NOT NULL DEFAULT 'supabase',
  storage_bucket TEXT,
  storage_path TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI RESUME SESSIONS
-- ============================================================

CREATE TABLE public.ai_resume_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type ai_session_type NOT NULL,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  status ai_session_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODERATION FLAGS
-- ============================================================

CREATE TABLE public.moderation_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('vacancy', 'company', 'user')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status moderation_status DEFAULT 'pending',
  reported_by UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_candidate_profiles_user ON public.candidate_profiles(user_id);
CREATE INDEX idx_employer_profiles_user ON public.employer_profiles(user_id);
CREATE INDEX idx_employer_profiles_company ON public.employer_profiles(company_id);
CREATE INDEX idx_candidate_subscriptions_user ON public.candidate_subscriptions(user_id);
CREATE UNIQUE INDEX idx_candidate_subscriptions_active_user ON public.candidate_subscriptions(user_id) WHERE status = 'active';
CREATE INDEX idx_vacancies_company ON public.vacancies(company_id);
CREATE INDEX idx_vacancies_status ON public.vacancies(status);
CREATE INDEX idx_vacancies_city ON public.vacancies(city);
CREATE INDEX idx_vacancies_work_type ON public.vacancies(work_type);
CREATE INDEX idx_vacancies_experience ON public.vacancies(experience_level);
CREATE INDEX idx_vacancies_created ON public.vacancies(created_at DESC);
CREATE INDEX idx_applications_vacancy ON public.applications(vacancy_id);
CREATE INDEX idx_applications_candidate ON public.applications(candidate_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_visibility ON public.applications(vacancy_id, visibility_score DESC, applied_at DESC);
CREATE INDEX idx_saved_jobs_user ON public.saved_jobs(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_uploaded_files_user ON public.uploaded_files(user_id, created_at DESC);
CREATE INDEX idx_uploaded_files_storage ON public.uploaded_files(storage_bucket, storage_path);
CREATE INDEX idx_moderation_flags_entity ON public.moderation_flags(entity_type, entity_id);
CREATE INDEX idx_moderation_flags_status ON public.moderation_flags(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_resume_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Candidate profiles: owner can CRUD, employers can read
CREATE POLICY "candidate_profiles_select" ON public.candidate_profiles FOR SELECT USING (true);
CREATE POLICY "candidate_profiles_insert" ON public.candidate_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "candidate_profiles_update" ON public.candidate_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "candidate_subscriptions_select" ON public.candidate_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "candidate_subscriptions_insert" ON public.candidate_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "candidate_subscriptions_update" ON public.candidate_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Companies: public read, owner can update
CREATE POLICY "companies_select" ON public.companies FOR SELECT USING (true);
CREATE POLICY "companies_insert" ON public.companies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_update" ON public.companies FOR UPDATE USING (auth.uid() = owner_id);

-- Vacancies: public read active, company owner can CRUD
CREATE POLICY "vacancies_select" ON public.vacancies FOR SELECT USING (status = 'active' OR company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));
CREATE POLICY "vacancies_insert" ON public.vacancies FOR INSERT WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));
CREATE POLICY "vacancies_update" ON public.vacancies FOR UPDATE USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- Applications: candidate can read own, employer can read for their vacancies
CREATE POLICY "applications_select_candidate" ON public.applications FOR SELECT USING (
  candidate_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
  OR vacancy_id IN (SELECT v.id FROM public.vacancies v JOIN public.companies c ON v.company_id = c.id WHERE c.owner_id = auth.uid())
);
CREATE POLICY "applications_insert" ON public.applications FOR INSERT WITH CHECK (
  candidate_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "applications_update" ON public.applications FOR UPDATE USING (
  vacancy_id IN (SELECT v.id FROM public.vacancies v JOIN public.companies c ON v.company_id = c.id WHERE c.owner_id = auth.uid())
);

-- Saved jobs: user can CRUD own
CREATE POLICY "saved_jobs_all" ON public.saved_jobs USING (auth.uid() = user_id);

-- Notifications: user can read own
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Uploaded files: user can CRUD own
CREATE POLICY "uploaded_files_select" ON public.uploaded_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "uploaded_files_insert" ON public.uploaded_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uploaded_files_update" ON public.uploaded_files FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uploaded_files_delete" ON public.uploaded_files FOR DELETE USING (auth.uid() = user_id);

-- AI sessions: user can CRUD own
CREATE POLICY "ai_sessions_all" ON public.ai_resume_sessions USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS & POLICIES
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'cv-uploads',
    'cv-uploads',
    false,
    10485760,
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880,
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]
  ),
  (
    'company-media',
    'company-media',
    true,
    5242880,
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.current_user_owns_company(company_id_text TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE companies.id::text = company_id_text
      AND companies.owner_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.current_user_owns_company(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_owns_company(TEXT) TO authenticated;

CREATE POLICY "cv_uploads_owner_select"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "cv_uploads_owner_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "cv_uploads_owner_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "cv_uploads_owner_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "avatars_public_select"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "company_media_public_select"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'company-media');

CREATE POLICY "company_media_owner_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'company-media'
    AND (storage.foldername(name))[1] = 'companies'
    AND public.current_user_owns_company((storage.foldername(name))[2])
  );

CREATE POLICY "company_media_owner_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'company-media'
    AND (storage.foldername(name))[1] = 'companies'
    AND public.current_user_owns_company((storage.foldername(name))[2])
  )
  WITH CHECK (
    bucket_id = 'company-media'
    AND (storage.foldername(name))[1] = 'companies'
    AND public.current_user_owns_company((storage.foldername(name))[2])
  );

CREATE POLICY "company_media_owner_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'company-media'
    AND (storage.foldername(name))[1] = 'companies'
    AND public.current_user_owns_company((storage.foldername(name))[2])
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER candidate_profiles_updated_at BEFORE UPDATE ON public.candidate_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER employer_profiles_updated_at BEFORE UPDATE ON public.employer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER candidate_subscriptions_updated_at BEFORE UPDATE ON public.candidate_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER vacancies_updated_at BEFORE UPDATE ON public.vacancies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION public.resolve_candidate_subscription_plan(candidate_profile_id UUID)
RETURNS subscription_plan AS $$
DECLARE
  resolved_plan subscription_plan;
BEGIN
  SELECT cs.plan
  INTO resolved_plan
  FROM public.candidate_profiles cp
  LEFT JOIN public.candidate_subscriptions cs
    ON cs.user_id = cp.user_id
    AND cs.status = 'active'
  WHERE cp.id = candidate_profile_id
  ORDER BY cs.started_at DESC NULLS LAST
  LIMIT 1;

  RETURN COALESCE(resolved_plan, 'free'::subscription_plan);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

CREATE OR REPLACE FUNCTION public.resolve_plan_visibility_score(plan_code subscription_plan)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE plan_code
    WHEN 'premium' THEN 30
    WHEN 'pro' THEN 12
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.enforce_candidate_application_quota()
RETURNS TRIGGER AS $$
DECLARE
  plan_code subscription_plan;
  daily_limit INTEGER;
  applications_today INTEGER;
BEGIN
  plan_code := public.resolve_candidate_subscription_plan(NEW.candidate_id);
  daily_limit := public.resolve_plan_daily_application_limit(plan_code);

  IF daily_limit IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO applications_today
  FROM public.applications
  WHERE candidate_id = NEW.candidate_id
    AND timezone('Asia/Baku', applied_at)::date = timezone('Asia/Baku', NOW())::date;

  IF applications_today >= daily_limit THEN
    RAISE EXCEPTION 'Daily application limit reached for current subscription plan';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_application_visibility_metadata()
RETURNS TRIGGER AS $$
DECLARE
  plan_code subscription_plan;
BEGIN
  plan_code := public.resolve_candidate_subscription_plan(NEW.candidate_id);
  NEW.subscription_plan := plan_code;
  NEW.visibility_score := public.resolve_plan_visibility_score(plan_code);

  IF NEW.cv_url IS NULL THEN
    SELECT cp.cv_url
    INTO NEW.cv_url
    FROM public.candidate_profiles cp
    WHERE cp.id = NEW.candidate_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER applications_quota_guard BEFORE INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.enforce_candidate_application_quota();
CREATE TRIGGER applications_set_visibility BEFORE INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_application_visibility_metadata();

-- Auto-increment applicant count on new application
CREATE OR REPLACE FUNCTION increment_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vacancies SET applicant_count = applicant_count + 1 WHERE id = NEW.vacancy_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_increment AFTER INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION increment_applicant_count();

CREATE OR REPLACE FUNCTION public.create_application_insert_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  vacancy_title TEXT;
BEGIN
  SELECT c.owner_id, v.title
  INTO target_user_id, vacancy_title
  FROM public.vacancies v
  JOIN public.companies c ON v.company_id = c.id
  WHERE v.id = NEW.vacancy_id;

  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      target_user_id,
      'new_application',
      'Yeni müraciət',
      COALESCE(vacancy_title, 'Vakansiya') || ' vakansiyasına yeni müraciət daxil oldu.',
      jsonb_build_object('applicationId', NEW.id, 'vacancyId', NEW.vacancy_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_application_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  vacancy_title TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT cp.user_id, v.title
  INTO target_user_id, vacancy_title
  FROM public.candidate_profiles cp
  JOIN public.vacancies v ON v.id = NEW.vacancy_id
  WHERE cp.id = NEW.candidate_id;

  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  notification_title := CASE NEW.status
    WHEN 'reviewed' THEN 'Müraciətiniz baxıldı'
    WHEN 'shortlisted' THEN 'Seçilmişlər siyahısına əlavə olundunuz'
    WHEN 'accepted' THEN 'Müraciətiniz qəbul edildi'
    WHEN 'rejected' THEN 'Müraciətiniz rədd edildi'
    ELSE 'Müraciət yeniləndi'
  END;

  notification_body := CASE NEW.status
    WHEN 'reviewed' THEN COALESCE(vacancy_title, 'Vakansiya') || ' vakansiyasına müraciətiniz baxıldı.'
    WHEN 'shortlisted' THEN COALESCE(vacancy_title, 'Vakansiya') || ' vakansiyası üçün seçilmişlər siyahısına əlavə olundunuz.'
    WHEN 'accepted' THEN COALESCE(vacancy_title, 'Vakansiya') || ' vakansiyası üçün müraciətiniz qəbul edildi.'
    WHEN 'rejected' THEN COALESCE(vacancy_title, 'Vakansiya') || ' vakansiyası üçün müraciətiniz rədd edildi.'
    ELSE COALESCE(vacancy_title, 'Vakansiya') || ' vakansiyası üzrə müraciət statusunuz yeniləndi.'
  END;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    target_user_id,
    'application_update',
    notification_title,
    notification_body,
    jsonb_build_object('applicationId', NEW.id, 'vacancyId', NEW.vacancy_id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER applications_notify_employer AFTER INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.create_application_insert_notification();
CREATE TRIGGER applications_notify_candidate AFTER UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.create_application_status_notification();

-- Create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, phone, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'candidate')::user_role,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(COALESCE(NEW.email, ''), '@', 1), 'User'),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

  IF COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'candidate') = 'candidate' THEN
    INSERT INTO public.candidate_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.candidate_subscriptions (user_id, plan, status, price_amount)
    VALUES (NEW.id, 'free', 'active', 0)
    ON CONFLICT DO NOTHING;
  ELSIF NEW.raw_user_meta_data->>'role' = 'employer' THEN
    INSERT INTO public.employer_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
      INSERT INTO public.companies (name, industry, owner_id)
      VALUES (NEW.raw_user_meta_data->>'company_name', 'General', NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
