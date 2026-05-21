import type { TFunction } from 'i18next';
import type {
  CandidateSubscriptionSummary,
  SubscriptionAudience,
  SubscriptionFeatureComparisonRow,
  SubscriptionPlan,
  SubscriptionPlanCode,
} from '@/types/models';

const featureRowKeyMap: Record<SubscriptionAudience, Record<string, string>> = {
  candidate: {
    price: 'price',
    applications: 'applications',
    'cv-visibility': 'cvVisibility',
    support: 'support',
  },
  employer: {
    price: 'price',
    'vacancy-visibility': 'vacancyVisibility',
    'vip-support': 'vipSupport',
    'candidate-curation': 'candidateCuration',
    'direct-messaging': 'directMessaging',
  },
};

function getCatalogPrefix(audience: SubscriptionAudience) {
  return `subscription.catalogs.${audience}`;
}

export function getSubscriptionPlanName(
  t: TFunction,
  planCode: SubscriptionPlanCode,
  audience: SubscriptionAudience = 'candidate'
) {
  return t(`${getCatalogPrefix(audience)}.plans.${planCode}.name`);
}

export function getSubscriptionPlanLabel(
  t: TFunction,
  planCode: SubscriptionPlanCode,
  audience: SubscriptionAudience = 'candidate'
) {
  return t('subscription.planLabel', {
    plan: getSubscriptionPlanName(t, planCode, audience),
  });
}

export function getSubscriptionPriceLabel(
  t: TFunction,
  planCode: SubscriptionPlanCode,
  audience: SubscriptionAudience = 'candidate'
) {
  return t(`${getCatalogPrefix(audience)}.plans.${planCode}.priceLabel`);
}

export function getSubscriptionVisibilityLabel(
  t: TFunction,
  planCode: SubscriptionPlanCode,
  audience: SubscriptionAudience = 'candidate'
) {
  return t(`${getCatalogPrefix(audience)}.plans.${planCode}.visibilityLabel`);
}

export function getSubscriptionActionLabel(
  t: TFunction,
  planCode: SubscriptionPlanCode,
  audience: SubscriptionAudience = 'candidate'
) {
  if (audience === 'employer') {
    return planCode === 'free' ? t('subscription.currentPlanCta') : t('subscription.requestPlan');
  }

  return planCode === 'free' ? t('subscription.upgrade') : t('subscription.manage');
}

export function getSubscriptionUsageBadgeText(
  t: TFunction,
  summary: CandidateSubscriptionSummary
) {
  return summary.applicationsRemainingToday === null
    ? t('subscription.unlimitedToday')
    : t('subscription.leftToday', { count: summary.applicationsRemainingToday });
}

export function getSubscriptionUsageCaption(
  t: TFunction,
  summary: CandidateSubscriptionSummary
) {
  return summary.dailyApplicationLimit === null
    ? t('subscription.usedTodayOnly', { count: summary.applicationsUsedToday })
    : t('subscription.usedTodayWithLimit', {
        used: summary.applicationsUsedToday,
        limit: summary.dailyApplicationLimit,
      });
}

export function getSubscriptionSummaryLine(
  t: TFunction,
  summary: CandidateSubscriptionSummary
) {
  const visibility = getSubscriptionVisibilityLabel(t, summary.subscription.plan, 'candidate');

  return summary.applicationsRemainingToday === null
    ? t('subscription.summary.unlimitedWithVisibility', { visibility })
    : t('subscription.summary.remainingWithVisibility', {
        count: summary.applicationsRemainingToday,
        visibility,
      });
}

export function getSubscriptionChooseLabel(
  t: TFunction,
  plan: SubscriptionPlan,
  audience: SubscriptionAudience = 'candidate'
) {
  if (audience === 'employer') {
    return plan.code === 'free' ? t('subscription.currentPlanCta') : t('subscription.requestPlan');
  }

  return t('subscription.choosePlan', {
    plan: getSubscriptionPlanName(t, plan.code, audience),
  });
}

export function getSubscriptionFeatureLabel(
  t: TFunction,
  rowId: SubscriptionFeatureComparisonRow['id'],
  audience: SubscriptionAudience = 'candidate'
) {
  const key = featureRowKeyMap[audience][rowId] || rowId;
  return t(`${getCatalogPrefix(audience)}.features.${key}.label`);
}

export function getSubscriptionFeatureValue(
  t: TFunction,
  rowId: SubscriptionFeatureComparisonRow['id'],
  planCode: SubscriptionPlanCode,
  audience: SubscriptionAudience = 'candidate'
) {
  const key = featureRowKeyMap[audience][rowId] || rowId;
  return t(`${getCatalogPrefix(audience)}.features.${key}.${planCode}`);
}

export function getSubscriptionCatalogTitle(
  t: TFunction,
  audience: SubscriptionAudience
) {
  return t(`${getCatalogPrefix(audience)}.title`);
}

export function getSubscriptionCatalogDescription(
  t: TFunction,
  audience: SubscriptionAudience
) {
  return t(`${getCatalogPrefix(audience)}.description`);
}

export function getSubscriptionSettingsDescription(
  t: TFunction,
  audience: SubscriptionAudience
) {
  return t(`${getCatalogPrefix(audience)}.settingsDescription`);
}

export function getSubscriptionPlanHighlights(
  t: TFunction,
  planCode: SubscriptionPlanCode,
  audience: SubscriptionAudience
) {
  const translated = t(`${getCatalogPrefix(audience)}.plans.${planCode}.highlights`, {
    returnObjects: true,
  });

  if (Array.isArray(translated)) {
    return translated.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  return [];
}

export function getApplicationsUpsellTitle(
  t: TFunction,
  planCode: SubscriptionPlanCode
) {
  return planCode === 'free'
    ? t('subscription.upsell.titleFree')
    : t('subscription.upsell.titlePaid');
}

export function getApplicationsUpsellBody(
  t: TFunction,
  planCode: SubscriptionPlanCode
) {
  return planCode === 'free'
    ? t('subscription.upsell.bodyFree')
    : t('subscription.upsell.bodyPaid');
}
