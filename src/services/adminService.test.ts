/**
 * Dashboard stats shape under the in-memory mock backend — guards the
 * AdminDashboardStats contract the (admin)/dashboard screen renders from.
 */
describe('adminService.fetchDashboardStats (mock backend)', () => {
  let admin: typeof import('./adminService')['adminService'];

  beforeEach(() => {
    jest.resetModules();
    admin = (require('./adminService') as typeof import('./adminService')).adminService;
  });

  it('returns every dashboard section with consistent counts', async () => {
    const s = await admin.fetchDashboardStats();

    expect(s.users.total).toBe(s.users.candidates + s.users.employers + s.users.admins);
    expect(s.users.withPushToken).toBeGreaterThanOrEqual(0);
    expect(s.candidates.avgCompleteness).toBeGreaterThanOrEqual(0);
    expect(s.candidates.avgCompleteness).toBeLessThanOrEqual(100);

    expect(s.vacancies.total).toBeGreaterThan(0);
    expect(s.applications.total).toBe(
      s.applications.pending +
        s.applications.reviewed +
        s.applications.shortlisted +
        s.applications.accepted +
        s.applications.rejected
    );

    expect(s.funnel30d.conversionPct).toBeGreaterThanOrEqual(0);
    expect(s.invites.total).toBe(s.invites.pending + s.invites.accepted + s.invites.declined);

    expect(Array.isArray(s.notifications7d)).toBe(true);
    expect(s.daily14d).toHaveLength(14);
    for (const day of s.daily14d) {
      expect(day.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(day.newUsers).toBeGreaterThanOrEqual(0);
    }

    expect(s.revenue.candidateMrr + s.revenue.employerMrr).toBeGreaterThanOrEqual(0);
  });
});
