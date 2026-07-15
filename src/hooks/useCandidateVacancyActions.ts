import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Application, CandidateProfile, ScreeningAnswer } from '@/types/models';
import {
  candidateVacancyService,
  CandidateProfileMutationInput,
} from '@/services/candidateVacancyService';
import { vacancyQueryKeys } from './useVacancyQueries';
import { subscriptionQueryKeys } from './useSubscriptionQueries';

export const candidateVacancyActionKeys = {
  savedJobIds: (userId: string) => ['saved-jobs', userId] as const,
  applications: (userId: string) => ['applications', 'candidate', userId] as const,
  candidateProfile: (userId: string) => ['candidate-profile', userId] as const,
};

export function useSavedJobIds(userId?: string) {
  return useQuery({
    enabled: !!userId,
    queryKey: candidateVacancyActionKeys.savedJobIds(userId || 'unknown'),
    queryFn: () => candidateVacancyService.fetchSavedJobIds(userId || ''),
  });
}

export function useCandidateProfile(userId?: string) {
  return useQuery({
    enabled: !!userId,
    queryKey: candidateVacancyActionKeys.candidateProfile(userId || 'unknown'),
    queryFn: () => candidateVacancyService.fetchCandidateProfile(userId || ''),
  });
}

export function useToggleSavedJob(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = candidateVacancyActionKeys.savedJobIds(userId || 'unknown');

  return useMutation({
    mutationFn: (vacancyId: string) =>
      candidateVacancyService.toggleSavedJob(userId || '', vacancyId),
    onMutate: async (vacancyId: string) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<string[]>(queryKey);

      queryClient.setQueryData<string[]>(queryKey, (old = []) =>
        old.includes(vacancyId)
          ? old.filter((id) => id !== vacancyId)
          : [...old, vacancyId]
      );

      return { previous };
    },
    onError: (_err, _vacancyId, context) => {
      if (context?.previous && userId) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateCandidateProfile(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = candidateVacancyActionKeys.candidateProfile(userId || 'unknown');

  return useMutation({
    mutationFn: (input: CandidateProfileMutationInput) =>
      candidateVacancyService.updateCandidateProfile(userId || '', input),
    onSuccess: (profile) => {
      if (!userId) return;

      queryClient.setQueryData<CandidateProfile | null>(queryKey, profile);
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useCandidateApplications(userId?: string) {
  return useQuery({
    enabled: !!userId,
    queryKey: candidateVacancyActionKeys.applications(userId || 'unknown'),
    queryFn: () => candidateVacancyService.fetchCandidateApplications(userId || ''),
  });
}

export function useApplyToVacancy(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vacancyId, answers }: { vacancyId: string; answers?: ScreeningAnswer[] }) =>
      candidateVacancyService.applyToVacancy(userId || '', vacancyId, answers),
    onSuccess: (application) => {
      if (!userId) return;

      queryClient.setQueryData<Application[]>(
        candidateVacancyActionKeys.applications(userId),
        (current) => {
          const existing = current || [];
          if (existing.some((item) => item.id === application.id || item.vacancyId === application.vacancyId)) {
            return existing.map((item) =>
              item.id === application.id || item.vacancyId === application.vacancyId
                ? application
                : item
            );
          }
          return [application, ...existing];
        }
      );

      queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: candidateVacancyActionKeys.applications(userId),
      });
      queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.candidateSummary(userId),
      });
    },
  });
}
