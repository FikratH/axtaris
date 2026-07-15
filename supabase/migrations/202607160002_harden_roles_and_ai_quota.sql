-- Security hardening: prevent role self-escalation + per-user AI usage quota.

-- ============================================================
-- 1. Block non-admins from changing any role (closes the admin
--    self-promotion hole: profiles_update allowed owners to set role='admin').
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- auth.uid() IS NULL = trusted server/trigger context (e.g. handle_new_user).
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change a user role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- ============================================================
-- 2. Per-user daily AI quota (enforced by the ai-assist Edge Function).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT (timezone('Asia/Baku', now())::date),
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
-- No client policies: only the SECURITY DEFINER function below may touch it.

CREATE OR REPLACE FUNCTION public.consume_ai_quota(daily_limit INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  today DATE := timezone('Asia/Baku', now())::date;
  used INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.ai_usage (user_id, usage_date, count)
  VALUES (auth.uid(), today, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET count = ai_usage.count + 1
  RETURNING count INTO used;

  RETURN used <= daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.consume_ai_quota(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(INTEGER) TO authenticated;
