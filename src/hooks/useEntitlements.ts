import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { subscriptionService } from '@/services/subscriptionService';
import { useCandidateSubscriptionSummary } from '@/hooks/useSubscriptionQueries';
import {
  getCandidateEntitlements,
  getEmployerEntitlements,
  type CandidateEntitlements,
  type EmployerEntitlements,
} from '@/utils/entitlements';
import type { SubscriptionPlanCode } from '@/types/models';

/** Current employer's active plan code (resilient: 'free' if not migrated yet). */
export function useEmployerPlan(userId?: string) {
  return useQuery({
    queryKey: ['employer-subscription-plan', userId],
    queryFn: () => subscriptionService.fetchEmployerSubscriptionPlan(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Candidate plan + entitlements for the signed-in user. */
export function useCandidateEntitlements(): {
  plan: SubscriptionPlanCode;
  entitlements: CandidateEntitlements;
} {
  const user = useAuthStore((s) => s.user);
  const { data: summary } = useCandidateSubscriptionSummary(
    user && user.role !== 'employer' ? user.id : undefined
  );
  const plan: SubscriptionPlanCode = summary?.subscription.plan ?? 'free';
  return { plan, entitlements: getCandidateEntitlements(plan) };
}

/** Employer plan + entitlements for the signed-in user. */
export function useEmployerEntitlements(): {
  plan: SubscriptionPlanCode;
  entitlements: EmployerEntitlements;
} {
  const user = useAuthStore((s) => s.user);
  const { data: plan } = useEmployerPlan(user?.role === 'employer' ? user.id : undefined);
  const resolved: SubscriptionPlanCode = plan ?? 'free';
  return { plan: resolved, entitlements: getEmployerEntitlements(resolved) };
}
