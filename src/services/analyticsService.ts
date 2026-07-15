import { getSupabase, shouldUseMockBackend } from './supabase';

export type AnalyticsEvent =
  | 'signin'
  | 'vacancy_view'
  | 'vacancy_publish'
  | 'application_submit'
  | 'message_sent';

/**
 * Fire-and-forget product analytics (ROADMAP #3). Instruments the core funnel
 * (publish → view → apply → message) so the admin surface can measure liquidity.
 * Never throws — a failed metric must never break a user action.
 */
class AnalyticsService {
  track(event: AnalyticsEvent, props: Record<string, unknown> = {}, userId?: string): void {
    if (shouldUseMockBackend()) return;
    void (async () => {
      try {
        await getSupabase()
          .from('analytics_events')
          .insert({ event, props, user_id: userId ?? null });
      } catch {
        // swallow — analytics is best-effort
      }
    })();
  }
}

export const analyticsService = new AnalyticsService();
