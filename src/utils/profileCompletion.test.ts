import type { CandidateProfile } from '@/types/models';
import {
  getProfileCompletionItems,
  calculateProfileCompletenessFromItems,
} from './profileCompletion';

const baseProfile: CandidateProfile = {
  id: 'c1',
  userId: 'u1',
  skills: [],
  workExperience: [],
  education: [],
  languages: [],
  certifications: [],
  profileCompleteness: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const fullProfile: CandidateProfile = {
  ...baseProfile,
  title: 'Frontend Developer',
  bio: 'Short bio',
  location: 'Baku',
  expectedSalary: 2000,
  skills: ['JavaScript'],
  portfolioUrl: 'https://example.com',
  cvUrl: 'https://example.com/cv.pdf',
  availability: 'immediate',
  workPreference: 'full_time',
  workExperience: [
    { id: 'w1', jobTitle: 'Dev', company: 'Acme', startDate: '2020-01', isCurrent: true },
  ],
  education: [
    { id: 'e1', degree: 'BSc', fieldOfStudy: 'CS', institution: 'BSU', startDate: '2016-09', isCurrent: false },
  ],
  languages: [{ id: 'l1', language: 'English', level: 'advanced' }],
  certifications: [{ id: 'cert1', name: 'AWS', issuer: 'Amazon', issueDate: '2022-01' }],
};

describe('profileCompletion', () => {
  it('exposes 13 checklist items', () => {
    expect(getProfileCompletionItems(baseProfile)).toHaveLength(13);
  });

  it('returns 0% for an empty profile', () => {
    const items = getProfileCompletionItems(baseProfile);
    expect(items.every((item) => !item.done)).toBe(true);
    expect(calculateProfileCompletenessFromItems(baseProfile)).toBe(0);
  });

  it('reaches 100% when every field has a value (100% is achievable)', () => {
    const items = getProfileCompletionItems(fullProfile);
    expect(items.every((item) => item.done)).toBe(true);
    expect(calculateProfileCompletenessFromItems(fullProfile)).toBe(100);
  });

  it('computes 54% for 7 of 13 filled (matches the shown stat)', () => {
    const sevenFilled: CandidateProfile = {
      ...baseProfile,
      title: 'Dev',
      bio: 'bio',
      location: 'Baku',
      expectedSalary: 1500,
      skills: ['JS'],
      workExperience: [
        { id: 'w1', jobTitle: 'Dev', company: 'Acme', startDate: '2020-01', isCurrent: true },
      ],
      education: [
        { id: 'e1', degree: 'BSc', fieldOfStudy: 'CS', institution: 'BSU', startDate: '2016-09', isCurrent: false },
      ],
    };
    expect(getProfileCompletionItems(sevenFilled).filter((i) => i.done)).toHaveLength(7);
    expect(calculateProfileCompletenessFromItems(sevenFilled)).toBe(54);
  });

  it('every item deep-links to an editable route', () => {
    for (const item of getProfileCompletionItems(baseProfile)) {
      expect(item.route.startsWith('/profile/')).toBe(true);
    }
  });
});
