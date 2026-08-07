/**
 * Candidate subscription summary — the quota numbers the apply flow gates on.
 *
 * `fetchCandidateSubscriptionSummary` is what applyToVacancy consults before it
 * lets an application through (`applicationsRemainingToday <= 0` throws), and what
 * every quota banner/upsell renders from. It is also the client half of a
 * two-sided enforcement: the DB trigger counts the day in Asia/Baku, so this side
 * must bucket days identically or the two disagree overnight. See
 * entitlements.migrationParity.test.ts for the limit-value half of that contract.
 *
 * `./supabase` is mocked so the real (non-mock) path runs against a fake client,
 * which is where the day-bucketing and the paging window actually live.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const mockGetSupabase = jest.fn();

jest.mock('./supabase', () => ({
  shouldUseMockBackend: () => false,
  getSupabase: () => mockGetSupabase(),
  isSupabaseConfigured: () => true,
}));

import { subscriptionService } from './subscriptionService';

type PlanCode = 'free' | 'pro' | 'premium';

interface FakeConfig {
  plan: PlanCode | null;
  /** `applied_at` timestamps the applications table "contains", newest first. */
  appliedAt: string[];
  /** The `.gte('applied_at', ...)` threshold the service asks for; assertable. */
  onGte?: (threshold: string) => void;
}

/**
 * Covers the three chains fetchCandidateSubscriptionSummary issues:
 *   candidate_subscriptions: select().eq().eq().order().limit().maybeSingle()
 *   candidate_profiles:      select().eq().maybeSingle()
 *   applications:            select('id',{count:'exact',head:true}).eq().gte()  [awaited directly]
 *
 * The applications count is computed here by filtering `appliedAt` against the
 * `.gte()` threshold the service passes — this fake doesn't know Baku day
 * bucketing, it just mirrors whatever instant the service computed, so these
 * tests are really asserting the service's own bucketing is correct.
 */
function createFakeSupabase(config: FakeConfig) {
  const from = (table: string) => {
    let gteThreshold: string | null = null;

    const builder: Record<string, unknown> = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      limit: () => builder,
      gte: (_col: string, value: string) => {
        gteThreshold = value;
        config.onGte?.(value);
        return builder;
      },
      maybeSingle: () => {
        if (table === 'candidate_subscriptions') {
          return Promise.resolve({
            data: config.plan
              ? {
                  id: 'sub-1',
                  user_id: 'user-1',
                  plan: config.plan,
                  status: 'active',
                  price_amount: 0,
                  price_currency: 'AZN',
                  billing_interval: 'month',
                  started_at: '2024-01-01T00:00:00Z',
                  expires_at: null,
                  canceled_at: null,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                }
              : null,
            error: null,
          });
        }
        return Promise.resolve({ data: { id: 'cand-1' }, error: null });
      },
      // The applications count query is awaited without a terminal method.
      then: (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) => {
        const count = gteThreshold
          ? config.appliedAt.filter((ts) => ts >= (gteThreshold as string)).length
          : config.appliedAt.length;
        return Promise.resolve({ count, data: null, error: null }).then(onF, onR);
      },
    };
    return builder;
  };

  return { from } as unknown as SupabaseClient;
}

/** An ISO instant at a given wall-clock hour on 2024-06-15 in Baku (UTC+4). */
function bakuTime(hourUtcPlus4: number): string {
  const utcHour = hourUtcPlus4 - 4;
  const day = utcHour < 0 ? 14 : 15;
  const h = ((utcHour % 24) + 24) % 24;
  return `2024-06-${String(day).padStart(2, '0')}T${String(h).padStart(2, '0')}:30:00Z`;
}

describe('fetchCandidateSubscriptionSummary — limits per plan', () => {
  it('reports 3/day for free and counts today against it', async () => {
    mockGetSupabase.mockReturnValue(
      createFakeSupabase({ plan: 'free', appliedAt: [bakuTime(10), bakuTime(9)] })
    );
    jest.useFakeTimers().setSystemTime(new Date(bakuTime(12)));

    const summary = await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(summary?.dailyApplicationLimit).toBe(3);
    expect(summary?.applicationsUsedToday).toBe(2);
    expect(summary?.applicationsRemainingToday).toBe(1);
  });

  it('reports 10/day for pro', async () => {
    mockGetSupabase.mockReturnValue(createFakeSupabase({ plan: 'pro', appliedAt: [bakuTime(10)] }));
    jest.useFakeTimers().setSystemTime(new Date(bakuTime(12)));

    const summary = await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(summary?.dailyApplicationLimit).toBe(10);
    expect(summary?.applicationsRemainingToday).toBe(9);
  });

  it('reports an unlimited (null) allowance for premium rather than a large number', async () => {
    // applyToVacancy short-circuits on `dailyApplicationLimit !== null`, so a
    // numeric stand-in for "unlimited" would reintroduce a cap for paying users.
    mockGetSupabase.mockReturnValue(
      createFakeSupabase({ plan: 'premium', appliedAt: [bakuTime(10), bakuTime(9)] })
    );
    jest.useFakeTimers().setSystemTime(new Date(bakuTime(12)));

    const summary = await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(summary?.dailyApplicationLimit).toBeNull();
    expect(summary?.applicationsRemainingToday).toBeNull();
    expect(summary?.applicationsUsedToday).toBe(2);
  });

  it('falls back to the free plan when no active subscription row exists', async () => {
    mockGetSupabase.mockReturnValue(createFakeSupabase({ plan: null, appliedAt: [] }));
    jest.useFakeTimers().setSystemTime(new Date(bakuTime(12)));

    const summary = await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(summary?.subscription.plan).toBe('free');
    expect(summary?.dailyApplicationLimit).toBe(3);
    expect(summary?.applicationsRemainingToday).toBe(3);
  });

  it('returns null without touching the network for a missing user id', async () => {
    mockGetSupabase.mockReturnValue(createFakeSupabase({ plan: 'free', appliedAt: [] }));

    await expect(subscriptionService.fetchCandidateSubscriptionSummary('')).resolves.toBeNull();
  });
});

