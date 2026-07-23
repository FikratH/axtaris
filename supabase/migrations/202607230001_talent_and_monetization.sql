-- Talent search, invites, profile views, saved searches, employer subscriptions,
-- candidate discoverability, and featured vacancies.
--
-- All changes are ADDITIVE and low-risk to existing flows (new nullable/defaulted
-- columns are backfilled; new tables are isolated). Apply with:
--   npx supabase db push
--
-- The app degrades gracefully if this migration has not been applied yet: the
-- new services catch "missing table/column" errors and show an unavailable state
-- instead of crashing.

-- 1. Candidate discoverability (opt-in, default ON) + featured vacancies -------
ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.vacancies
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_discoverable
  ON public.candidate_profiles(is_discoverable);
CREATE INDEX IF NOT EXISTS idx_vacancies_featured
  ON public.vacancies(is_featured);

-- 2. Employer subscriptions (mirror candidate_subscriptions) -------------------
CREATE TABLE IF NOT EXISTS public.employer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX IF NOT EXISTS idx_employer_subscriptions_user
  ON public.employer_subscriptions(user_id);
ALTER TABLE public.employer_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employer_subscriptions_select" ON public.employer_subscriptions;
CREATE POLICY "employer_subscriptions_select" ON public.employer_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "employer_subscriptions_insert" ON public.employer_subscriptions;
CREATE POLICY "employer_subscriptions_insert" ON public.employer_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "employer_subscriptions_update" ON public.employer_subscriptions;
CREATE POLICY "employer_subscriptions_update" ON public.employer_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS employer_subscriptions_updated_at ON public.employer_subscriptions;
CREATE TRIGGER employer_subscriptions_updated_at BEFORE UPDATE ON public.employer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Candidate invites (employer -> candidate) --------------------------------
CREATE TABLE IF NOT EXISTS public.candidate_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  vacancy_id UUID REFERENCES public.vacancies(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_candidate_invites_candidate ON public.candidate_invites(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_invites_company ON public.candidate_invites(company_id);
ALTER TABLE public.candidate_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invites_select" ON public.candidate_invites;
CREATE POLICY "invites_select" ON public.candidate_invites FOR SELECT USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  OR candidate_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "invites_insert" ON public.candidate_invites;
CREATE POLICY "invites_insert" ON public.candidate_invites FOR INSERT WITH CHECK (
  company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
);
DROP POLICY IF EXISTS "invites_update" ON public.candidate_invites;
CREATE POLICY "invites_update" ON public.candidate_invites FOR UPDATE USING (
  candidate_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
  OR company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
);

-- 4. Profile views (employer viewed a candidate card) -------------------------
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profile_views_candidate ON public.profile_views(candidate_id, viewed_at DESC);
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_views_select" ON public.profile_views;
CREATE POLICY "profile_views_select" ON public.profile_views FOR SELECT USING (
  candidate_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "profile_views_insert" ON public.profile_views;
CREATE POLICY "profile_views_insert" ON public.profile_views FOR INSERT WITH CHECK (
  company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
);

-- 5. Saved searches (candidate job-search filters) ----------------------------
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON public.saved_searches(user_id);
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_searches_all" ON public.saved_searches;
CREATE POLICY "saved_searches_all" ON public.saved_searches FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
