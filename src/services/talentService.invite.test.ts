/**
 * Real-path (Supabase) idempotency of talentService.sendInvite.
 *
 * The mock backend appends invites unconditionally, so the dedupe guard is only
 * observable against Supabase: if this company already invited this candidate,
 * sendInvite must return the existing invite WITHOUT inserting a second row (and
 * without firing a second notification). `./supabase` is mocked so the real path
 * runs against a fake client.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const mockGetSupabase = jest.fn();

jest.mock('./supabase', () => ({
  shouldUseMockBackend: () => false,
  getSupabase: () => mockGetSupabase(),
  isSupabaseConfigured: () => true,
}));

import { talentService } from './talentService';

interface InviteRow {
  id: string;
  company_id: string;
  candidate_id: string;
  vacancy_id: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
}

/**
 * Fake covering the two sendInvite chains:
 *   existing lookup: from().select().eq().eq().order().limit().maybeSingle()
 *   insert:          from().insert().select().single()
 * `existing` decides which branch sendInvite takes; `wasInsertCalled` proves it.
 */
function createInviteSupabase(opts: {
  existing: InviteRow | null;
  inserted: InviteRow | null;
  /** Error returned by the existing-invite lookup (PostgREST yields data: null with it). */
  existingError?: { message: string };
}) {
  let insertCalled = false;

  const from = () => {
    const builder: Record<string, unknown> = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      limit: () => builder,
      insert: () => {
        insertCalled = true;
        return builder;
      },
      maybeSingle: () =>
        Promise.resolve({
          data: opts.existingError ? null : opts.existing,
          error: opts.existingError ?? null,
        }),
      single: () => Promise.resolve({ data: opts.inserted, error: null }),
    };
    return builder;
  };

  return { client: { from } as unknown as SupabaseClient, wasInsertCalled: () => insertCalled };
}

describe('talentService.sendInvite — Supabase idempotency', () => {
  it('returns the existing invite without inserting when one already exists', async () => {
    const existing: InviteRow = {
      id: 'inv-1',
      company_id: 'c1',
      candidate_id: 'cand-1',
      vacancy_id: null,
      message: null,
      status: 'pending',
      created_at: '2024-05-01T00:00:00Z',
      responded_at: null,
    };
    const fake = createInviteSupabase({ existing, inserted: null });
    mockGetSupabase.mockReturnValue(fake.client);

    const invite = await talentService.sendInvite({ companyId: 'c1', candidateId: 'cand-1' });

    expect(invite.id).toBe('inv-1');
    expect(invite.status).toBe('pending');
    expect(fake.wasInsertCalled()).toBe(false);
  });

  it('inserts a new invite when none exists yet', async () => {
    const inserted: InviteRow = {
      id: 'inv-new',
      company_id: 'c1',
      candidate_id: 'cand-2',
      vacancy_id: null,
      message: null,
      status: 'pending',
      created_at: '2024-06-01T00:00:00Z',
      responded_at: null,
    };
    const fake = createInviteSupabase({ existing: null, inserted });
    mockGetSupabase.mockReturnValue(fake.client);

    const invite = await talentService.sendInvite({ companyId: 'c1', candidateId: 'cand-2' });

    expect(invite.id).toBe('inv-new');
    expect(fake.wasInsertCalled()).toBe(true);
  });

  // BUG (P1, still unfixed at time of writing): the existing-invite lookup at
  // talentService.ts:319-329 destructures nothing and never inspects
  // `existing.error`. PostgREST returns `{ data: null, error }` on a transient
  // failure (network blip, RLS evaluation error, 500), so `if (existing.data)` is
  // false and control falls straight through to the INSERT — creating a duplicate
  // invite AND a duplicate candidate notification (the AFTER INSERT trigger in
  // 202608010002_invite_notification_trigger.sql fires per row).
  //
  // This is not merely the narrow double-tap race: it makes duplicates a routine
  // outcome on flaky mobile networks. There is also no DB backstop —
  // 202607230001_talent_and_monetization.sql:54-65 creates only NON-unique indexes
  // on candidate_invites, unlike `applications`, whose identical check-then-insert
  // is protected by UNIQUE(vacancy_id, candidate_id).
  //
  // Fix: mirror candidateVacancyService.applyToVacancy:791 —
  //   `const { data: existing, error: existingError } = await ...;
  //    if (existingError) throw new Error(existingError.message);`
  // and add a unique index on candidate_invites(company_id, candidate_id) so the
  // race has a real backstop. Un-skip this test with that fix.
  it.skip('throws instead of inserting when the existing-invite lookup fails', async () => {
    const fake = createInviteSupabase({
      existing: null,
      inserted: null,
      existingError: { message: 'network error' },
    });
    mockGetSupabase.mockReturnValue(fake.client);

    await expect(
      talentService.sendInvite({ companyId: 'c1', candidateId: 'cand-1' })
    ).rejects.toThrow();

    // The critical assertion: a failed lookup must never be treated as "no
    // existing invite", because that silently sends a second invite.
    expect(fake.wasInsertCalled()).toBe(false);
  });
});
