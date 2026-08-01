/**
 * Apply-flow behavior under the in-memory mock backend.
 *
 * Jest sets no EXPO_PUBLIC_* env, so runtime `appEnv` is 'development' with no
 * Supabase configured — `shouldUseMockBackend()` returns true and every service
 * method short-circuits to mockData / mockEngagementState (no network).
 *
 * `jest.resetModules()` + dynamic import in beforeEach hands each test a fresh
 * copy of the mutable mock singletons (mockApplicationState, mockCandidateProfile,
 * mockCandidateSubscription), so applying a job or setting a CV in one test can't
 * leak into another.
 */

describe('candidateVacancyService.applyToVacancy (mock backend)', () => {
  let candidateVacancy: typeof import('./candidateVacancyService')['candidateVacancyService'];
  let mockData: typeof import('./mockData');

  // Vacancy '4' (ABB Backend) and '2' (Azercell PM) have no seeded application,
  // so applying to them actually creates one; vacancies 1/3/5/6 are pre-seeded.
  const CANDIDATE_USER_ID = '1';
  const FRESH_VACANCY_ID = '4';

  beforeEach(() => {
    jest.resetModules();
    candidateVacancy = (
      require('./candidateVacancyService') as typeof import('./candidateVacancyService')
    ).candidateVacancyService;
    mockData = require('./mockData') as typeof import('./mockData');
  });

  it('creates a pending application for a vacancy with no prior application', async () => {
    const app = await candidateVacancy.applyToVacancy(CANDIDATE_USER_ID, FRESH_VACANCY_ID);

    expect(app.vacancyId).toBe(FRESH_VACANCY_ID);
    expect(app.candidateId).toBe(mockData.mockCandidateProfile.id);
    expect(app.status).toBe('pending');

    const mine = await candidateVacancy.fetchCandidateApplications(CANDIDATE_USER_ID);
    expect(mine.filter((a) => a.vacancyId === FRESH_VACANCY_ID)).toHaveLength(1);
  });

  it('is idempotent: applying again returns the same application (no duplicate)', async () => {
    const first = await candidateVacancy.applyToVacancy(CANDIDATE_USER_ID, FRESH_VACANCY_ID);
    const second = await candidateVacancy.applyToVacancy(CANDIDATE_USER_ID, FRESH_VACANCY_ID);

    expect(second.id).toBe(first.id);

    const mine = await candidateVacancy.fetchCandidateApplications(CANDIDATE_USER_ID);
    expect(mine.filter((a) => a.vacancyId === FRESH_VACANCY_ID)).toHaveLength(1);
  });

  it('snapshots the profile CV url onto the application when the profile has one', async () => {
    mockData.mockCandidateProfile.cvUrl = 'https://cdn.axtaris.test/cv/ali.pdf';

    const app = await candidateVacancy.applyToVacancy(CANDIDATE_USER_ID, '2');

    expect(app.cvUrl).toBe('https://cdn.axtaris.test/cv/ali.pdf');
  });

  it('leaves cvUrl unset on the application when the profile has no CV', async () => {
    // Guards the snapshot above against being trivially true: the seed profile
    // has no cvUrl, so the created application must not invent one.
    expect(mockData.mockCandidateProfile.cvUrl).toBeUndefined();

    const app = await candidateVacancy.applyToVacancy(CANDIDATE_USER_ID, '2');

    expect(app.cvUrl).toBeUndefined();
  });

  it('requires both a user and a vacancy', async () => {
    await expect(candidateVacancy.applyToVacancy('', FRESH_VACANCY_ID)).rejects.toThrow(
      'User and vacancy are required'
    );
    await expect(candidateVacancy.applyToVacancy(CANDIDATE_USER_ID, '')).rejects.toThrow(
      'User and vacancy are required'
    );
  });
});
