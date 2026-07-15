import { CandidateProfile, ExperienceLevel, Vacancy } from '@/types/models';

/**
 * Transparent, weighted job-matching.
 *
 * Rather than a black-box score we return both a 0–100 match score AND the
 * concrete reasons behind it, so the UI can explain *why* a vacancy is a good
 * fit ("you have 4 of 5 skills, remote matches your preference"). The score is
 * a deterministic client-side signal; an optional AI layer (see aiService
 * `explainMatch`) can turn the reasons into a natural-language pitch.
 */

export type MatchReason = 'skills' | 'location' | 'workType' | 'salary' | 'experience';

export interface JobMatch {
  score: number; // 0–100
  matchedSkills: string[];
  reasons: MatchReason[];
}

export type MatchTier = 'strong' | 'good' | 'fair' | 'low';

const WEIGHTS = { skills: 50, location: 15, workType: 15, salary: 15, experience: 5 } as const;

const experienceOrder: Record<ExperienceLevel, number> = {
  no_experience: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  lead: 4,
  executive: 5,
};

const norm = (value: string) => value.trim().toLowerCase();

function inferCandidateLevel(profile: CandidateProfile): number {
  if (profile.workExperience.length === 0) return 0;
  const years = profile.workExperience.reduce((max, exp) => {
    const start = new Date(exp.startDate).getFullYear();
    if (Number.isNaN(start)) return max;
    return Math.max(max, new Date().getFullYear() - start);
  }, 0);
  if (years >= 8) return 4;
  if (years >= 5) return 3;
  if (years >= 2) return 2;
  if (years >= 1) return 1;
  return 0;
}

export function computeJobMatch(
  profile: CandidateProfile | null | undefined,
  vacancy: Vacancy
): JobMatch {
  const reasons: MatchReason[] = [];
  if (!profile) return { score: 0, matchedSkills: [], reasons };

  const candidateSkills = new Set(profile.skills.map(norm));
  const matchedSkills = vacancy.skills.filter((skill) => candidateSkills.has(norm(skill)));

  // Skills — the dominant signal
  const skillsRatio = vacancy.skills.length > 0 ? matchedSkills.length / vacancy.skills.length : 0.4;
  let score = skillsRatio * WEIGHTS.skills;
  if (matchedSkills.length > 0) reasons.push('skills');

  // Location (remote effectively matches everywhere)
  if (profile.location && norm(profile.location) === norm(vacancy.city)) {
    score += WEIGHTS.location;
    reasons.push('location');
  } else if (vacancy.workType === 'remote') {
    score += WEIGHTS.location * 0.7;
  }

  // Work-type preference
  if (profile.workPreference && profile.workPreference === vacancy.workType) {
    score += WEIGHTS.workType;
    reasons.push('workType');
  } else if (profile.workPreference === 'remote' && vacancy.workType === 'hybrid') {
    score += WEIGHTS.workType * 0.5;
  }

  // Salary fit
  if (profile.expectedSalary && (vacancy.salaryMin || vacancy.salaryMax)) {
    const min = vacancy.salaryMin ?? 0;
    const max = vacancy.salaryMax ?? Number.POSITIVE_INFINITY;
    if (profile.expectedSalary <= max && profile.expectedSalary >= min) {
      score += WEIGHTS.salary;
      reasons.push('salary');
    } else if (profile.expectedSalary < min) {
      // Employer offers more than expected — a positive signal
      score += WEIGHTS.salary;
      reasons.push('salary');
    } else {
      const overshoot = max > 0 ? (profile.expectedSalary - max) / max : 1;
      score += Math.max(0, WEIGHTS.salary * (1 - overshoot));
    }
  } else {
    score += WEIGHTS.salary * 0.5;
  }

  // Experience level (inferred from tenure)
  const inferred = inferCandidateLevel(profile);
  const required = experienceOrder[vacancy.experienceLevel] ?? 2;
  if (inferred >= required) {
    score += WEIGHTS.experience;
    if (inferred - required <= 1) reasons.push('experience');
  } else {
    const gap = required - inferred;
    score += Math.max(0, WEIGHTS.experience * (1 - gap * 0.3));
  }

  return {
    score: Math.round(Math.min(100, Math.max(0, score))),
    matchedSkills,
    reasons,
  };
}

export function rankVacanciesByMatch<T extends Vacancy>(
  profile: CandidateProfile | null | undefined,
  vacancies: T[]
): Array<T & { match: JobMatch }> {
  return vacancies
    .map((vacancy) => ({ ...vacancy, match: computeJobMatch(profile, vacancy) }))
    .sort((a, b) => b.match.score - a.match.score);
}

export function matchTier(score: number): MatchTier {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'low';
}
