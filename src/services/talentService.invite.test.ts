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
function createInviteSupabase(opts: { existing: InviteRow | null; inserted: InviteRow | null }) {
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
      maybeSingle: () => Promise.resolve({ data: opts.existing, error: null }),
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
});
