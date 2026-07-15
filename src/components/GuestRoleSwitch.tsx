import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Repeat } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/store/authStore';

/**
 * Lets a not-signed-in visitor flip between the candidate and employer
 * interfaces while browsing. Renders nothing once signed in.
 */
export function GuestRoleSwitch() {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const guestRole = useAuthStore((s) => s.guestRole);
  const setGuestRole = useAuthStore((s) => s.setGuestRole);

  if (user || !guestRole) return null;

  const other = guestRole === 'employer' ? 'candidate' : 'employer';
  const onSwitch = () => {
    setGuestRole(other);
    router.replace((other === 'employer' ? '/(employer)/dashboard' : '/(candidate)/home') as never);
  };

  return (
    <TouchableOpacity
      onPress={onSwitch}
      activeOpacity={0.8}
      style={[styles.pill, { backgroundColor: colors.primaryLight }]}
    >
      <Repeat size={14} color={colors.primary} strokeWidth={2} />
      <Text style={[{ color: colors.primary, marginLeft: 6 }, t.caption]}>
        {other === 'employer' ? tr('guest.switchToEmployer') : tr('guest.switchToCandidate')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 10,
  },
});
