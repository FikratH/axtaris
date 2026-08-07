/**
 * Read-side dedupe and write-side reconcile of candidate child tables.
 *
 * Both live only on the Supabase path — `mapCandidateProfile` de-duplicates child
 * rows on read, and `reconcileChildRows` calls the `reconcile_candidate_child_rows`
 * RPC on write — so they are exercised against a hand-rolled fake Supabase client
 * rather than the in-memory mock. `./supabase` is mocked so `shouldUseMockBackend()`
 * is false and `getSupabase()` returns our fake.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const mockGetSupabase = jest.fn();

jest.mock('./supabase', () => ({
  shouldUseMockBackend: () => false,
  getSupabase: () => mockGetSupabase(),
  isSupabaseConfigured: () => true,
}));

import { candidateVacancyService } from './candidateVacancyService';

const baseProfileRow = {
  id: 'cand-1',
  user_id: 'user-1',
  title: 'Engineer',
  bio: null,
  location: 'Bakı',
  expected_salary: 3000,
  salary_currency: 'AZN',
  skills: ['React'],
  availability: 'two_weeks',
  work_preference: 'hybrid',
  portfolio_url: null,
  cv_url: null,
  cv_file_name: null,
  profile_completeness: 50,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  work_experiences: [] as unknown[],
  education: [] as unknown[],
  language_skills: [] as unknown[],
  certifications: [] as unknown[],
};

interface FakeConfig {
  /** Row returned by every candidate_profiles .maybeSingle() read. */
  profileRow: Record<string, unknown> | null;
  /** Ids the RPC "returns" from each reconcile call, keyed by table. */
  insertIds: Record<string, string[]>;
}

type RpcCall = { table: string; candidateId: string; rows: unknown[] };

/**
 * Minimal chainable stand-in for the Supabase query builder, covering only the
 * chains candidateVacancyService actually issues for reads:
 *   - candidate_profiles: select().eq().maybeSingle()  and  update().eq()
 * Writes to the 4 child tables go through `.rpc('reconcile_candidate_child_rows')`
 * instead of `.from(table)` — see `withRpc` below.
 */
function createFakeSupabase(config: FakeConfig, rpcImpl?: (call: RpcCall) => Promise<{ data: unknown; error: unknown }>) {
  const rpcCalls: RpcCall[] = [];

  const from = (_table: string) => {
    const state: { op?: 'update' } = {};

    const builder: Record<string, unknown> = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      limit: () => builder,
      in: () => builder,
      update: () => {
        state.op = 'update';
        return builder;
      },
      maybeSingle: () => Promise.resolve({ data: config.profileRow, error: null }),
      then: (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
        Promise.resolve({ error: null }).then(onF, onR),
    };

    return builder;
  };

  const rpc = (fnName: string, args: Record<string, unknown>) => {
    if (fnName !== 'reconcile_candidate_child_rows') {
      return Promise.resolve({ data: null, error: null });
    }
    const call: RpcCall = {
      table: args.p_table as string,
      candidateId: args.p_candidate_id as string,
      rows: args.p_rows as unknown[],
    };
    rpcCalls.push(call);

    if (rpcImpl) return rpcImpl(call);

    const ids = config.insertIds[call.table] || [];
    return Promise.resolve({ data: ids.map((id) => ({ id })), error: null });
  };

  return { client: { from, rpc } as unknown as SupabaseClient, rpcCalls };
}

describe('candidateVacancyService.fetchCandidateProfile — read-side dedupe', () => {
  it('collapses duplicate child rows returned by the DB', async () => {
    const work = {
      id: 'w1',
      job_title: 'Dev',
      company: 'Acme',
      location: 'Bakı',
      start_date: '2020-01-01',
      end_date: null,
      is_current: true,
      description: 'x',
      highlights: [],
      sort_order: 0,
    };
    const edu = {
      id: 'e1',
      degree: 'BSc',
      field_of_study: 'CS',
      institution: 'BSU',
      start_date: '2016-01-01',
      end_date: '2020-01-01',
      is_current: false,
      description: null,
      sort_order: 0,
    };
    const cert = {
      id: 'c1',
      name: 'AWS',
      issuer: 'Amazon',
      issue_date: '2023-01-01',
      expiry_date: null,
      credential_url: null,
    };

    const row = {
      ...baseProfileRow,
      work_experiences: [work, { ...work, id: 'w2' }],
      education: [edu, { ...edu, id: 'e2' }],
      // Same language, different casing → collapses on `language|level`.
      language_skills: [
        { id: 'l1', language: 'English', level: 'advanced' },
        { id: 'l2', language: 'english', level: 'advanced' },
      ],
      certifications: [cert, { ...cert, id: 'c2' }],
    };

    const { client } = createFakeSupabase({ profileRow: row, insertIds: {} });
    mockGetSupabase.mockReturnValue(client);

    const profile = await candidateVacancyService.fetchCandidateProfile('user-1');

    expect(profile).not.toBeNull();
    expect(profile!.workExperience).toHaveLength(1);
    expect(profile!.education).toHaveLength(1);
    expect(profile!.languages).toHaveLength(1);
    expect(profile!.certifications).toHaveLength(1);
  });
});

