/**
 * Client/DB parity for the candidate daily application limit.
 *
 * This limit is enforced TWICE and the two must agree:
 *   - client: `applicationsPerDay` in src/utils/entitlements.ts, which drives the
 *     paywall/upsell copy and the pre-flight check in applyToVacancy;
 *   - DB: `public.resolve_plan_daily_application_limit(subscription_plan)`, called
 *     by the `applications_quota_guard` BEFORE INSERT trigger, which RAISEs.
 *
 * They have drifted before: the client advertised 10/day for pro while the trigger
 * returned 7, so pro users hit a raw "Daily application limit reached" Postgres
 * error three applications short of the quota they had paid for (fixed by
 * supabase/migrations/202607150001_pro_quota_and_dedupe.sql). A unit test on the
 * TypeScript constants alone cannot catch that class of bug, because the number
 * that actually rejects the INSERT lives in SQL. So this test reads the migrations
 * off disk and asserts the two sides agree.
 *
 * Migrations apply in filename order and the function is CREATE OR REPLACE'd, so
 * the effective definition is the one in the LAST migration that defines it.
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { SubscriptionPlanCode } from '@/types/models';
import { getCandidateEntitlements } from './entitlements';

const MIGRATIONS_DIR = join(__dirname, '..', '..', 'supabase', 'migrations');
const FUNCTION_NAME = 'resolve_plan_daily_application_limit';

/**
 * The plan -> limit map from the last migration defining the resolver.
 * `null` models SQL NULL, which the trigger treats as "unlimited" (it returns
 * early without counting), matching the client's `applicationsPerDay: null`.
 */
function readDbDailyLimits(): { source: string; limits: Record<string, number | null> } {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  const defining = files.filter((name) =>
    readFileSync(join(MIGRATIONS_DIR, name), 'utf8').includes(`FUNCTION public.${FUNCTION_NAME}`)
  );

  if (defining.length === 0) {
    throw new Error(`No migration defines public.${FUNCTION_NAME}`);
  }

  const source = defining[defining.length - 1];
  const sql = readFileSync(join(MIGRATIONS_DIR, source), 'utf8');

  // Isolate the resolver's body so a CASE in a neighbouring function can't leak in.
  const start = sql.indexOf(`FUNCTION public.${FUNCTION_NAME}`);
  const body = sql.slice(start, sql.indexOf('$$ LANGUAGE', start));

  const limits: Record<string, number | null> = {};
  for (const [, plan, value] of body.matchAll(/WHEN\s+'(\w+)'\s+THEN\s+(\d+)/gi)) {
    limits[plan] = Number.parseInt(value, 10);
  }

  // `ELSE NULL` is what makes premium unlimited; capture it as an explicit branch.
  if (/ELSE\s+NULL/i.test(body)) limits.__else = null;

  return { source, limits };
}

describe('candidate daily application limit — client/DB parity', () => {
  const { source, limits } = readDbDailyLimits();

  it('reads a usable resolver out of the migrations', () => {
    expect(source).toMatch(/\.sql$/);
    // Guards the parser itself: if the SQL shape changes and nothing is matched,
    // every assertion below would vacuously compare undefined to undefined.
    expect(Object.keys(limits).length).toBeGreaterThan(0);
    expect(limits.free).toEqual(expect.any(Number));
  });

  it.each<SubscriptionPlanCode>(['free', 'pro', 'premium'])(
    'the %s plan limit matches between entitlements.ts and the DB resolver',
    (plan) => {
      const client = getCandidateEntitlements(plan).applicationsPerDay;
      // A plan with no explicit WHEN branch falls through to ELSE NULL (unlimited).
      const db = plan in limits ? limits[plan] : limits.__else;

      expect(db).toBe(client);
    }
  );

  it('still enforces 3 / 10 / unlimited on the DB side', () => {
    expect(limits.free).toBe(3);
    expect(limits.pro).toBe(10);
    expect('premium' in limits ? limits.premium : limits.__else).toBeNull();
  });

  it('leaves premium uncapped on both sides, so the trigger never counts for them', () => {
    // The trigger returns NEW early when the limit is NULL; if a number ever
    // appears here, premium silently acquires a cap the paywall does not mention.
    expect(getCandidateEntitlements('premium').applicationsPerDay).toBeNull();
    expect('premium' in limits ? limits.premium : limits.__else).toBeNull();
  });
});

describe('candidate application quota trigger — enforcement shape', () => {
  const sql = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => readFileSync(join(MIGRATIONS_DIR, name), 'utf8'))
    .join('\n');

  it('counts applications in Asia/Baku, matching the client day-key', () => {
    // subscriptionService derives "today" with
    // `toLocaleDateString('en-CA', { timeZone: 'Asia/Baku' })`. If the trigger
    // counted in UTC instead, the client's remaining-count and the DB's decision
    // would disagree for four hours every night.
    expect(sql).toContain("timezone('Asia/Baku', applied_at)::date");
    expect(sql).toContain("timezone('Asia/Baku', NOW())::date");
  });

  it('rejects at >= the limit, matching the client\'s "remaining <= 0" gate', () => {
    expect(sql).toContain('IF applications_today >= daily_limit THEN');
  });

  it('keeps the BEFORE INSERT trigger wired to the applications table', () => {
    // The client check is advisory only (it reads a cached summary); this trigger
    // is the actual enforcement, so losing it silently makes the quota free.
    expect(sql).toMatch(
      /CREATE TRIGGER applications_quota_guard BEFORE INSERT ON public\.applications/
    );
  });
});
