import {
  CandidateSubscription,
  CandidateSubscriptionSummary,
  SubscriptionAudience,
  SubscriptionFeatureComparisonRow,
  SubscriptionPlan,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '@/types/models';
import { mockCandidateProfile, mockUser } from './mockData';
import { getSupabase, shouldUseMockBackend } from './supabase';
import { getMockCandidateApplications } from './mockEngagementState';

interface CandidateSubscriptionRow {
  id: string;
  user_id: string;
  plan: SubscriptionPlanCode;
  status: SubscriptionStatus;
  price_amount: number;
  price_currency: string;
  billing_interval: 'month';
  started_at: string;
  expires_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

const candidateSubscriptionPlans: SubscriptionPlan[] = [
  {
    code: 'free',
    name: 'Pulsuz',
    monthlyPriceAzn: 0,
    monthlyPriceLabel: 'Pulsuz',
    dailyApplicationLimit: 3,
    visibilityLabel: 'Standart görünürlük',
    sortPriority: 0,
  },
  {
    code: 'pro',
    name: 'Pro',
    monthlyPriceAzn: 5,
    monthlyPriceLabel: '5 AZN / 30 günlük',
    dailyApplicationLimit: 10,
    visibilityLabel: 'CV-lər daha yuxarıda göstərilir',
    sortPriority: 12,
    isPopular: true,
  },
  {
    code: 'premium',
    name: 'Premium',
    monthlyPriceAzn: 15,
    monthlyPriceLabel: '15 AZN / 30 günlük',
    dailyApplicationLimit: null,
    visibilityLabel: 'Müraciətiniz siyahının ən üstündə',
    sortPriority: 30,
  },
];

const employerSubscriptionPlans: SubscriptionPlan[] = [
  {
    code: 'free',
    name: 'Standart',
    monthlyPriceAzn: 0,
    monthlyPriceLabel: '0 AZN',
    dailyApplicationLimit: null,
    visibilityLabel: 'Standart vakansiya görünürlüğü',
    sortPriority: 0,
  },
  {
    code: 'pro',
    name: 'Pro',
    monthlyPriceAzn: 29,
    monthlyPriceLabel: '29 AZN / 30 günlük',
    dailyApplicationLimit: null,
    visibilityLabel: 'Vakansiyalar daha yuxarıda göstərilir',
    sortPriority: 10,
    isPopular: true,
  },
  {
    code: 'premium',
    name: 'Premium',
    monthlyPriceAzn: 99,
    monthlyPriceLabel: '99 AZN / 30 günlük',
    dailyApplicationLimit: null,
    visibilityLabel: 'VIP işəgötürən dəstəyi',
    sortPriority: 30,
  },
];

const candidateSubscriptionFeatureRows: SubscriptionFeatureComparisonRow[] = [
  {
    id: 'price',
    label: 'Aylıq qiymət',
    free: 'Pulsuz',
    pro: '5 AZN',
    premium: '15 AZN',
  },
  {
    id: 'applications',
    label: 'Gündəlik limit',
    free: '3 müraciət',
    pro: '10 müraciət',
    premium: 'Limitsiz',
  },
  {
    id: 'cv-visibility',
    label: 'CV görünürlüğü',
    free: 'Standart',
    pro: 'Daha yuxarı',
    premium: 'Ən üstdə',
  },
  {
    id: 'support',
    label: 'Dəstək',
    free: 'Standart',
    pro: 'Standart',
    premium: 'AxtarIS komandası',
  },
];

const employerSubscriptionFeatureRows: SubscriptionFeatureComparisonRow[] = [
  {
    id: 'price',
    label: '30 günlük qiymət',
    free: '0 AZN',
    pro: '29 AZN',
    premium: '99 AZN',
  },
  {
    id: 'vacancy-visibility',
    label: 'Vakansiya görünürlüğü',
    free: 'Standart',
    pro: 'Daha yuxarı',
    premium: 'Ən yüksək prioritet',
  },
  {
    id: 'vip-support',
    label: 'VIP dəstək',
    free: 'Yoxdur',
    pro: 'Yoxdur',
    premium: 'AxtarIS komandası',
  },
  {
    id: 'candidate-curation',
    label: 'Namizəd seçimi',
    free: 'Yoxdur',
    pro: 'Yoxdur',
    premium: 'Kriteriyaya uyğun seçim',
  },
  {
    id: 'direct-messaging',
    label: 'Birbaşa mesajlaşma',
    free: 'Yoxdur',
    pro: 'Yoxdur',
    premium: 'Daxildir',
  },
];

function getPlanCollection(audience: SubscriptionAudience): SubscriptionPlan[] {
  return audience === 'employer' ? employerSubscriptionPlans : candidateSubscriptionPlans;
}

function getFeatureCollection(audience: SubscriptionAudience): SubscriptionFeatureComparisonRow[] {
  return audience === 'employer' ? employerSubscriptionFeatureRows : candidateSubscriptionFeatureRows;
}

function getPlanDefinition(planCode: SubscriptionPlanCode): SubscriptionPlan {
  return candidateSubscriptionPlans.find((plan) => plan.code === planCode) || candidateSubscriptionPlans[0];
}

function mapCandidateSubscription(row: CandidateSubscriptionRow): CandidateSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan,
    status: row.status,
    priceAmount: row.price_amount,
    priceCurrency: row.price_currency,
    billingInterval: row.billing_interval,
    startedAt: row.started_at,
    expiresAt: row.expires_at || undefined,
    canceledAt: row.canceled_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildFallbackSubscription(userId: string): CandidateSubscription {
  return {
    id: `subscription-${userId}`,
    userId,
    plan: 'free',
    status: 'active',
    priceAmount: 0,
    priceCurrency: 'AZN',
    billingInterval: 'month',
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getDayKey(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Baku' });
}

function getApplicationsUsedToday(candidateUserId: string): number {
  const todayKey = getDayKey(new Date().toISOString());

  return getMockCandidateApplications(candidateUserId).filter(
    (application) => getDayKey(application.appliedAt) === todayKey
  ).length;
}

let mockCandidateSubscription: CandidateSubscription = {
  id: 'mock-subscription-1',
  userId: mockUser.id,
  plan: 'free',
  status: 'active',
  priceAmount: 0,
  priceCurrency: 'AZN',
  billingInterval: 'month',
  startedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

class SubscriptionService {
  async fetchPlans(audience: SubscriptionAudience = 'candidate'): Promise<SubscriptionPlan[]> {
    return getPlanCollection(audience).map((plan) => ({ ...plan }));
  }

  async fetchFeatureComparison(
    audience: SubscriptionAudience = 'candidate'
  ): Promise<SubscriptionFeatureComparisonRow[]> {
    return getFeatureCollection(audience).map((row) => ({ ...row }));
  }

  async fetchCandidateSubscriptionSummary(
    userId: string
  ): Promise<CandidateSubscriptionSummary | null> {
    if (!userId) return null;

    if (shouldUseMockBackend()) {
      const subscription =
        mockCandidateSubscription.userId === userId
          ? { ...mockCandidateSubscription }
          : buildFallbackSubscription(userId);
      const plan = getPlanDefinition(subscription.plan);
      const applicationsUsedToday = getApplicationsUsedToday(userId);

      return {
        subscription,
        dailyApplicationLimit: plan.dailyApplicationLimit,
        applicationsUsedToday,
        applicationsRemainingToday:
          plan.dailyApplicationLimit === null
            ? null
            : Math.max(plan.dailyApplicationLimit - applicationsUsedToday, 0),
        visibilityScore: plan.sortPriority,
        visibilityLabel: plan.visibilityLabel,
      };
    }

    const { data: subscriptionData, error: subscriptionError } = await getSupabase()
      .from('candidate_subscriptions')
      .select(`
        id,
        user_id,
        plan,
        status,
        price_amount,
        price_currency,
        billing_interval,
        started_at,
        expires_at,
        canceled_at,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) throw new Error(subscriptionError.message);

    const subscription = subscriptionData
      ? mapCandidateSubscription(subscriptionData as CandidateSubscriptionRow)
      : buildFallbackSubscription(userId);

    const { data: profileData, error: profileError } = await getSupabase()
      .from('candidate_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);

    let applicationsUsedToday = 0;

    if (profileData?.id) {
      const todayKey = getDayKey(new Date().toISOString());

      const { data: usageRows, error: usageError } = await getSupabase()
        .from('applications')
        .select('applied_at')
        .eq('candidate_id', profileData.id)
        .order('applied_at', { ascending: false })
        .limit(20);

      if (usageError) throw new Error(usageError.message);
      applicationsUsedToday = (usageRows || []).filter((row) => getDayKey(row.applied_at) === todayKey).length;
    }

    const plan = getPlanDefinition(subscription.plan);

    return {
      subscription,
      dailyApplicationLimit: plan.dailyApplicationLimit,
      applicationsUsedToday,
      applicationsRemainingToday:
        plan.dailyApplicationLimit === null
          ? null
          : Math.max(plan.dailyApplicationLimit - applicationsUsedToday, 0),
      visibilityScore: plan.sortPriority,
      visibilityLabel: plan.visibilityLabel,
    };
  }

  async changeCandidateSubscriptionPlan(
    userId: string,
    planCode: SubscriptionPlanCode
  ): Promise<CandidateSubscriptionSummary> {
    if (!userId) {
      throw new Error('User id is required');
    }

    const nextPlan = getPlanDefinition(planCode);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    if (shouldUseMockBackend()) {
      const nowIso = now.toISOString();
      mockCandidateSubscription = {
        id: `mock-subscription-${planCode}`,
        userId,
        plan: planCode,
        status: 'active',
        priceAmount: nextPlan.monthlyPriceAzn || 0,
        priceCurrency: 'AZN',
        billingInterval: 'month',
        startedAt: nowIso,
        expiresAt: planCode === 'free' ? undefined : expiresAt.toISOString(),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const applicationsUsedToday =
        mockCandidateProfile.userId === userId ? getApplicationsUsedToday(userId) : 0;

      return {
        subscription: { ...mockCandidateSubscription },
        dailyApplicationLimit: nextPlan.dailyApplicationLimit,
        applicationsUsedToday,
        applicationsRemainingToday:
          nextPlan.dailyApplicationLimit === null
            ? null
            : Math.max(nextPlan.dailyApplicationLimit - applicationsUsedToday, 0),
        visibilityScore: nextPlan.sortPriority,
        visibilityLabel: nextPlan.visibilityLabel,
      };
    }

    const { error: closeError } = await getSupabase()
      .from('candidate_subscriptions')
      .update({
        status: 'expired',
        canceled_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (closeError) throw new Error(closeError.message);

    const { error: createError } = await getSupabase()
      .from('candidate_subscriptions')
      .insert({
        user_id: userId,
        plan: planCode,
        status: 'active',
        price_amount: nextPlan.monthlyPriceAzn || 0,
        price_currency: 'AZN',
        billing_interval: 'month',
        started_at: now.toISOString(),
        expires_at: planCode === 'free' ? null : expiresAt.toISOString(),
      });

    if (createError) throw new Error(createError.message);

    const summary = await this.fetchCandidateSubscriptionSummary(userId);

    if (!summary) {
      throw new Error('Subscription summary not found');
    }

    return summary;
  }
}

export const subscriptionService = new SubscriptionService();
