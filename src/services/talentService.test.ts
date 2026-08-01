/**
 * Talent-invite behavior under the in-memory mock backend.
 *
 * What IS observable in mock mode: invite creation, boundary validation, and the
 * per-company monthly count. Idempotency (a company inviting the same candidate
 * twice returns the first invite instead of a duplicate) is implemented ONLY on
 * the Supabase path — the mock path appends unconditionally — so it is verified
 * against a mocked Supabase client in talentService.invite.test.ts, not here.
 */

describe('talentService invites (mock backend)', () => {
  let talent: typeof import('./talentService')['talentService'];

  beforeEach(() => {
    jest.resetModules();
    talent = (require('./talentService') as typeof import('./talentService')).talentService;
  });

  it('creates a pending invite for the given company + candidate', async () => {
    const invite = await talent.sendInvite({
      companyId: 'c1',
      companyName: 'Kapital Bank',
      candidateId: 'talent-1',
      candidateUserId: 'u-t1',
    });

    expect(invite.companyId).toBe('c1');
    expect(invite.candidateId).toBe('talent-1');
    expect(invite.status).toBe('pending');
    expect(invite.id).toMatch(/^mock-invite-/);
  });

  it('requires both a company and a candidate', async () => {
    await expect(talent.sendInvite({ companyId: '', candidateId: 'talent-1' })).rejects.toThrow(
      'Company and candidate are required'
    );
    await expect(talent.sendInvite({ companyId: 'c1', candidateId: '' })).rejects.toThrow(
      'Company and candidate are required'
    );
  });

  it('counts this-month invites per company', async () => {
    expect(await talent.countCompanyInvitesThisMonth('c1')).toBe(0);

    await talent.sendInvite({ companyId: 'c1', candidateId: 'talent-1' });
    await talent.sendInvite({ companyId: 'c1', candidateId: 'talent-2' });
    await talent.sendInvite({ companyId: 'c2', candidateId: 'talent-3' });

    expect(await talent.countCompanyInvitesThisMonth('c1')).toBe(2);
    expect(await talent.countCompanyInvitesThisMonth('c2')).toBe(1);
  });

  // Documented gap: per-company+candidate idempotency exists only on the Supabase
  // path; see talentService.invite.test.ts for the real-path coverage.
  it.skip('is idempotent per company+candidate (Supabase-only path)', () => {});
});
