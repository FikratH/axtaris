import {
  computeJobMatch,
  matchTier,
  rankVacanciesByMatch,
} from '@/utils/jobMatch';
import type {
  CandidateProfile,
  Vacancy,
  WorkExperience,
} from '@/types/models';

function makeProfile(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: 'p1',
    userId: 'u1',
    skills: [],
    workExperience: [],
    education: [],
    languages: [],
    certifications: [],
    profileCompleteness: 0,
    createdAt: '2020-01-01',
    updatedAt: '2020-01-01',
    ...overrides,
  };
}

function makeVacancy(overrides: Partial<Vacancy> = {}): Vacancy {
  return {
    id: 'v1',
    title: 'Engineer',
    description: '',
    requirements: [],
    responsibilities: [],
    benefits: [],
    showSalary: true,
    city: 'Baku',
    workType: 'full_time',
    experienceLevel: 'mid',
    skills: [],
    companyId: 'c1',
    status: 'active',
    applicantCount: 0,
    viewCount: 0,
    createdAt: '2020-01-01',
    updatedAt: '2020-01-01',
    ...overrides,
  };
}

function workExpStartedYearsAgo(years: number): WorkExperience {
  const startYear = new Date().getFullYear() - years;
  return {
    id: `w-${years}`,
    jobTitle: 'Developer',
    company: 'Acme',
    startDate: `${startYear}-01-01`,
    isCurrent: true,
  };
}

