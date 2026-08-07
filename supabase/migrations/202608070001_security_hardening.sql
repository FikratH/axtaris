-- ============================================================
-- Security hardening pass — closes 6 findings from the 2026-08-07
-- production-readiness audit (security-auditor F1, F2, F4, F5, F6, F7, F11).
-- All are live-verified or policy-semantics-verified against production.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- F2 — Self-service admin escalation via signup metadata.
-- handle_new_user() cast client-controlled raw_user_meta_data->>'role'
-- straight into user_role with no allow-list, and the escalation guard
-- only fired on UPDATE, never INSERT. A signup with {role:'admin'} became
-- an admin. Fix: whitelist signup-time role to {candidate, employer} —
-- both are legitimate self-service signup paths in this product — and
-- silently fall back to 'candidate' for anything else (incl. 'admin').
-- Also extend the escalation guard to BEFORE INSERT as defense-in-depth
-- (no client-facing INSERT policy exists on profiles today, so this is
-- belt-and-suspenders, not a behavior change for legitimate signup).
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT := NULLIF(NEW.raw_user_meta_data->>'role', '');
  safe_role user_role := CASE
    WHEN requested_role IN ('candidate', 'employer') THEN requested_role::user_role
    ELSE 'candidate'::user_role
  END;
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, phone, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    safe_role,
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

  IF safe_role = 'candidate' THEN
    INSERT INTO public.candidate_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.candidate_subscriptions (user_id, plan, status, price_amount)
    VALUES (NEW.id, 'free', 'active', 0)
    ON CONFLICT DO NOTHING;
  ELSIF safe_role = 'employer' THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- auth.uid() IS NULL = trusted server/trigger context (handle_new_user,
    -- which already resolves a safe role above). Only clamp rows inserted
    -- under an authenticated client context, which should not happen today
    -- (no client-facing INSERT policy exists on profiles) but is cheap
    -- defense-in-depth against a future policy change.
    IF NEW.role NOT IN ('candidate', 'employer') AND auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      NEW.role := 'candidate';
    END IF;
  ELSE
    IF NEW.role IS DISTINCT FROM OLD.role
       AND auth.uid() IS NOT NULL
       AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change a user role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- ────────────────────────────────────────────────────────────
-- F4 — applications_update had no WITH CHECK, so Postgres reused USING
-- (which only constrains vacancy_id) for the new row — candidate_id was
-- completely unconstrained, letting an employer forge candidate_id to
-- attach any application to any candidate and unlock their PII/CV via
-- employer_sees_candidate(). Pin both columns on the new row.
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "applications_update" ON public.applications;
CREATE POLICY "applications_update" ON public.applications FOR UPDATE
  USING (
    vacancy_id IN (SELECT v.id FROM public.vacancies v JOIN public.companies c ON v.company_id = c.id WHERE c.owner_id = auth.uid())
  )
  WITH CHECK (
    vacancy_id IN (SELECT v.id FROM public.vacancies v JOIN public.companies c ON v.company_id = c.id WHERE c.owner_id = auth.uid())
    AND candidate_id IN (
      SELECT a.candidate_id FROM public.applications a WHERE a.id = applications.id
    )
  );

