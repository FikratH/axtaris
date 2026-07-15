import type { TFunction } from 'i18next';
import type {
  ApplicationStatus,
  ExperienceLevel,
  LanguageSkill,
  VacancyStatus,
  VerificationStatus,
  WorkType,
} from '@/types/models';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

// ── Work type ────────────────────────────────────────────────
const workTypeKeys: Record<WorkType, string> = {
  full_time: 'candidate.fullTime',
  part_time: 'candidate.partTime',
  remote: 'candidate.remote',
  hybrid: 'candidate.hybrid',
  onsite: 'candidate.onsite',
  internship: 'candidate.internship',
};

export function getWorkTypeLabel(tr: TFunction, workType: WorkType): string {
  return tr(workTypeKeys[workType] ?? 'common.notAvailable');
}

// ── Experience level ─────────────────────────────────────────
export function getExperienceLevelLabel(tr: TFunction, level: ExperienceLevel): string {
  return tr(`experienceLevel.${level}`);
}

// ── Language proficiency ─────────────────────────────────────
export function getLanguageLevelLabel(tr: TFunction, level: LanguageSkill['level']): string {
  return tr(`profileCrud.language.levels.${level}`);
}

// ── Application status → label + semantic color ──────────────
const applicationStatusVariant: Record<ApplicationStatus, BadgeVariant> = {
  pending: 'warning',
  reviewed: 'info',
  shortlisted: 'success',
  accepted: 'success',
  rejected: 'error',
};

export function getApplicationStatusPresentation(
  tr: TFunction,
  status: ApplicationStatus,
  audience: 'candidate' | 'employer' = 'employer'
): { label: string; variant: BadgeVariant } {
  const label =
    audience === 'candidate' ? tr(`candidate.${status}`) : tr(`employer.status.${status}`);
  return { label, variant: applicationStatusVariant[status] ?? 'default' };
}

// ── Vacancy status → label + semantic color ──────────────────
const vacancyStatusVariant: Record<VacancyStatus, BadgeVariant> = {
  active: 'success',
  draft: 'default',
  pending_moderation: 'warning',
  paused: 'info',
  closed: 'default',
  rejected: 'error',
};

const vacancyStatusKey: Record<VacancyStatus, string> = {
  active: 'employer.status.active',
  draft: 'employer.status.draft',
  pending_moderation: 'employer.status.pendingModeration',
  paused: 'employer.status.paused',
  closed: 'employer.status.closed',
  rejected: 'employer.status.rejected',
};

export function getVacancyStatusPresentation(
  tr: TFunction,
  status: VacancyStatus
): { label: string; variant: BadgeVariant } {
  return {
    label: tr(vacancyStatusKey[status] ?? 'employer.status.draft'),
    variant: vacancyStatusVariant[status] ?? 'default',
  };
}

// ── Company verification → label + description + color ───────
export function getVerificationPresentation(
  tr: TFunction,
  status: VerificationStatus
): { label: string; description: string; variant: BadgeVariant; tone: 'success' | 'warning' | 'error' | 'neutral' } {
  switch (status) {
    case 'verified':
      return {
        label: tr('employer.verified'),
        description: tr('employer.verifiedDescription'),
        variant: 'success',
        tone: 'success',
      };
    case 'pending':
      return {
        label: tr('employer.pending_verification'),
        description: tr('employer.verificationInProgressDescription'),
        variant: 'warning',
        tone: 'warning',
      };
    case 'rejected':
      return {
        label: tr('employer.notVerified'),
        description: tr('employer.verificationRejectedDescription'),
        variant: 'error',
        tone: 'error',
      };
    default:
      return {
        label: tr('employer.notVerified'),
        description: tr('employer.verificationNotStartedDescription'),
        variant: 'default',
        tone: 'neutral',
      };
  }
}
