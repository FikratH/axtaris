import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { moderationService } from '@/services/moderationService';

export const moderationKeys = {
  isBlocked: (blockerId?: string, blockedId?: string) =>
    ['moderation', 'isBlocked', blockerId || 'unknown', blockedId || 'unknown'] as const,
};

export function useIsUserBlocked(blockerId?: string, blockedId?: string) {
  return useQuery({
    queryKey: moderationKeys.isBlocked(blockerId, blockedId),
    queryFn: () => moderationService.isUserBlocked(blockerId || '', blockedId || ''),
    enabled: !!blockerId && !!blockedId,
  });
}

export function useReportUser(reporterId?: string) {
  return useMutation({
    mutationFn: ({ targetUserId, reason }: { targetUserId: string; reason: string }) =>
      moderationService.reportUser(reporterId || '', targetUserId, reason),
  });
}

export function useToggleBlockUser(blockerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockedId, block }: { blockedId: string; block: boolean }) =>
      block
        ? moderationService.blockUser(blockerId || '', blockedId)
        : moderationService.unblockUser(blockerId || '', blockedId),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(moderationKeys.isBlocked(blockerId, variables.blockedId), variables.block);
    },
  });
}
