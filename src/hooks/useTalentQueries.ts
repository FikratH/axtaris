import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { talentService } from '@/services/talentService';
import type { InviteStatus, TalentSearchFilters } from '@/types/models';

export function useTalentSearch(filters: TalentSearchFilters) {
  return useQuery({
    queryKey: ['talent-search', filters],
    queryFn: () => talentService.searchTalent(filters),
    staleTime: 60 * 1000,
  });
}

export function useTalentCandidate(candidateId?: string) {
  return useQuery({
    queryKey: ['talent-candidate', candidateId],
    queryFn: () => talentService.getTalentCandidate(candidateId as string),
    enabled: !!candidateId,
  });
}

export function useCompanyInviteCount(companyId?: string) {
  return useQuery({
    queryKey: ['company-invite-count', companyId],
    queryFn: () => talentService.countCompanyInvitesThisMonth(companyId as string),
    enabled: !!companyId,
  });
}

export function useSendInvite(companyId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof talentService.sendInvite>[0]) => talentService.sendInvite(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-invite-count', companyId] });
    },
  });
}

export function useCandidateInvites(userId?: string) {
  return useQuery({
    queryKey: ['candidate-invites', userId],
    queryFn: () => talentService.listCandidateInvites(userId as string),
    enabled: !!userId,
  });
}

export function useRespondToInvite(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ inviteId, status }: { inviteId: string; status: Exclude<InviteStatus, 'pending'> }) =>
      talentService.respondToInvite(inviteId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidate-invites', userId] }),
  });
}
