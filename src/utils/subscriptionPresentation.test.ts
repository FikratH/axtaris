import type { TFunction } from 'i18next';
import {
  getApplicationsUpsellBody,
  getApplicationsUpsellTitle,
  getSubscriptionActionLabel,
  getSubscriptionChooseLabel,
  getSubscriptionFeatureLabel,
  getSubscriptionFeatureValue,
  getSubscriptionPlanHighlights,
  getSubscriptionPlanName,
  getSubscriptionPriceLabel,
  getSubscriptionSummaryLine,
  getSubscriptionUsageBadgeText,
  getSubscriptionUsageCaption,
} from '@/utils/subscriptionPresentation';
import type {
  CandidateSubscriptionSummary,
  SubscriptionPlan,
} from '@/types/models';

// Identity translator — returns the key so we can assert which key/branch fired.
const tr = ((key: string) => key) as unknown as TFunction;

function makeSummary(
  overrides: Partial<CandidateSubscriptionSummary> = {}
): CandidateSubscriptionSummary {
  return {
    subscription: {
      id: 's1',
      userId: 'u1',
      plan: 'pro',
      status: 'active',
      priceAmount: 10,
      priceCurrency: 'AZN',
      billingInterval: 'month',
      startedAt: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    dailyApplicationLimit: 10,
    applicationsUsedToday: 2,
    applicationsRemainingToday: 8,
    visibilityScore: 50,
    visibilityLabel: 'High',
    ...overrides,
  };
}

describe('plan name / price keys', () => {
  it('builds catalog keys per audience', () => {
    expect(getSubscriptionPlanName(tr, 'pro', 'candidate')).toBe(
      'subscription.catalogs.candidate.plans.pro.name'
    );
    expect(getSubscriptionPlanName(tr, 'premium', 'employer')).toBe(
      'subscription.catalogs.employer.plans.premium.name'
    );
    expect(getSubscriptionPriceLabel(tr, 'free', 'candidate')).toBe(
      'subscription.catalogs.candidate.plans.free.priceLabel'
    );
  });

  it('defaults to the candidate audience', () => {
    expect(getSubscriptionPlanName(tr, 'pro')).toBe(
      'subscription.catalogs.candidate.plans.pro.name'
    );
  });
});

describe('getSubscriptionActionLabel', () => {
  it('branches on audience and plan', () => {
    expect(getSubscriptionActionLabel(tr, 'free', 'employer')).toBe('subscription.currentPlanCta');
    expect(getSubscriptionActionLabel(tr, 'pro', 'employer')).toBe('subscription.requestPlan');
    expect(getSubscriptionActionLabel(tr, 'free', 'candidate')).toBe('subscription.upgrade');
    expect(getSubscriptionActionLabel(tr, 'premium', 'candidate')).toBe('subscription.manage');
  });
});

describe('getSubscriptionChooseLabel', () => {
  const plan = (code: SubscriptionPlan['code']): SubscriptionPlan => ({
    code,
    name: code,
    monthlyPriceLabel: '',
    dailyApplicationLimit: null,
    visibilityLabel: '',
    sortPriority: 0,
  });

  it('returns employer CTAs for the employer audience', () => {
    expect(getSubscriptionChooseLabel(tr, plan('free'), 'employer')).toBe(
      'subscription.currentPlanCta'
    );
    expect(getSubscriptionChooseLabel(tr, plan('pro'), 'employer')).toBe(
      'subscription.requestPlan'
    );
  });

  it('returns the choose-plan key for candidates', () => {
    expect(getSubscriptionChooseLabel(tr, plan('pro'), 'candidate')).toBe('subscription.choosePlan');
  });
});

describe('usage badges and captions', () => {
  it('shows unlimited when there is no remaining cap', () => {
    expect(
      getSubscriptionUsageBadgeText(tr, makeSummary({ applicationsRemainingToday: null }))
    ).toBe('subscription.unlimitedToday');
  });

  it('shows the remaining-today key when capped', () => {
    expect(getSubscriptionUsageBadgeText(tr, makeSummary({ applicationsRemainingToday: 3 }))).toBe(
      'subscription.leftToday'
    );
  });

  it('captions used-today with or without a limit', () => {
    expect(getSubscriptionUsageCaption(tr, makeSummary({ dailyApplicationLimit: null }))).toBe(
      'subscription.usedTodayOnly'
    );
    expect(getSubscriptionUsageCaption(tr, makeSummary({ dailyApplicationLimit: 10 }))).toBe(
      'subscription.usedTodayWithLimit'
    );
  });

  it('summarizes with visibility, branching on the remaining cap', () => {
    expect(
      getSubscriptionSummaryLine(tr, makeSummary({ applicationsRemainingToday: null }))
    ).toBe('subscription.summary.unlimitedWithVisibility');
    expect(getSubscriptionSummaryLine(tr, makeSummary({ applicationsRemainingToday: 4 }))).toBe(
      'subscription.summary.remainingWithVisibility'
    );
  });
});

describe('upsell copy', () => {
  it('uses free vs paid variants for the title', () => {
    expect(getApplicationsUpsellTitle(tr, 'free')).toBe('subscription.upsell.titleFree');
    expect(getApplicationsUpsellTitle(tr, 'pro')).toBe('subscription.upsell.titlePaid');
  });

  it('uses free vs paid variants for the body', () => {
    expect(getApplicationsUpsellBody(tr, 'free')).toBe('subscription.upsell.bodyFree');
    expect(getApplicationsUpsellBody(tr, 'premium')).toBe('subscription.upsell.bodyPaid');
  });
});

describe('feature label / value keys', () => {
  it('maps known candidate feature ids through the key map', () => {
    expect(getSubscriptionFeatureLabel(tr, 'cv-visibility', 'candidate')).toBe(
      'subscription.catalogs.candidate.features.cvVisibility.label'
    );
    expect(getSubscriptionFeatureValue(tr, 'cv-visibility', 'pro', 'candidate')).toBe(
      'subscription.catalogs.candidate.features.cvVisibility.pro'
    );
  });

  it('maps known employer feature ids through the key map', () => {
    expect(getSubscriptionFeatureLabel(tr, 'vacancy-visibility', 'employer')).toBe(
      'subscription.catalogs.employer.features.vacancyVisibility.label'
    );
  });

  it('falls back to the raw row id for unmapped features', () => {
    expect(getSubscriptionFeatureLabel(tr, 'custom-row', 'candidate')).toBe(
      'subscription.catalogs.candidate.features.custom-row.label'
    );
  });
});

describe('getSubscriptionPlanHighlights', () => {
  it('returns and filters an array of highlight strings', () => {
    const arrayTr = (() => ['Fast', '', '   ', 'Reliable', 42]) as unknown as TFunction;
    expect(getSubscriptionPlanHighlights(arrayTr, 'pro', 'candidate')).toEqual(['Fast', 'Reliable']);
  });

  it('returns an empty array when the translation is not a list', () => {
    const stringTr = (() => 'not-a-list') as unknown as TFunction;
    expect(getSubscriptionPlanHighlights(stringTr, 'free', 'employer')).toEqual([]);
  });
});
