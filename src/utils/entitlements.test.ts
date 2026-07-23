import { getCandidateEntitlements, getEmployerEntitlements } from './entitlements';

describe('candidate entitlements', () => {
  it('free tier: 3/day, standard priority, count-only viewers, no AI', () => {
    const e = getCandidateEntitlements('free');
    expect(e.applicationsPerDay).toBe(3);
    expect(e.applicantPriority).toBe('standard');
    expect(e.whoViewedYou).toBe('count');
    expect(e.savedSearches).toBe(0);
    expect(e.aiCoverLetters).toBe(false);
  });

  it('pro tier: 10/day, priority, viewer list, AI cover letters, 5 saved searches', () => {
    const e = getCandidateEntitlements('pro');
    expect(e.applicationsPerDay).toBe(10);
    expect(e.applicantPriority).toBe('priority');
    expect(e.whoViewedYou).toBe('list');
    expect(e.savedSearches).toBe(5);
    expect(e.aiCoverLetters).toBe(true);
  });

  it('premium tier: unlimited apps, top priority, spotlight, message-before-apply', () => {
    const e = getCandidateEntitlements('premium');
    expect(e.applicationsPerDay).toBeNull();
    expect(e.applicantPriority).toBe('top');
    expect(e.spotlightProfile).toBe(true);
    expect(e.messageBeforeApply).toBe(true);
    expect(e.savedSearches).toBeNull();
  });

  it('daily limits stay 3/10/∞ (must match the DB-enforced limit)', () => {
    expect(getCandidateEntitlements('free').applicationsPerDay).toBe(3);
    expect(getCandidateEntitlements('pro').applicationsPerDay).toBe(10);
    expect(getCandidateEntitlements('premium').applicationsPerDay).toBeNull();
  });
});

describe('employer entitlements (deliberately generous for supply acquisition)', () => {
  it('free employers can hire: talent search + invites + a featured slot included', () => {
    const e = getEmployerEntitlements('free');
    expect(e.talentSearch).toBe(true);
    expect(e.invitesPerMonth).toBe(5);
    expect(e.featuredSlots).toBe(1);
    expect(e.aiJobDescriptions).toBe(false);
  });

  it('pro: more invites/featured + AI job descriptions', () => {
    const e = getEmployerEntitlements('pro');
    expect(e.invitesPerMonth).toBe(50);
    expect(e.featuredSlots).toBe(3);
    expect(e.aiJobDescriptions).toBe(true);
    expect(e.aiApplicantRanking).toBe(false);
  });

  it('premium: unlimited invites + AI ranking + VIP', () => {
    const e = getEmployerEntitlements('premium');
    expect(e.invitesPerMonth).toBeNull();
    expect(e.featuredSlots).toBe(10);
    expect(e.aiApplicantRanking).toBe(true);
    expect(e.support).toBe('vip');
  });
});

describe('entitlements fallback', () => {
  it('unknown plan falls back to free', () => {
    expect(getCandidateEntitlements(undefined).applicationsPerDay).toBe(3);
    expect(getEmployerEntitlements(null).invitesPerMonth).toBe(5);
    expect(getEmployerEntitlements('nonsense' as never).talentSearch).toBe(true);
  });
});
