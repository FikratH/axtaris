-- Product analytics (ROADMAP #3) — funnel event instrumentation.
-- Users write their own events; only admins can read them.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_time
  ON public.analytics_events(event, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_insert" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_admin_select" ON public.analytics_events;

CREATE POLICY "analytics_insert" ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "analytics_admin_select" ON public.analytics_events FOR SELECT
  USING (public.is_admin());