-- ────────────────────────────────────────────────────────────
-- F1 — profiles.email / phone / expo_push_token are readable by ANY
-- authenticated user via the broad profiles_select policy (needed for
-- name/avatar display on talent cards and chat — RLS is row-level, it
-- can't restrict this to specific columns). Live-confirmed: a plain
-- employer account could dump every user's email, phone, and live Expo
-- push token. Fix: revoke the blanket column-set grant and re-grant only
-- the non-sensitive columns; expose email/phone through a relationship-
-- gated SECURITY DEFINER RPC instead (self, admin, or employer-of-
-- applicant). expo_push_token is write-only in the client already, so
-- dropping SELECT on it is free — UPDATE stays granted (push
-- registration still works).
-- ────────────────────────────────────────────────────────────

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, role, full_name, avatar_url, email_verified, is_active, created_at, updated_at
) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_profile_contact(target_id UUID)
RETURNS TABLE (email TEXT, phone TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.email, p.phone
  FROM public.profiles p
  WHERE p.id = target_id
    AND (
      auth.uid() = target_id
      OR public.is_admin()
      OR EXISTS (
        -- caller is an employer who has an application from this candidate
        SELECT 1
        FROM public.candidate_profiles cp
        JOIN public.applications a ON a.candidate_id = cp.id
        JOIN public.vacancies v ON v.id = a.vacancy_id
        JOIN public.companies c ON c.id = v.company_id
        WHERE cp.user_id = target_id
          AND c.owner_id = auth.uid()
      )
    );
$$;

REVOKE ALL ON FUNCTION public.get_profile_contact(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_profile_contact(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_profile_contact(UUID) TO authenticated;

-- Admin-only bulk user list + search (replaces a direct table SELECT of
-- id,email,role,full_name,avatar_url,is_active,created_at that would now
-- fail on the revoked email column for non-admins; this RPC checks
-- is_admin() itself rather than relying on column grants).
CREATE OR REPLACE FUNCTION public.admin_list_profiles(search_term TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID, email TEXT, role user_role, full_name TEXT,
  avatar_url TEXT, is_active BOOLEAN, created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.id, p.email, p.role, p.full_name, p.avatar_url, p.is_active, p.created_at
  FROM public.profiles p
  WHERE public.is_admin()
    AND (
      search_term IS NULL
      OR p.full_name ILIKE '%' || search_term || '%'
      OR p.email ILIKE '%' || search_term || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_profiles(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles(TEXT) TO authenticated;

-- ────────────────────────────────────────────────────────────
-- F5 — companies_select has no TO clause (applies to anon too) and no
-- column restriction, so owner_id (a real auth.users UUID — the join key
-- for targeted attacks) is live-readable by anyone, no login required.
-- Keep the public listing (name/logo/etc.) anon-readable; drop owner_id
-- from the anon-reachable column set. authenticated keeps full access
-- (companies_update's RLS check needs it, and it's far less sensitive
-- once the caller is an identifiable, logged-in user).
-- ────────────────────────────────────────────────────────────

REVOKE SELECT ON public.companies FROM anon;
GRANT SELECT (
  id, name, industry, description, logo_url, cover_url, website,
  employee_count, location, founded_year, verification_status, rating,
  created_at, updated_at
) ON public.companies TO anon;

-- ────────────────────────────────────────────────────────────
-- F6 — owns_candidate_profile / candidate_discoverable /
-- employer_sees_candidate / is_admin were REVOKEd from PUBLIC in prior
-- migrations but remain live-callable by the anon key — Supabase applies
-- a default ALTER DEFAULT PRIVILEGES grant of EXECUTE directly to the
-- anon role (not via PUBLIC), which a PUBLIC-only revoke doesn't touch.
-- Explicitly revoke from anon on all four.
-- ────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.owns_candidate_profile(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.candidate_discoverable(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.employer_sees_candidate(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;

-- ────────────────────────────────────────────────────────────
-- F7 — resolve_candidate_subscription_plan is SECURITY DEFINER with no
-- REVOKE FROM PUBLIC at all, and is anon-callable: anyone can enumerate
-- which candidates pay. It's only ever called internally (from another
-- SECURITY DEFINER trigger function in this same file), so no role needs
-- direct EXECUTE — a SECURITY DEFINER caller doesn't need its own EXECUTE
-- grant on a function it invokes internally.
-- ────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.resolve_candidate_subscription_plan(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_candidate_subscription_plan(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.resolve_candidate_subscription_plan(UUID) FROM authenticated;

-- ────────────────────────────────────────────────────────────
-- F11 — conversations_insert only checked auth.uid() = participant_a;
-- kind, application_id, and participant_b were all caller-controlled, so
-- any authenticated user could open a conversation with (DM) any other
-- profile. Tighten to the two legitimate shapes: a support thread (no
-- counterparty) or an application thread where the caller and
-- participant_b are genuinely the candidate and employer-owner of that
-- exact application (either can be the initiator — see chatService.ts
-- getOrCreateApplicationConversation, which lets either side create it).
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  WITH CHECK (
    auth.uid() = participant_a
    AND (
      (kind = 'support' AND participant_b IS NULL)
      OR (
        kind = 'application'
        AND application_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.applications a
          JOIN public.candidate_profiles cp ON cp.id = a.candidate_id
          JOIN public.vacancies v ON v.id = a.vacancy_id
          JOIN public.companies c ON c.id = v.company_id
          WHERE a.id = application_id
            AND (
              (cp.user_id = auth.uid() AND participant_b = c.owner_id)
              OR (c.owner_id = auth.uid() AND participant_b = cp.user_id)
            )
        )
      )
    )
  );

-- ────────────────────────────────────────────────────────────
-- F8 (partial) — consume_ai_quota(daily_limit INTEGER) accepted the
-- ceiling as a caller-supplied parameter while being GRANTed to
-- authenticated, so a user could call the RPC directly with an inflated
-- daily_limit. Resolve the limit server-side inside the function instead
-- (hardcoded to 30, matching both edge functions' current AI_DAILY_LIMIT
-- default) so the parameter can no longer be forged.
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.consume_ai_quota(INTEGER);

CREATE OR REPLACE FUNCTION public.consume_ai_quota()
RETURNS BOOLEAN AS $$
DECLARE
  today DATE := timezone('Asia/Baku', now())::date;
  used INTEGER;
  fixed_daily_limit CONSTANT INTEGER := 30;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.ai_usage (user_id, usage_date, count)
  VALUES (auth.uid(), today, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET count = ai_usage.count + 1
  RETURNING count INTO used;

  RETURN used <= fixed_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.consume_ai_quota() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_ai_quota() FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota() TO authenticated;

COMMIT;
