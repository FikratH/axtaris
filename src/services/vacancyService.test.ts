/**
 * fetchVacanciesByIds under the in-memory mock backend.
 *
 * The Saved-jobs tab resolves saved vacancies by id. The fix locked in here: it
 * must NOT filter by status the way the active feed does, so a saved job the
 * employer later closed/filled still resolves (and can be un-saved) instead of
 * silently vanishing.
 */

describe('vacancyService.fetchVacanciesByIds (mock backend)', () => {
  let vacancy: typeof import('./vacancyService')['vacancyService'];
  let mockData: typeof import('./mockData');

  beforeEach(() => {
    jest.resetModules();
    vacancy = (require('./vacancyService') as typeof import('./vacancyService')).vacancyService;
    mockData = require('./mockData') as typeof import('./mockData');
  });

  it('returns [] for an empty id list (short-circuits, no lookup)', async () => {
    expect(await vacancy.fetchVacanciesByIds([])).toEqual([]);
  });

  it('returns the vacancies matching the given ids', async () => {
    const result = await vacancy.fetchVacanciesByIds(['1', '3']);
    expect(result.map((v) => v.id).sort()).toEqual(['1', '3']);
  });

  it('ignores ids that do not exist', async () => {
    const result = await vacancy.fetchVacanciesByIds(['1', 'does-not-exist']);
    expect(result.map((v) => v.id)).toEqual(['1']);
  });

  it('resolves a saved job even after it is closed (status is NOT filtered)', async () => {
    // Whole point of the fix: mutate a seeded vacancy to a non-active status and
    // confirm it still resolves by id, while the active feed drops it.
    const target = mockData.mockVacancies[0];
    target.status = 'closed';

    const byId = await vacancy.fetchVacanciesByIds([target.id]);
    expect(byId.map((v) => v.id)).toContain(target.id);
    expect(byId[0].status).toBe('closed');

    const feed = await vacancy.fetchCandidateVacancies();
    expect(feed.map((v) => v.id)).not.toContain(target.id);
  });
});
