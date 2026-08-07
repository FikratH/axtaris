import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Application, ApplicationStatus, Notification } from '@/types/models';
import { engagementService } from '@/services/engagementService';

export const engagementQueryKeys = {
  employerApplications: (userId: string) => ['applications', 'employer', userId] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  profileContact: (profileId: string) => ['profile-contact', profileId] as const,
};

export function useEmployerApplications(userId?: string) {
  return useQuery({
    enabled: !!userId,
    queryKey: engagementQueryKeys.employerApplications(userId || 'unknown'),
    queryFn: () => engagementService.fetchEmployerApplications(userId || ''),
  });
}

/** Relationship-gated contact lookup (see EngagementService.fetchProfileContact). */
export function useProfileContact(profileId?: string) {
  return useQuery({
    enabled: !!profileId,
    queryKey: engagementQueryKeys.profileContact(profileId || 'unknown'),
    queryFn: () => engagementService.fetchProfileContact(profileId || ''),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateApplicationStatus(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: ApplicationStatus;
    }) => engagementService.updateApplicationStatus(userId || '', applicationId, status),
    onSuccess: (updatedApplication) => {
      if (!userId) return;

      queryClient.setQueryData<Application[]>(
        engagementQueryKeys.employerApplications(userId),
        (current) =>
          (current || []).map((application) =>
            application.id === updatedApplication.id ? updatedApplication : application
          )
      );
    },
  });
}

export function useUpdateApplicationReview(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      employerNotes,
      employerRating,
    }: {
      applicationId: string;
      employerNotes?: string;
      employerRating?: number;
    }) =>
      engagementService.updateApplicationReview(userId || '', applicationId, {
        employerNotes,
        employerRating,
      }),
    onSuccess: (updatedApplication) => {
      if (!userId) return;

      queryClient.setQueryData<Application[]>(
        engagementQueryKeys.employerApplications(userId),
        (current) =>
          (current || []).map((application) =>
            application.id === updatedApplication.id ? updatedApplication : application
          )
      );
    },
  });
}

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    enabled: !!userId,
    queryKey: engagementQueryKeys.notifications(userId || 'unknown'),
    queryFn: () => engagementService.fetchNotifications(userId || ''),
    refetchInterval: userId ? 30000 : false, // light fallback so unread state stays fresh without realtime
  });

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = engagementService.subscribeToNotifications(userId, () => {
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.notifications(userId) });
    });
    return unsubscribe;
  }, [userId, queryClient]);

  return query;
}

export function useMarkNotificationRead(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      engagementService.markNotificationRead(notificationId),
    onSuccess: (updatedNotification) => {
      if (!userId) return;

      queryClient.setQueryData<Notification[]>(
        engagementQueryKeys.notifications(userId),
        (current) =>
          (current || []).map((notification) =>
            notification.id === updatedNotification.id
              ? updatedNotification
              : notification
          )
      );
    },
  });
}

export function useMarkAllNotificationsRead(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => engagementService.markAllNotificationsRead(userId || ''),
    onSuccess: () => {
      if (!userId) return;

      queryClient.setQueryData<Notification[]>(
        engagementQueryKeys.notifications(userId),
        (current) =>
          (current || []).map((notification) => ({
            ...notification,
            read: true,
          }))
      );
    },
  });
}
