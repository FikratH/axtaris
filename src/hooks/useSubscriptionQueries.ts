import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CandidateSubscriptionSummary,
  SubscriptionAudience,
  SubscriptionFeatureComparisonRow,
  SubscriptionPlan,
  SubscriptionPlanCode,
} from '@/types/models';
import { subscriptionService } from '@/services/subscriptionService';

export const subscriptionQueryKeys = {
  all: ['subscriptions'] as const,
  plans: (audience: SubscriptionAudience) => ['subscriptions', 'plans', audience] as const,
  features: (audience: SubscriptionAudience) => ['subscriptions', 'features', audience] as const,
  candidateSummary: (userId: string) => ['subscriptions', 'candidate', userId] as const,
};

export function useSubscriptionPlans(audience: SubscriptionAudience = 'candidate') {
  return useQuery({
    queryKey: subscriptionQueryKeys.plans(audience),
    queryFn: () => subscriptionService.fetchPlans(audience),
  });
}

export function useSubscriptionFeatureComparison(audience: SubscriptionAudience = 'candidate') {
  return useQuery({
    queryKey: subscriptionQueryKeys.features(audience),
    queryFn: () => subscriptionService.fetchFeatureComparison(audience),
  });
}

export function useCandidateSubscriptionSummary(userId?: string) {
  return useQuery({
    enabled: !!userId,
    queryKey: subscriptionQueryKeys.candidateSummary(userId || 'unknown'),
    queryFn: () => subscriptionService.fetchCandidateSubscriptionSummary(userId || ''),
  });
}

export function useChangeCandidateSubscriptionPlan(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planCode: SubscriptionPlanCode) =>
      subscriptionService.changeCandidateSubscriptionPlan(userId || '', planCode),
    onSuccess: (summary) => {
      if (!userId) return;

      queryClient.setQueryData<CandidateSubscriptionSummary | null>(
        subscriptionQueryKeys.candidateSummary(userId),
        summary
      );
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
    },
  });
}
