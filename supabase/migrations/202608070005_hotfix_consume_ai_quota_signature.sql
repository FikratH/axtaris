-- ============================================================
-- HOTFIX for 202608070001_security_hardening.sql's F8 fix.
--
-- That migration replaced consume_ai_quota(daily_limit INTEGER) with a
-- no-arg consume_ai_quota(), and DROPPED the old signature. The currently
-- DEPLOYED ai-assist and parse-resume Edge Functions still call
-- `.rpc('consume_ai_quota', { daily_limit })` (the repo's source for both
-- was updated to the no-arg call, but this environment has no
-- SUPABASE_ACCESS_TOKEN / CLI auth available to run `supabase functions
-- deploy` — deploying the matching function code is an owner action).
-- Confirmed live: every ai-assist/parse-resume call started failing with
-- `Could not find the function public.consume_ai_quota(daily_limit)`.
--
-- Fix: restore the original single-argument signature so the currently-
-- deployed function code keeps working with ZERO redeploy needed, but
-- ignore the caller-supplied value and use the same fixed 30/day ceiling
-- — this keeps the actual security property (the limit can no longer be
-- forged via a direct RPC call) while restoring live compatibility.
-- Once the owner deploys the updated function source (which now calls
-- the no-arg form), both signatures can keep coexisting harmlessly, or
-- this compatibility shim can be dropped in a later migration.
-- ============================================================

BEGIN;

DROP FUNCTION IF EXISTS public.consume_ai_quota();

CREATE OR REPLACE FUNCTION public.consume_ai_quota(daily_limit INTEGER DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  today DATE := timezone('Asia/Baku', now())::date;
  used INTEGER;
  fixed_daily_limit CONSTANT INTEGER := 30;
BEGIN
  -- daily_limit is intentionally ignored (see header) — a caller can no
  -- longer inflate the ceiling by passing a large value.
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

REVOKE ALL ON FUNCTION public.consume_ai_quota(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_ai_quota(INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(INTEGER) TO authenticated;

COMMIT;
