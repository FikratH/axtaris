import type { CandidateProfile } from '@/types/models';

export interface ProfileCompletionItem {
  id: string;
  /** i18n key for the step label (e.g. "Add your job title"). */
  labelKey: string;
  /** i18n key for a short hint shown under incomplete steps. */
  hintKey: string;
  done: boolean;
  /** Where tapping the step deep-links to so the user can complete it. */
  route: string;
}

/**
 * Single source of truth for candidate profile completeness. The stat shown on
 * the profile screen, the "steps to 100%" checklist, and the value persisted by
 * the service all derive from THIS list, so they can never disagree.
 *
 * NOTE: every field here has a candidate-facing edit surface, so 100% is
 * actually reachable (availability + work preference get pickers on the edit
 * screen). Keep this in sync with the edit surfaces if you add a check.
 */
export function getProfileCompletionItems(profile: CandidateProfile): ProfileCompletionItem[] {
  return [
    { id: 'title', labelKey: 'candidate.completion.items.title', hintKey: 'candidate.completion.hints.title', done: !!profile.title?.trim(), route: '/profile/edit' },
    { id: 'bio', labelKey: 'candidate.completion.items.bio', hintKey: 'candidate.completion.hints.bio', done: !!profile.bio?.trim(), route: '/profile/edit' },
    { id: 'location', labelKey: 'candidate.completion.items.location', hintKey: 'candidate.completion.hints.location', done: !!profile.location?.trim(), route: '/profile/edit' },
    { id: 'salary', labelKey: 'candidate.completion.items.salary', hintKey: 'candidate.completion.hints.salary', done: typeof profile.expectedSalary === 'number' && profile.expectedSalary > 0, route: '/profile/edit' },
    { id: 'skills', labelKey: 'candidate.completion.items.skills', hintKey: 'candidate.completion.hints.skills', done: profile.skills.length > 0, route: '/profile/edit' },
    { id: 'portfolio', labelKey: 'candidate.completion.items.portfolio', hintKey: 'candidate.completion.hints.portfolio', done: !!profile.portfolioUrl?.trim(), route: '/profile/edit' },
    { id: 'cv', labelKey: 'candidate.completion.items.cv', hintKey: 'candidate.completion.hints.cv', done: !!profile.cvUrl?.trim(), route: '/profile/upload-cv' },
    { id: 'availability', labelKey: 'candidate.completion.items.availability', hintKey: 'candidate.completion.hints.availability', done: !!profile.availability, route: '/profile/edit' },
    { id: 'workPreference', labelKey: 'candidate.completion.items.workPreference', hintKey: 'candidate.completion.hints.workPreference', done: !!profile.workPreference, route: '/profile/edit' },
    { id: 'experience', labelKey: 'candidate.completion.items.experience', hintKey: 'candidate.completion.hints.experience', done: profile.workExperience.length > 0, route: '/profile/experience/new' },
    { id: 'education', labelKey: 'candidate.completion.items.education', hintKey: 'candidate.completion.hints.education', done: profile.education.length > 0, route: '/profile/education/new' },
    { id: 'languages', labelKey: 'candidate.completion.items.languages', hintKey: 'candidate.completion.hints.languages', done: profile.languages.length > 0, route: '/profile/language/new' },
    { id: 'certifications', labelKey: 'candidate.completion.items.certifications', hintKey: 'candidate.completion.hints.certifications', done: profile.certifications.length > 0, route: '/profile/certification/new' },
  ];
}

export function calculateProfileCompletenessFromItems(profile: CandidateProfile): number {
  const items = getProfileCompletionItems(profile);
  if (items.length === 0) return 0;
  return Math.round((items.filter((item) => item.done).length / items.length) * 100);
}
