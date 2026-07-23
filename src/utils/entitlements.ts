import type { SubscriptionPlanCode } from '@/types/models';

/**
 * Single source of truth for what each plan unlocks. Screens gate features and
 * render paywalls off THIS module; the subscription service derives its daily
 * limits from here too, so limits/gates can never drift apart.
 *
 * IMPORTANT: `applicationsPerDay` must match the DB-enforced candidate limit
 * (a Postgres check backs 3/10/∞). Changing it needs a coordinated migration —
 * see memory `axtaris-monetization-enforcement`.
 */

export type ApplicantPriority = 'standard' | 'priority' | 'top';
export type SupportTier = 'standard' | 'priority' | 'vip';
export type ViewerVisibility = 'count' | 'list' | 'history';

export interface CandidateEntitlements {
  applicationsPerDay: number | null; // null = unlimited
  applicantPriority: ApplicantPriority;
  whoViewedYou: ViewerVisibility;
  savedSearches: number | null; // max saved searches, null = unlimited
  aiCoverLetters: boolean;
  spotlightProfile: boolean; // ranked to the top of talent search + badge
  messageBeforeApply: boolean;
}

export interface EmployerEntitlements {
  talentSearch: boolean;
  invitesPerMonth: number | null; // null = unlimited
  featuredSlots: number;
  aiJobDescriptions: boolean;
  aiApplicantRanking: boolean;
  support: SupportTier;
}

const CANDIDATE_ENTITLEMENTS: Record<SubscriptionPlanCode, CandidateEntitlements> = {
  free: {
    applicationsPerDay: 3,
    applicantPriority: 'standard',
    whoViewedYou: 'count',
    savedSearches: 0,
    aiCoverLetters: false,
    spotlightProfile: false,
    messageBeforeApply: false,
  },
  pro: {
    applicationsPerDay: 10,
    applicantPriority: 'priority',
    whoViewedYou: 'list',
    savedSearches: 5,
    aiCoverLetters: true,
    spotlightProfile: false,
    messageBeforeApply: false,
  },
  premium: {
    applicationsPerDay: null,
    applicantPriority: 'top',
    whoViewedYou: 'history',
    savedSearches: null,
    aiCoverLetters: true,
    spotlightProfile: true,
    messageBeforeApply: true,
  },
};

// Employer tiers are deliberately GENEROUS (two-sided marketplace: subsidize the
// scarce supply side). Free employers can hire end-to-end; paid unlocks scale
// (more invites/featured slots), AI, and support.
const EMPLOYER_ENTITLEMENTS: Record<SubscriptionPlanCode, EmployerEntitlements> = {
  free: {
    talentSearch: true,
    invitesPerMonth: 5,
    featuredSlots: 1,
    aiJobDescriptions: false,
    aiApplicantRanking: false,
    support: 'standard',
  },
  pro: {
    talentSearch: true,
    invitesPerMonth: 50,
    featuredSlots: 3,
    aiJobDescriptions: true,
    aiApplicantRanking: false,
    support: 'priority',
  },
  premium: {
    talentSearch: true,
    invitesPerMonth: null,
    featuredSlots: 10,
    aiJobDescriptions: true,
    aiApplicantRanking: true,
    support: 'vip',
  },
};

export function getCandidateEntitlements(plan: SubscriptionPlanCode | undefined | null): CandidateEntitlements {
  return CANDIDATE_ENTITLEMENTS[(plan as SubscriptionPlanCode)] ?? CANDIDATE_ENTITLEMENTS.free;
}

export function getEmployerEntitlements(plan: SubscriptionPlanCode | undefined | null): EmployerEntitlements {
  return EMPLOYER_ENTITLEMENTS[(plan as SubscriptionPlanCode)] ?? EMPLOYER_ENTITLEMENTS.free;
}

/** The lowest plan that grants a given candidate capability (for "upgrade to X" copy). */
export function requiredCandidatePlanFor(
  capability: keyof CandidateEntitlements
): SubscriptionPlanCode {
  const order: SubscriptionPlanCode[] = ['free', 'pro', 'premium'];
  for (const plan of order) {
    const value = CANDIDATE_ENTITLEMENTS[plan][capability];
    if (value === true || (typeof value === 'number' && value > 0) || value === null) {
      // For boolean caps, first `true`; for numeric, first non-zero/unlimited.
      if (typeof value === 'boolean' && value) return plan;
      if (typeof value !== 'boolean') return plan;
    }
  }
  return 'premium';
}

/** The lowest employer plan that grants a given capability. */
export function requiredEmployerPlanFor(
  capability: keyof EmployerEntitlements
): SubscriptionPlanCode {
  const order: SubscriptionPlanCode[] = ['free', 'pro', 'premium'];
  for (const plan of order) {
    const value = EMPLOYER_ENTITLEMENTS[plan][capability];
    if (typeof value === 'boolean' && value) return plan;
  }
  return 'premium';
}
