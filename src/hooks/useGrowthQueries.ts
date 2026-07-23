import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ProfileViewSummary,
  SavedSearch,
  SavedSearchCriteria,
} from '@/types/models';
import { candidateGrowthService } from '@/services/candidateGrowthService';
import type { ViewerVisibility } from '@/utils/entitlements';

export const growthQueryKeys = {
  profileViewSummary: (userId: string, visibility: ViewerVisibility) =>
    ['profile-view-summary', userId, visibility] as const,
  savedSearches: (userId: string) => ['saved-searches', userId] as const,
};

export function useProfileViewSummary(userId?: string, visibility: ViewerVisibility = 'count') {
  return useQuery({
    enabled: !!userId,
    queryKey: growthQueryKeys.profileViewSummary(userId || 'unknown', visibility),
    queryFn: () =>
      candidateGrowthService.fetchProfileViewSummary(userId || '', visibility),
  });
}

export function useSavedSearches(userId?: string) {
  return useQuery({
    enabled: !!userId,
    queryKey: growthQueryKeys.savedSearches(userId || 'unknown'),
    queryFn: () => candidateGrowthService.listSavedSearches(userId || ''),
  });
}

export function useCreateSavedSearch(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, filters }: { name: string; filters: SavedSearchCriteria }) =>
      candidateGrowthService.createSavedSearch(userId || '', name, filters),
    onSuccess: (created) => {
      if (!userId) return;

      queryClient.setQueryData<SavedSearch[]>(
        growthQueryKeys.savedSearches(userId),
        (current) => [created, ...(current || [])]
      );
    },
  });
}

export function useDeleteSavedSearch(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => candidateGrowthService.deleteSavedSearch(id),
    onSuccess: (_result, id) => {
      if (!userId) return;

      queryClient.setQueryData<SavedSearch[]>(
        growthQueryKeys.savedSearches(userId),
        (current) => (current || []).filter((search) => search.id !== id)
      );
    },
  });
}

export type { ProfileViewSummary };
