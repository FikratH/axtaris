import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ModerationFlag, UserRole, VacancyStatus, VerificationStatus } from '@/types/models';
import { adminService } from '@/services/adminService';

export const adminQueryKeys = {
  root: ['admin'] as const,
  stats: ['admin', 'stats'] as const,
  finance: ['admin', 'finance'] as const,
  users: (search: string) => ['admin', 'users', search] as const,
  moderationVacancies: ['admin', 'moderation', 'vacancies'] as const,
  companies: ['admin', 'companies'] as const,
  flags: ['admin', 'flags'] as const,
};

export function usePlatformStats() {
  return useQuery({ queryKey: adminQueryKeys.stats, queryFn: () => adminService.fetchPlatformStats() });
}

export function useAdminFinance() {
  return useQuery({ queryKey: adminQueryKeys.finance, queryFn: () => adminService.fetchFinanceStats() });
}

export function useAdminUsers(search = '') {
  return useQuery({
    queryKey: adminQueryKeys.users(search),
    queryFn: () => adminService.fetchUsers(search),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
    },
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.setUserActive(userId, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useModerationVacancies() {
  return useQuery({
    queryKey: adminQueryKeys.moderationVacancies,
    queryFn: () => adminService.fetchModerationVacancies(),
  });
}

export function useSetVacancyModeration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VacancyStatus }) =>
      adminService.setVacancyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderationVacancies });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
    },
  });
}

export function useAdminCompanies() {
  return useQuery({ queryKey: adminQueryKeys.companies, queryFn: () => adminService.fetchCompanies() });
}

export function useSetCompanyVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VerificationStatus }) =>
      adminService.setCompanyVerification(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.companies });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
    },
  });
}

export function useModerationFlags() {
  return useQuery({ queryKey: adminQueryKeys.flags, queryFn: () => adminService.fetchFlags() });
}

export function useResolveFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ModerationFlag['status'] }) =>
      adminService.resolveFlag(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.flags });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
    },
  });
}
