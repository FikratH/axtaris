import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { UserSearch, Building2, ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function RoleSelectScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSelectedRole = useAuthStore((s) => s.setSelectedRole);

  const handleSelectRole = (role: 'candidate' | 'employer') => {
    setSelectedRole(role);
    router.push('/auth/sign-in');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 40 }]}>
      <View style={styles.header}>
        <Text style={[styles.appName, { color: colors.textPrimary }]}>
          Axtar<Text style={{ color: colors.primary }}>IS</Text>
        </Text>
        <Text style={[styles.title, { color: colors.textPrimary, ...t.displaySmall, marginTop: s['3xl'] }]}>
          {tr('roleSelect.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, ...t.bodyMedium, marginTop: s.sm }]}>
          {tr('roleSelect.subtitle')}
        </Text>
      </View>

      <View style={[styles.cardsContainer, { paddingHorizontal: s.xl, marginTop: s['4xl'] }]}>
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
      </View>
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
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {},
  subtitle: {},
  cardsContainer: {},
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
