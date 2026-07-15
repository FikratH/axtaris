import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { UserSearch, Building2, ArrowRight } from 'lucide-react-native';
import { FadeInView, ScaleInView } from '@/components/ui/Animated';

const { width } = Dimensions.get('window');
const LOGO_ICON = require('@/assets/axtaris_logo_icon_png.png');

export default function RoleSelectScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSelectedRole = useAuthStore((s) => s.setSelectedRole);
  const setGuestRole = useAuthStore((s) => s.setGuestRole);

  const handleSelectRole = (role: 'candidate' | 'employer') => {
    setSelectedRole(role);
    setGuestRole(role);
    router.replace(role === 'employer' ? '/(employer)/dashboard' : '/(candidate)/home');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 40 }]}>
      <FadeInView delay={0} style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={LOGO_ICON} style={styles.logoIcon} resizeMode="contain" />
          <Text style={[styles.logoText, { color: colors.textPrimary }]}>
            Axtar<Text style={{ color: colors.primary }}>IS</Text>
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary, ...t.displaySmall, marginTop: s['3xl'] }]}>
          {tr('roleSelect.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, ...t.bodyMedium, marginTop: s.sm }]}>
          {tr('roleSelect.subtitle')}
        </Text>
      </FadeInView>

      <View style={[styles.cardsContainer, { paddingHorizontal: s.xl, marginTop: s['4xl'] }]}>
        <ScaleInView delay={150}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSelectRole('candidate')}
          style={[
            styles.roleCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: r.xl,
              padding: s['2xl'],
            },
          ]}
        >
          <View style={[styles.roleIcon, { backgroundColor: colors.primaryLight }]}>
            <UserSearch size={24} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={[{ color: colors.textPrimary, ...t.headingMedium, marginTop: s.lg }]}>
            {tr('roleSelect.jobSeeker')}
          </Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: s.xs }]}>
            {tr('roleSelect.jobSeekerDesc')}
          </Text>
          <View style={[styles.arrow, { backgroundColor: colors.primaryLight, borderRadius: r.full }]}>
            <ArrowRight size={18} color={colors.primary} strokeWidth={2} />
          </View>
        </TouchableOpacity>
        </ScaleInView>

        <ScaleInView delay={250}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSelectRole('employer')}
          style={[
            styles.roleCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: r.xl,
              padding: s['2xl'],
              marginTop: s.lg,
            },
          ]}
        >
          <View style={[styles.roleIcon, { backgroundColor: colors.accentLight }]}>
            <Building2 size={24} color={colors.accent} strokeWidth={1.8} />
          </View>
          <Text style={[{ color: colors.textPrimary, ...t.headingMedium, marginTop: s.lg }]}>
            {tr('roleSelect.employer')}
          </Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: s.xs }]}>
            {tr('roleSelect.employerDesc')}
          </Text>
          <View style={[styles.arrow, { backgroundColor: colors.accentLight, borderRadius: r.full }]}>
            <ArrowRight size={18} color={colors.accent} strokeWidth={2} />
          </View>
        </TouchableOpacity>
        </ScaleInView>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/auth/sign-in')}
        activeOpacity={0.7}
        style={[styles.signInLink, { paddingBottom: insets.bottom + 24 }]}
      >
        <Text style={[{ color: colors.textSecondary }, t.bodySmall]}>
          {tr('auth.hasAccount')}{' '}
          <Text style={{ color: colors.primary }}>{tr('auth.signIn')}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 48,
    height: 48,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginLeft: 10,
  },
  title: {},
  subtitle: {},
  cardsContainer: {},
  signInLink: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 24,
  },
  roleCard: {
    borderWidth: 1,
    position: 'relative',
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