describe('fetchCandidateSubscriptionSummary — remaining never goes negative', () => {
  it('clamps to 0 when the DB already holds more applications than the limit', async () => {
    // Reachable after a downgrade (pro -> free mid-day) or a race that slipped
    // past the trigger. A negative remaining would read as "unlimited"-ish in the
    // banner and, worse, make `remaining <= 0` the only thing standing between the
    // user and a raw Postgres error.
    mockGetSupabase.mockReturnValue(
      createFakeSupabase({
        plan: 'free',
        appliedAt: [bakuTime(10), bakuTime(9), bakuTime(8), bakuTime(7), bakuTime(6)],
      })
    );
    jest.useFakeTimers().setSystemTime(new Date(bakuTime(12)));

    const summary = await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(summary?.applicationsUsedToday).toBe(5);
    expect(summary?.applicationsRemainingToday).toBe(0);
  });

  it('blocks at exactly the limit, matching the trigger\'s `>=` rejection', async () => {
    mockGetSupabase.mockReturnValue(
      createFakeSupabase({ plan: 'free', appliedAt: [bakuTime(10), bakuTime(9), bakuTime(8)] })
    );
    jest.useFakeTimers().setSystemTime(new Date(bakuTime(12)));

    const summary = await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(summary?.applicationsRemainingToday).toBe(0);
  });
});

describe('fetchCandidateSubscriptionSummary — Asia/Baku day bucketing', () => {
  it('excludes applications from the previous Baku day', async () => {
    mockGetSupabase.mockReturnValue(
      createFakeSupabase({
        plan: 'free',
        // 23:30 Baku on 2024-06-14 is 19:30Z the day before "now".
        appliedAt: ['2024-06-14T19:30:00Z', bakuTime(10)],
      })
    );
    jest.useFakeTimers().setSystemTime(new Date(bakuTime(12)));

    const summary = await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(summary?.applicationsUsedToday).toBe(1);
  });

  it('counts a late-evening Baku application that is already "tomorrow" in UTC', async () => {
    // 2024-06-15T21:00Z is 2024-06-16 01:00 in Baku. With "now" also at 01:30 Baku
    // on the 16th, both sit in the same Baku day even though a naive UTC-date
    // bucket would place them on different days from the 15th.
    mockGetSupabase.mockReturnValue(
      createFakeSupabase({ plan: 'free', appliedAt: ['2024-06-15T21:00:00Z'] })
    );
    jest.useFakeTimers().setSystemTime(new Date('2024-06-15T21:30:00Z'));

    const summary = await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(summary?.applicationsUsedToday).toBe(1);
    expect(summary?.applicationsRemainingToday).toBe(2);
  });

  it('does not count an application made just before Baku midnight as today', async () => {
    // 2024-06-15T19:00Z = 23:00 Baku on the 15th. "Now" is 00:30 Baku on the 16th,
    // so the quota has rolled over and the earlier application must not count.
    mockGetSupabase.mockReturnValue(
      createFakeSupabase({ plan: 'free', appliedAt: ['2024-06-15T19:00:00Z'] })
    );
    jest.useFakeTimers().setSystemTime(new Date('2024-06-15T20:30:00Z'));

    const summary = await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(summary?.applicationsUsedToday).toBe(0);
    expect(summary?.applicationsRemainingToday).toBe(3);
  });
});

describe('fetchCandidateSubscriptionSummary — usage counting has no row cap', () => {
  it('counts more than 20 same-day applications correctly (no silent under-report)', async () => {
    // Was previously a capped `.limit(20)` row fetch filtered to today in JS —
    // a candidate with more than 20 applications today would silently
    // under-count (and, since this number gates further applies, under-enforce).
    // Now an exact server-side count with a date-range filter, so there is no
    // window size to exceed.
    const manyToday = Array.from({ length: 25 }, () => bakuTime(10));
    mockGetSupabase.mockReturnValue(createFakeSupabase({ plan: 'pro', appliedAt: manyToday }));
    jest.useFakeTimers().setSystemTime(new Date(bakuTime(12)));

    const summary = await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(summary?.applicationsUsedToday).toBe(25);
    expect(summary?.applicationsRemainingToday).toBe(0);
  });

  it('passes a start-of-Baku-day gte threshold rather than a row limit', async () => {
    const thresholds: string[] = [];
    mockGetSupabase.mockReturnValue(
      createFakeSupabase({ plan: 'pro', appliedAt: [], onGte: (t) => thresholds.push(t) })
    );
    jest.useFakeTimers().setSystemTime(new Date(bakuTime(12)));

    await subscriptionService.fetchCandidateSubscriptionSummary('user-1');

    expect(thresholds).toHaveLength(1);
    expect(thresholds[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});
