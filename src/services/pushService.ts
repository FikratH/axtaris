import { Platform } from 'react-native';
import { getSupabase, shouldUseMockBackend } from './supabase';

// expo-notifications is a native module; load it lazily and never on web.
let Notifications: typeof import('expo-notifications') | null = null;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
}

export function getNotificationsModule() {
  return Notifications;
}

/**
 * Request permission, obtain the Expo push token, and persist it on the user's
 * profile (profiles.expo_push_token) so the `send-push` Edge Function can
 * deliver notifications. Native-only; a no-op on web and in mock mode's
 * persistence step. Returns the token or null.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications || !userId) return null;

  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;
    if (!token) return null;

    if (!shouldUseMockBackend()) {
      const { error } = await getSupabase()
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);
      if (error) return null;
    }

    return token;
  } catch {
    return null;
  }
}

/** Clear the stored token (e.g. on sign-out) so a signed-out device stops receiving pushes. */
export async function clearPushToken(userId: string): Promise<void> {
  if (!userId || shouldUseMockBackend()) return;
  try {
    await getSupabase().from('profiles').update({ expo_push_token: null }).eq('id', userId);
  } catch {
    // best-effort
  }
}
