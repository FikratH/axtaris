-- ============================================================
-- Admin dashboard aggregate — one is_admin()-gated RPC returning every
-- dashboard stat in a single round trip (the old dashboard issued 12
-- parallel HEAD-count requests and still surfaced only counts).
--
-- Day boundaries use Asia/Baku, matching the ai_usage convention.
-- Grant: authenticated only. Unlike is_admin() (hotfix 202608070002),
-- this function is never referenced from an RLS policy expression, so
-- anon does not need EXECUTE on it to evaluate policies.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  baku_today DATE := timezone('Asia/Baku', now())::date;
  t_today TIMESTAMPTZ := (baku_today::timestamp AT TIME ZONE 'Asia/Baku');
  t_7d TIMESTAMPTZ := now() - interval '7 days';
  t_14d TIMESTAMPTZ := ((baku_today - 13)::timestamp AT TIME ZONE 'Asia/Baku');
  t_30d TIMESTAMPTZ := now() - interval '30 days';
  v_views_30 BIGINT;
  v_applies_30 BIGINT;
  result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_dashboard_stats: admin only';
  END IF;

  SELECT count(*) INTO v_views_30 FROM analytics_events WHERE event = 'vacancy_view' AND created_at >= t_30d;
  SELECT count(*) INTO v_applies_30 FROM analytics_events WHERE event = 'application_submit' AND created_at >= t_30d;

  SELECT jsonb_build_object(
    'users', (SELECT jsonb_build_object(
      'total', count(*),
      'candidates', count(*) FILTER (WHERE role = 'candidate'),
      'employers', count(*) FILTER (WHERE role = 'employer'),
      'admins', count(*) FILTER (WHERE role = 'admin'),
      'inactive', count(*) FILTER (WHERE is_active = false),
      'new_today', count(*) FILTER (WHERE created_at >= t_today),
      'new_7d', count(*) FILTER (WHERE created_at >= t_7d),
      'new_30d', count(*) FILTER (WHERE created_at >= t_30d),
      'with_push_token', count(*) FILTER (WHERE expo_push_token IS NOT NULL)
    ) FROM profiles),

    'candidates', (SELECT jsonb_build_object(
      'with_cv', count(*) FILTER (WHERE cv_url IS NOT NULL),
      'avg_completeness', COALESCE(round(avg(profile_completeness)), 0)
    ) FROM candidate_profiles),

    'companies', (SELECT jsonb_build_object(
      'total', count(*),
      'verified', count(*) FILTER (WHERE verification_status = 'verified'),
      'pending_verification', count(*) FILTER (WHERE verification_status = 'pending')
    ) FROM companies),

    'vacancies', (SELECT jsonb_build_object(
      'total', count(*),
      'active', count(*) FILTER (WHERE status = 'active'),
      'draft', count(*) FILTER (WHERE status = 'draft'),
      'pending_moderation', count(*) FILTER (WHERE status = 'pending_moderation'),
      'paused', count(*) FILTER (WHERE status = 'paused'),
      'closed', count(*) FILTER (WHERE status = 'closed'),
      'featured', count(*) FILTER (WHERE is_featured),
      'new_7d', count(*) FILTER (WHERE created_at >= t_7d),
      'total_views', COALESCE(sum(view_count), 0)
    ) FROM vacancies),

    'applications', (SELECT jsonb_build_object(
      'total', count(*),
      'today', count(*) FILTER (WHERE applied_at >= t_today),
      'last_7d', count(*) FILTER (WHERE applied_at >= t_7d),
      'pending', count(*) FILTER (WHERE status = 'pending'),
      'reviewed', count(*) FILTER (WHERE status = 'reviewed'),
      'shortlisted', count(*) FILTER (WHERE status = 'shortlisted'),
      'accepted', count(*) FILTER (WHERE status = 'accepted'),
      'rejected', count(*) FILTER (WHERE status = 'rejected')
    ) FROM applications),

    'funnel_30d', jsonb_build_object(
      'vacancy_views', v_views_30,
      'application_submits', v_applies_30,
      'conversion_pct', CASE WHEN v_views_30 > 0
        THEN round(v_applies_30::numeric * 100 / v_views_30, 1) ELSE 0 END
    ),

    'messaging', (SELECT jsonb_build_object(
      'messages_today', (SELECT count(*) FROM messages WHERE created_at >= t_today),
      'messages_7d', (SELECT count(*) FROM messages WHERE created_at >= t_7d),
      'conversations_total', count(*),
      'active_conversations_7d', count(*) FILTER (WHERE last_message_at >= t_7d),
      'support_conversations', count(*) FILTER (WHERE kind = 'support')
    ) FROM conversations),

    'invites', (SELECT jsonb_build_object(
      'total', count(*),
      'pending', count(*) FILTER (WHERE status = 'pending'),
      'accepted', count(*) FILTER (WHERE status = 'accepted'),
      'declined', count(*) FILTER (WHERE status = 'declined')
    ) FROM candidate_invites),

    'talent', jsonb_build_object(
      'profile_views_30d', (SELECT count(*) FROM profile_views WHERE viewed_at >= t_30d),
      'saved_jobs', (SELECT count(*) FROM saved_jobs),
      'saved_searches', (SELECT count(*) FROM saved_searches)
    ),

    'notifications_7d', COALESCE((SELECT jsonb_agg(jsonb_build_object('type', type, 'count', c) ORDER BY c DESC)
      FROM (SELECT type::text AS type, count(*) AS c FROM notifications
            WHERE created_at >= t_7d GROUP BY type) n), '[]'::jsonb),

    'moderation', jsonb_build_object(
      'open_flags', (SELECT count(*) FROM moderation_flags WHERE status = 'pending'),
      'resolved_7d', (SELECT count(*) FROM moderation_flags WHERE status <> 'pending' AND reviewed_at >= t_7d),
      'blocked_pairs', (SELECT count(*) FROM blocked_users)
    ),

    'ai', jsonb_build_object(
      'uses_today', (SELECT COALESCE(sum(count), 0) FROM ai_usage WHERE usage_date = baku_today),
      'uses_30d', (SELECT COALESCE(sum(count), 0) FROM ai_usage WHERE usage_date >= baku_today - 30),
      'users_30d', (SELECT count(DISTINCT user_id) FROM ai_usage WHERE usage_date >= baku_today - 30)
    ),

    'revenue', (SELECT jsonb_build_object(
      'candidate_mrr', COALESCE((SELECT sum(price_amount) FROM candidate_subscriptions WHERE status = 'active' AND price_amount > 0), 0),
      'employer_mrr', COALESCE((SELECT sum(price_amount) FROM employer_subscriptions WHERE status = 'active' AND price_amount > 0), 0),
      'paying_candidates', (SELECT count(*) FROM candidate_subscriptions WHERE status = 'active' AND price_amount > 0),
      'paying_employers', (SELECT count(*) FROM employer_subscriptions WHERE status = 'active' AND price_amount > 0)
    )),

    'daily_14d', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'day', d.day,
        'new_users', COALESCE(u.c, 0),
        'applications', COALESCE(a.c, 0),
        'messages', COALESCE(m.c, 0)
      ) ORDER BY d.day), '[]'::jsonb)
      FROM (SELECT generate_series(baku_today - 13, baku_today, interval '1 day')::date AS day) d
      LEFT JOIN (SELECT timezone('Asia/Baku', created_at)::date AS day, count(*) AS c
                 FROM profiles WHERE created_at >= t_14d GROUP BY 1) u ON u.day = d.day
      LEFT JOIN (SELECT timezone('Asia/Baku', applied_at)::date AS day, count(*) AS c
                 FROM applications WHERE applied_at >= t_14d GROUP BY 1) a ON a.day = d.day
      LEFT JOIN (SELECT timezone('Asia/Baku', created_at)::date AS day, count(*) AS c
                 FROM messages WHERE created_at >= t_14d GROUP BY 1) m ON m.day = d.day)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