describe('computeJobMatch', () => {
  it('returns a zero match with no reasons when the profile is missing', () => {
    const result = computeJobMatch(null, makeVacancy());
    expect(result).toEqual({ score: 0, matchedSkills: [], reasons: [] });

    expect(computeJobMatch(undefined, makeVacancy())).toEqual({
      score: 0,
      matchedSkills: [],
      reasons: [],
    });
  });

  it('scores a perfect fit as 100 with every reason', () => {
    const profile = makeProfile({
      skills: ['JavaScript'],
      location: 'Baku',
      workPreference: 'full_time',
      expectedSalary: 1500,
    });
    const vacancy = makeVacancy({
      skills: ['JavaScript'],
      city: 'Baku',
      workType: 'full_time',
      experienceLevel: 'no_experience',
      salaryMin: 1000,
      salaryMax: 2000,
    });

    const result = computeJobMatch(profile, vacancy);
    expect(result.score).toBe(100);
    expect(result.matchedSkills).toEqual(['JavaScript']);
    expect(result.reasons).toEqual(
      expect.arrayContaining(['skills', 'location', 'workType', 'salary', 'experience'])
    );
  });

  it('matches skills across language/alias spellings and returns the vacancy spelling', () => {
    const profile = makeProfile({ skills: ['JavaScript', 'React'] });
    const vacancy = makeVacancy({
      skills: ['JS', 'React', 'Python'],
      city: 'Nowhere',
      workType: 'onsite',
    });

    const result = computeJobMatch(profile, vacancy);
    expect(result.matchedSkills).toEqual(['JS', 'React']);
    expect(result.reasons).toContain('skills');
  });

  it('does not add a skills reason when nothing overlaps', () => {
    const profile = makeProfile({ skills: ['Cooking'] });
    const vacancy = makeVacancy({ skills: ['JavaScript'] });
    const result = computeJobMatch(profile, vacancy);
    expect(result.matchedSkills).toEqual([]);
    expect(result.reasons).not.toContain('skills');
  });

  it('credits an exact city match (folding spellings) with a location reason', () => {
    const profile = makeProfile({ location: 'Bakı' });
    const vacancy = makeVacancy({ city: 'Baku', workType: 'onsite' });
    expect(computeJobMatch(profile, vacancy).reasons).toContain('location');
  });

  it('gives a partial location boost for remote work without a location reason', () => {
    const remote = computeJobMatch(
      makeProfile({ location: 'Ganja' }),
      makeVacancy({ city: 'Baku', workType: 'remote' })
    );
    const onsite = computeJobMatch(
      makeProfile({ location: 'Ganja' }),
      makeVacancy({ city: 'Baku', workType: 'onsite' })
    );
    expect(remote.reasons).not.toContain('location');
    // Remote effectively matches everywhere, so it must out-score a non-matching onsite role.
    expect(remote.score).toBeGreaterThan(onsite.score);
  });

  it('credits an exact work-type preference match with a workType reason', () => {
    const profile = makeProfile({ workPreference: 'remote' });
    const vacancy = makeVacancy({ workType: 'remote', city: 'Nowhere' });
    expect(computeJobMatch(profile, vacancy).reasons).toContain('workType');
  });

  it('gives a partial boost for remote preference against a hybrid role', () => {
    const hybrid = computeJobMatch(
      makeProfile({ workPreference: 'remote' }),
      makeVacancy({ workType: 'hybrid', city: 'Nowhere' })
    );
    const mismatched = computeJobMatch(
      makeProfile({ workPreference: 'remote' }),
      makeVacancy({ workType: 'onsite', city: 'Nowhere' })
    );
    expect(hybrid.reasons).not.toContain('workType');
    expect(hybrid.score).toBeGreaterThan(mismatched.score);
  });

  it('credits salary within the offered range with a salary reason', () => {
    const profile = makeProfile({ expectedSalary: 1500 });
    const vacancy = makeVacancy({ salaryMin: 1000, salaryMax: 2000, city: 'Nowhere', workType: 'onsite' });
    expect(computeJobMatch(profile, vacancy).reasons).toContain('salary');
  });

  it('treats an employer offering more than expected as a positive salary signal', () => {
    const profile = makeProfile({ expectedSalary: 800 });
    const vacancy = makeVacancy({ salaryMin: 1000, salaryMax: 2000, city: 'Nowhere', workType: 'onsite' });
    expect(computeJobMatch(profile, vacancy).reasons).toContain('salary');
  });

  it('penalizes (without a reason) when the expectation overshoots the max', () => {
    const within = computeJobMatch(
      makeProfile({ expectedSalary: 1500 }),
      makeVacancy({ salaryMin: 1000, salaryMax: 2000, city: 'Nowhere', workType: 'onsite' })
    );
    const overshoot = computeJobMatch(
      makeProfile({ expectedSalary: 3000 }),
      makeVacancy({ salaryMin: 1000, salaryMax: 2000, city: 'Nowhere', workType: 'onsite' })
    );
    expect(overshoot.reasons).not.toContain('salary');
    expect(overshoot.score).toBeLessThan(within.score);
  });

  it('infers an executive level from 12+ years of tenure', () => {
    const executiveVacancy = makeVacancy({
      experienceLevel: 'executive',
      city: 'Nowhere',
      workType: 'onsite',
    });

    const twelveYears = computeJobMatch(
      makeProfile({ workExperience: [workExpStartedYearsAgo(12)] }),
      executiveVacancy
    );
    const elevenYears = computeJobMatch(
      makeProfile({ workExperience: [workExpStartedYearsAgo(11)] }),
      executiveVacancy
    );

    // 12 yrs => level 5 meets the executive requirement (gap 0 => reason).
    expect(twelveYears.reasons).toContain('experience');
    // 11 yrs => level 4 falls short of executive, so no experience reason.
    expect(elevenYears.reasons).not.toContain('experience');
    expect(twelveYears.score).toBeGreaterThan(elevenYears.score);
  });

  it('meets a senior requirement at 5+ years of tenure', () => {
    const seniorVacancy = makeVacancy({ experienceLevel: 'senior', city: 'Nowhere', workType: 'onsite' });
    const senior = computeJobMatch(
      makeProfile({ workExperience: [workExpStartedYearsAgo(5)] }),
      seniorVacancy
    );
    expect(senior.reasons).toContain('experience');
  });

  it('always returns an integer score clamped to 0..100', () => {
    const result = computeJobMatch(
      makeProfile({ skills: ['JavaScript'], location: 'Baku', workPreference: 'full_time', expectedSalary: 1500 }),
      makeVacancy({ skills: ['JavaScript'], salaryMin: 1000, salaryMax: 2000, experienceLevel: 'no_experience' })
    );
    expect(Number.isInteger(result.score)).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('rankVacanciesByMatch', () => {
  it('orders vacancies by descending match score and attaches the match', () => {
    const profile = makeProfile({
      skills: ['JavaScript', 'React'],
      location: 'Baku',
      workPreference: 'full_time',
      expectedSalary: 1500,
    });

    const strong = makeVacancy({
      id: 'strong',
      skills: ['JavaScript', 'React'],
      city: 'Baku',
      workType: 'full_time',
      salaryMin: 1000,
      salaryMax: 2000,
      experienceLevel: 'no_experience',
    });
    const weak = makeVacancy({
      id: 'weak',
      skills: ['Cooking'],
      city: 'Ganja',
      workType: 'onsite',
      experienceLevel: 'executive',
    });
    const medium = makeVacancy({
      id: 'medium',
      skills: ['JavaScript'],
      city: 'Ganja',
      workType: 'onsite',
      experienceLevel: 'mid',
    });

    const ranked = rankVacanciesByMatch(profile, [weak, medium, strong]);
    expect(ranked.map((v) => v.id)).toEqual(['strong', 'medium', 'weak']);
    ranked.forEach((v) => {
      expect(v.match).toBeDefined();
      expect(typeof v.match.score).toBe('number');
    });
    // Scores are monotonically non-increasing.
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i - 1].match.score).toBeGreaterThanOrEqual(ranked[i].match.score);
    }
  });

  it('returns an empty array for no vacancies', () => {
    expect(rankVacanciesByMatch(makeProfile(), [])).toEqual([]);
  });
});

describe('matchTier', () => {
  it('maps scores to tiers at the 80 / 60 / 40 thresholds', () => {
    expect(matchTier(100)).toBe('strong');
    expect(matchTier(80)).toBe('strong');
    expect(matchTier(79)).toBe('good');
    expect(matchTier(60)).toBe('good');
    expect(matchTier(59)).toBe('fair');
    expect(matchTier(40)).toBe('fair');
    expect(matchTier(39)).toBe('low');
    expect(matchTier(0)).toBe('low');
  });
});
