/**
 * Read-side dedupe and write-side reconcile of candidate child tables.
 *
 * Both live only on the Supabase path — `mapCandidateProfile` de-duplicates child
 * rows on read, and `reconcileChildRows` inserts-fresh-then-deletes-others on
 * write — so they are exercised against a hand-rolled fake Supabase client rather
 * than the in-memory mock. `./supabase` is mocked so `shouldUseMockBackend()` is
 * false and `getSupabase()` returns our fake.
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
  /** Ids the DB "returns" from each child-table insert().select('id'). */
  insertIds: Record<string, string[]>;
}

/**
 * Minimal chainable stand-in for the Supabase query builder covering only the
 * chains candidateVacancyService actually issues:
 *   - candidate_profiles: select().eq().maybeSingle()  and  update().eq()
 *   - child tables:       insert().select('id')        and  delete().eq().not()
 * It records every insert/delete so tests can assert the reconcile strategy.
 */
function createFakeSupabase(config: FakeConfig) {
  const inserts: Array<{ table: string; rows: unknown[] }> = [];
  const deletes: Array<{ table: string; not?: [string, string, string] }> = [];

  const from = (table: string) => {
    const state: { op?: 'insert' | 'update' | 'delete'; not?: [string, string, string] } = {};

    const resolveTerminal = () => {
      if (state.op === 'insert') {
        return { data: (config.insertIds[table] || []).map((id) => ({ id })), error: null };
      }
      if (state.op === 'delete') {
        deletes.push({ table, not: state.not });
        return { error: null };
      }
      if (state.op === 'update') {
        return { error: null };
      }
      return { data: null, error: null };
    };

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
      insert: (rows: unknown[]) => {
        state.op = 'insert';
        inserts.push({ table, rows });
        return builder;
      },
      delete: () => {
        state.op = 'delete';
        return builder;
      },
      not: (col: string, op: string, val: string) => {
        state.not = [col, op, val];
        return builder;
      },
      maybeSingle: () => Promise.resolve({ data: config.profileRow, error: null }),
      single: () => Promise.resolve(resolveTerminal()),
      then: (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
        Promise.resolve(resolveTerminal()).then(onF, onR),
    };

    return builder;
  };

  return { client: { from } as unknown as SupabaseClient, inserts, deletes };
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
  it('inserts fresh child rows then deletes only the others (never a full wipe)', async () => {
    const { client, inserts, deletes } = createFakeSupabase({
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

    const weInsert = inserts.find((i) => i.table === 'work_experiences');
    expect(weInsert?.rows).toHaveLength(2);

    // delete-others: scoped to NOT the freshly inserted ids, so the just-written
    // rows survive and any legacy duplicates are cleaned up.
    const weDelete = deletes.find((d) => d.table === 'work_experiences');
    expect(weDelete?.not).toEqual(['id', 'in', '(w-new-1,w-new-2)']);
  });

  it('refuses (throws) when the insert returns no ids, without deleting existing rows', async () => {
    const { client, deletes } = createFakeSupabase({
      profileRow: baseProfileRow,
      // Insert "succeeds" but returns no rows (e.g. INSERT policy, no SELECT policy).
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

    // The guard must fire BEFORE any delete on work_experiences.
    expect(deletes.find((d) => d.table === 'work_experiences')).toBeUndefined();
  });
});

/**
 * Stateful variant of the fake: it actually STORES rows, so a delete can destroy
 * them. The stateless fake above can only observe the shape of each call, which is
 * why it cannot see the interleaving defect below.
 *
 * `barrierCount` inserts must arrive before any of them resolve, which pins the
 * interleaving to: A-insert, B-insert, A-delete, B-delete — the ordering two
 * concurrent saves produce whenever both round-trips overlap.
 */
function createStatefulSupabase(barrierCount: number) {
  const tables: Record<string, Array<{ id: string }>> = {
    work_experiences: [],
    education: [],
    language_skills: [],
    certifications: [],
  };
  let seq = 0;
  let arrived = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  const hitBarrier = async () => {
    arrived += 1;
    if (arrived >= barrierCount) release();
    await gate;
  };

  const from = (table: string) => {
    const state: { op?: string; not?: string[] } = {};
    let pendingRows: unknown[] = [];

    const runInsert = async () => {
      const ids = pendingRows.map(() => `${table}-${(seq += 1)}`);
      await hitBarrier();
      tables[table].push(...ids.map((id) => ({ id })));
      return { data: ids.map((id) => ({ id })), error: null };
    };

    const runDelete = async () => {
      if (state.not) {
        const keep = state.not[2].replace(/[()]/g, '').split(',');
        tables[table] = tables[table].filter((row) => keep.includes(row.id));
      } else {
        tables[table] = [];
      }
      return { error: null };
    };

    const terminal = () => {
      if (state.op === 'insert') return runInsert();
      if (state.op === 'delete') return runDelete();
      return Promise.resolve({ error: null });
    };

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
      insert: (rows: unknown[]) => {
        state.op = 'insert';
        pendingRows = rows;
        return builder;
      },
      delete: () => {
        state.op = 'delete';
        return builder;
      },
      not: (col: string, op: string, val: string) => {
        state.not = [col, op, val];
        return builder;
      },
      maybeSingle: () => Promise.resolve({ data: baseProfileRow, error: null }),
      single: () => terminal(),
      then: (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) => terminal().then(onF, onR),
    };

    return builder;
  };

  return { client: { from } as unknown as SupabaseClient, tables };
}

describe('candidateVacancyService.updateCandidateProfile — concurrent saves', () => {
  // BUG (P0 data loss, still unfixed at time of writing): reconcileChildRows
  // (candidateVacancyService.ts:346-383) is insert-first/delete-after with no
  // transaction and no optimistic-concurrency token. Each call deletes every row
  // that is not in ITS OWN freshly-inserted id set, so two overlapping saves
  // annihilate each other:
  //
  //   A: INSERT -> keepIds [a1]
  //   B: INSERT -> keepIds [b1]                 (table holds a1, b1)
  //   A: DELETE WHERE candidate_id=C AND id NOT IN (a1)  -> destroys b1
  //   B: DELETE WHERE candidate_id=C AND id NOT IN (b1)  -> destroys a1
  //   => ZERO rows. Every work experience is gone.
  //
  // Verified: with the barrier below, the table ends EMPTY today.
  //
  // Reachability is not theoretical. updateCandidateProfile:574-585 reconciles ALL
  // FOUR child tables on EVERY call (normalizeCandidateProfile falls back to the
  // fetched profile for any key not in `updates`), so any two overlapping profile
  // mutations collide even when they touch different sections. The Delete button at
  // app/profile/experience/[id].tsx:301 passes no `loading` prop, and the inline
  // delete on app/(candidate)/profile.tsx:113-129 is a bare Pressable with no
  // pending guard — so Save-then-Delete and two rapid deletes both overlap freely.
  //
  // Fix: move the reconcile server-side into a single SECURITY DEFINER RPC so
  // insert+delete are one transaction, or scope the delete by a per-save token
  // (e.g. delete only rows whose `updated_at` predates this save) instead of by
  // "not in my ids". A client-side mutex is not sufficient — two devices race too.
  // Un-skip this test with that fix.
  it.skip('does not destroy a concurrent save\'s rows (both writers survive)', async () => {
    const fake = createStatefulSupabase(2);
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

    // Today this is [] — a total wipe. A correct reconcile leaves the last writer's
    // row (or both), but never nothing.
    expect(fake.tables.work_experiences.length).toBeGreaterThan(0);
  });
});