describe('candidateVacancyService.updateCandidateProfile — write-side reconcile', () => {
  it('reconciles via a single RPC call carrying the full desired row set', async () => {
    const { client, rpcCalls } = createFakeSupabase({
      profileRow: baseProfileRow,
      insertIds: {
        work_experiences: ['w-new-1', 'w-new-2'],
        education: [],
        language_skills: [],
        certifications: [],
      },
    });
    mockGetSupabase.mockReturnValue(client);

    await candidateVacancyService.updateCandidateProfile('user-1', {
      workExperience: [
        { id: 'tmp1', jobTitle: 'Dev', company: 'Acme', startDate: '2020-01-01', isCurrent: true },
        { id: 'tmp2', jobTitle: 'Sr Dev', company: 'Acme', startDate: '2022-01-01', isCurrent: true },
      ],
    });

    // Exactly one round trip for work_experiences — insert and delete used to
    // be two separate requests a concurrent save could interleave with; now
    // the whole reconcile is a single atomic call.
    const weCalls = rpcCalls.filter((c) => c.table === 'work_experiences');
    expect(weCalls).toHaveLength(1);
    expect(weCalls[0].rows).toHaveLength(2);
    expect(weCalls[0].candidateId).toBe('cand-1');
  });

  it('refuses (throws) when the RPC returns no ids for a non-empty desired set', async () => {
    const { client } = createFakeSupabase({
      profileRow: baseProfileRow,
      // RPC "succeeds" but returns no rows (e.g. a bug or an RLS surprise).
      insertIds: { work_experiences: [] },
    });
    mockGetSupabase.mockReturnValue(client);

    await expect(
      candidateVacancyService.updateCandidateProfile('user-1', {
        workExperience: [
          { id: 'tmp1', jobTitle: 'Dev', company: 'Acme', startDate: '2020-01-01', isCurrent: true },
        ],
      })
    ).rejects.toThrow();
  });
});

/**
 * Simulates the server-side behavior of the reconcile_candidate_child_rows
 * RPC closely enough to exercise the concurrency fix: each call is one atomic
 * insert+delete, and calls for the SAME (candidate, table) are serialized via
 * a promise chain — standing in for the real function's
 * `pg_advisory_xact_lock`. A second overlapping call only starts once the
 * first has fully "committed", so it sees the first call's rows as already
 * there instead of racing to delete them.
 */
function createSerializingStatefulSupabase() {
  const tables: Record<string, Array<{ id: string }>> = {
    work_experiences: [],
    education: [],
    language_skills: [],
    certifications: [],
  };
  const locks = new Map<string, Promise<unknown>>();
  let seq = 0;

  const rpc = (fnName: string, args: Record<string, unknown>) => {
    if (fnName !== 'reconcile_candidate_child_rows') return Promise.resolve({ data: null, error: null });

    const table = args.p_table as string;
    const candidateId = args.p_candidate_id as string;
    const rows = args.p_rows as unknown[];
    const lockKey = `${candidateId}:${table}`;

    const run = async () => {
      const ids = rows.map(() => `${table}-${(seq += 1)}`);
      tables[table] = [...ids.map((id) => ({ id }))]; // last writer replaces the set
      return { data: ids.map((id) => ({ id })), error: null };
    };

    const previous = locks.get(lockKey) || Promise.resolve();
    const next = previous.then(run, run);
    locks.set(lockKey, next);
    return next;
  };

  const from = () => ({
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: baseProfileRow, error: null }) }) }),
    update: () => ({ eq: () => Promise.resolve({ error: null }) }),
  });

  return { client: { from, rpc } as unknown as SupabaseClient, tables };
}

describe('candidateVacancyService.updateCandidateProfile — concurrent saves', () => {
  // Was a P0 data-loss bug: reconcileChildRows used to be insert-then-delete
  // as two SEPARATE requests, so two overlapping saves each deleted the
  // other's freshly-inserted rows, leaving zero. Fixed by
  // supabase/migrations/202608070006_reconcile_child_rows_rpc.sql — insert
  // and delete now happen inside one SECURITY DEFINER function call,
  // serialized per (candidate, table) with pg_advisory_xact_lock, so
  // overlapping saves resolve to last-write-wins instead of mutual
  // destruction.
  it('does not destroy a concurrent save\'s rows (last writer wins, never zero)', async () => {
    const fake = createSerializingStatefulSupabase();
    mockGetSupabase.mockReturnValue(fake.client);

    await Promise.all([
      candidateVacancyService.updateCandidateProfile('user-1', {
        workExperience: [
          { id: 'tmp-a', jobTitle: 'Dev', company: 'Acme', startDate: '2020-01-01', isCurrent: true },
        ],
      }),
      candidateVacancyService.updateCandidateProfile('user-1', {
        workExperience: [
          { id: 'tmp-b', jobTitle: 'Sr Dev', company: 'Acme', startDate: '2022-01-01', isCurrent: true },
        ],
      }),
    ]);

    expect(fake.tables.work_experiences.length).toBeGreaterThan(0);
  });
});
