import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { usePlatformStats } from '@/hooks/useAdminQueries';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  ShieldAlert,
  BadgeCheck,
  Flag,
  UserCog,
  LogOut,
  Settings,
  MessageCircle,
} from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const { colors, typography: t, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore((state) => state.signOut);
  const { data: stats, isLoading, isError, refetch } = usePlatformStats();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/role-select');
  };

  const tiles = stats
    ? [
        { label: tr('admin.stats.users'), value: stats.totalUsers, sub: `${stats.candidates} · ${stats.employers}`, icon: Users, color: colors.primary, bg: colors.primaryLight },
        { label: tr('admin.stats.companies'), value: stats.totalCompanies, sub: `${stats.verifiedCompanies} ${tr('admin.stats.verified').toLowerCase()}`, icon: Building2, color: colors.accent, bg: colors.accentLight },
        { label: tr('admin.stats.vacancies'), value: stats.totalVacancies, sub: `${stats.activeVacancies} ${tr('admin.stats.active').toLowerCase()}`, icon: Briefcase, color: colors.success, bg: colors.successLight },
        { label: tr('admin.stats.applications'), value: stats.totalApplications, sub: undefined, icon: FileText, color: colors.info, bg: colors.infoLight },
        { label: tr('admin.stats.pendingModeration'), value: stats.pendingModerationVacancies, sub: undefined, icon: ShieldAlert, color: colors.warning, bg: colors.warningLight },
        { label: tr('admin.stats.pendingVerification'), value: stats.pendingVerificationCompanies, sub: undefined, icon: BadgeCheck, color: colors.warning, bg: colors.warningLight },
        { label: tr('admin.stats.flags'), value: stats.openFlags, sub: undefined, icon: Flag, color: colors.error, bg: colors.errorLight },
        { label: tr('admin.stats.admins'), value: stats.admins, sub: undefined, icon: UserCog, color: colors.primary, bg: colors.primaryLight },
      ]
    : [];

  const items = isLoading ? Array.from({ length: 8 }, () => null) : tiles;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={isDark ? ['#111827', '#1A2544', '#111827'] : ['#1B2E5A', '#2D4797', '#3755A0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, t.headingLarge]}>{tr('admin.panel')}</Text>
            <Text style={[styles.subtitle, t.bodySmall]}>{tr('admin.overview')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/messages' as never)} style={styles.headerBtn}>
            <MessageCircle size={19} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/preferences' as never)} style={[styles.headerBtn, { marginLeft: 8 }]}>
            <Settings size={19} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={[styles.headerBtn, { marginLeft: 8 }]}>
            <LogOut size={19} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {isError ? (
        <View style={{ paddingTop: 40 }}>
          <EmptyState
            title={tr('common.error')}
            subtitle={tr('common.retry')}
            actionTitle={tr('common.retry')}
            onAction={() => refetch()}
          />
        </View>
      ) : (
        <View style={styles.grid}>
          {items.map((tile, i) => {
            const Icon = tile?.icon;
            return (
              <View key={i} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                {tile && Icon ? (
                  <>
                    <View style={[styles.iconTile, { backgroundColor: tile.bg }]}>
                      <Icon size={18} color={tile.color} strokeWidth={1.8} />
                    </View>
                    <Text style={[{ color: colors.textPrimary, marginTop: 10 }, t.displaySmall]}>{tile.value}</Text>
                    <Text style={[{ color: colors.textTertiary, marginTop: 2 }, t.caption]} numberOfLines={1}>{tile.label}</Text>
                    {tile.sub ? (
                      <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.caption]} numberOfLines={1}>{tile.sub}</Text>
                    ) : null}
                  </>
                ) : (
                  <View style={{ height: 84 }} />
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#FFFFFF' },
  subtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 16, gap: 10 },
  card: { width: '47%', flexGrow: 1, padding: 14, borderRadius: 16, borderWidth: 1 },
  iconTile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
