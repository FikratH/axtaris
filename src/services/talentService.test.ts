/**
 * Talent-invite behavior under the in-memory mock backend.
 *
 * Observable in mock mode: invite creation, boundary validation, the per-company
 * monthly count, and per-company+candidate idempotency (the mock path now mirrors
 * the Supabase path). The Supabase-path idempotency has its own coverage in
 * talentService.invite.test.ts.
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

  it('is idempotent per company+candidate (returns the first invite, no duplicate)', async () => {
    const first = await talent.sendInvite({ companyId: 'c1', candidateId: 'talent-1' });
    const second = await talent.sendInvite({ companyId: 'c1', candidateId: 'talent-1' });

    expect(second.id).toBe(first.id);
    expect(await talent.countCompanyInvitesThisMonth('c1')).toBe(1);
  });
});
