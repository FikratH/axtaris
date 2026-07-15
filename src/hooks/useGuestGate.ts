import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';

/**
 * Guest gating for pre-login browsing. `isGuest` is true when someone is
 * exploring the app without an account. `requireAuth()` returns true when the
 * action may proceed, or prompts sign-in and returns false for a guest.
 */
export function useGuestGate() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const guestRole = useAuthStore((s) => s.guestRole);
  const isGuest = !user && !!guestRole;

  const requireAuth = (): boolean => {
    if (!isGuest) return true;
    Alert.alert(tr('guest.signInRequiredTitle'), tr('guest.signInRequiredMessage'), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('auth.signIn'), onPress: () => router.push('/auth/sign-in') },
    ]);
    return false;
  };

  return { isGuest, requireAuth };
}
