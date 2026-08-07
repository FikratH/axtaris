-- Server-side backstop for the employer invitesPerMonth entitlement
-- (src/utils/entitlements.ts: free=5, pro=50, premium=unlimited). The app UI
-- already pre-checks this client-side (app/talent/[id].tsx,
-- app/(employer)/talent.tsx) and blocks the button before ever calling
-- sendInvite() past the limit — but nothing server-side enforced it, so a
-- free employer could insert unlimited candidate_invites rows via direct
-- PostgREST calls. Mirrors the existing applications_quota_guard pattern
-- (202605060000_initial_schema.sql) exactly: a BEFORE INSERT trigger as a
-- defense-in-depth backstop, not a replacement for the client-side UX gate.

CREATE OR REPLACE FUNCTION public.resolve_employer_subscription_plan(p_owner_id UUID)
RETURNS subscription_plan AS $$
DECLARE
  resolved_plan subscription_plan;
BEGIN
  SELECT es.plan
  INTO resolved_plan
  FROM public.employer_subscriptions es
  WHERE es.user_id = p_owner_id
    AND es.status = 'active'
  ORDER BY es.started_at DESC
  LIMIT 1;

  RETURN COALESCE(resolved_plan, 'free'::subscription_plan);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.resolve_plan_invites_per_month(plan_code subscription_plan)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE plan_code
    WHEN 'free' THEN 5
    WHEN 'pro' THEN 50
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.enforce_employer_invite_quota()
RETURNS TRIGGER AS $$
DECLARE
  owner UUID;
  plan_code subscription_plan;
  monthly_limit INTEGER;
  invites_this_month INTEGER;
BEGIN
  SELECT owner_id INTO owner FROM public.companies WHERE id = NEW.company_id;
  IF owner IS NULL THEN
    RETURN NEW;
  END IF;

  plan_code := public.resolve_employer_subscription_plan(owner);
  monthly_limit := public.resolve_plan_invites_per_month(plan_code);

  IF monthly_limit IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO invites_this_month
  FROM public.candidate_invites
  WHERE company_id = NEW.company_id
    AND date_trunc('month', timezone('Asia/Baku', created_at))
      = date_trunc('month', timezone('Asia/Baku', NOW()));

  IF invites_this_month >= monthly_limit THEN
    RAISE EXCEPTION 'Monthly invite limit reached for current subscription plan';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS candidate_invites_quota_guard ON public.candidate_invites;
CREATE TRIGGER candidate_invites_quota_guard
  BEFORE INSERT ON public.candidate_invites
  FOR EACH ROW EXECUTE FUNCTION public.enforce_employer_invite_quota();
