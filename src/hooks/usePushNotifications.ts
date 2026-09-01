import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';
import { UserRole } from '@/types/models';
import { getNotificationsModule, registerForPushNotifications } from '@/services/pushService';

type NotificationResponse = {
  notification?: { request?: { content?: { data?: unknown } } };
};

/**
 * Registers the device for push (native only) once a user is signed in, and
 * routes taps on a notification to the relevant screen. No-op on web.
 */
export function usePushNotifications(userId?: string, role?: UserRole) {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const registeredFor = useRef<string | null>(null);
  const handledLaunchResponse = useRef(false);

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

    // The nav tree isn't mounted yet on the first render after launch —
    // routing before then is a silent no-op, so wait for it.
    if (!navigationState?.key) return;

    const handleResponse = (response: NotificationResponse | null | undefined) => {
      const data = (response?.notification?.request?.content?.data ?? {}) as Record<string, unknown>;
      const vacancyId = data.vacancyId ? String(data.vacancyId) : undefined;
      const applicationId = data.applicationId ? String(data.applicationId) : undefined;
      const conversationId = data.conversationId ? String(data.conversationId) : undefined;
      const inviteId = data.inviteId ? String(data.inviteId) : undefined;

      if (conversationId) {
        router.push({ pathname: '/chat/[id]', params: { id: conversationId } } as never);
      } else if (inviteId || data.type === 'invite') {
        router.push('/invites' as never);
      } else if (applicationId && role === 'employer') {
        router.push({ pathname: '/(employer)/applicant/[id]', params: { id: applicationId } } as never);
      } else if (vacancyId) {
        router.push({ pathname: '/vacancy/[id]', params: { id: vacancyId } } as never);
      }
    };

    // Killed-state launch: the app was opened BY tapping a notification, so
    // the live listener below never fires for it — it only catches taps
    // that happen while already running/backgrounded.
    if (!handledLaunchResponse.current) {
      handledLaunchResponse.current = true;
      Notifications.getLastNotificationResponseAsync?.()
        .then((response: NotificationResponse | null | undefined) => {
          if (response) handleResponse(response);
        })
        .catch(() => {});
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => subscription.remove();
  }, [userId, role, router, navigationState?.key]);
}
