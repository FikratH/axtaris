import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { UserRole } from '@/types/models';
import { getNotificationsModule, registerForPushNotifications } from '@/services/pushService';

/**
 * Registers the device for push (native only) once a user is signed in, and
 * routes taps on a notification to the relevant screen. No-op on web.
 */
export function usePushNotifications(userId?: string, role?: UserRole) {
  const router = useRouter();
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !userId) {
      registeredFor.current = null;
      return;
    }

    if (registeredFor.current !== userId) {
      registeredFor.current = userId;
      void registerForPushNotifications(userId);
    }

    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response?.notification?.request?.content?.data ?? {}) as Record<string, unknown>;
      const vacancyId = data.vacancyId ? String(data.vacancyId) : undefined;
      const applicationId = data.applicationId ? String(data.applicationId) : undefined;

      if (applicationId && role === 'employer') {
        router.push({ pathname: '/(employer)/applicant/[id]', params: { id: applicationId } } as never);
      } else if (vacancyId) {
        router.push({ pathname: '/vacancy/[id]', params: { id: vacancyId } } as never);
      }
    });

    return () => subscription.remove();
  }, [userId, role, router]);
}
