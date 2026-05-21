import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useEmployerApplications, useNotifications } from '@/hooks/useEngagementQueries';
import { useEmployerVacancies } from '@/hooks/useVacancyQueries';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SubscriptionPill } from '@/components/ui/SubscriptionPill';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import {
  getSubscriptionCatalogDescription,
  getSubscriptionCatalogTitle,
  getSubscriptionPlanHighlights,
} from '@/utils/subscriptionPresentation';
import { Bell, Plus, Users, Briefcase, Eye, UserCheck, TrendingUp, ChevronRight } from 'lucide-react-native';

export default function EmployerDashboardScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((st) => st.user);
  const { data: applications = [], isLoading: applicationsLoading } = useEmployerApplications(user?.id);
  const { data: notifications = [] } = useNotifications(user?.id);
  const { data: vacancies = [], isLoading: vacanciesLoading } = useEmployerVacancies(user?.id);

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const hasUnreadNotifications = notifications.some((notification) => !notification.read);

  const analytics = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const totalVacancies = vacancies.length;
    const totalApplicants = applications.length;
    const totalViews = vacancies.reduce((sum, vacancy) => sum + (vacancy.viewCount || 0), 0);
    const weeklyApplicants = applications.filter(
      (application) => new Date(application.appliedAt).getTime() >= weekAgo
    ).length;
    const shortlisted = applications.filter((application) => application.status === 'shortlisted').length;
    const hired = applications.filter((application) => application.status === 'accepted').length;
    const rejected = applications.filter((application) => application.status === 'rejected').length;
    const reviewed = applications.filter((application) => application.status !== 'pending').length;
    const responseRate = totalApplicants > 0 ? Math.round((reviewed / totalApplicants) * 100) : 0;

    return {
      totalVacancies,
      totalApplicants,
      totalViews,
      weeklyApplicants,
      shortlisted,
      hired,
      rejected,
      responseRate,
    };
  }, [applications, vacancies]);

  const stats = [
    { label: tr('employer.activeVacancies'), value: analytics.totalVacancies, icon: Briefcase, color: colors.primary, bg: isDark ? 'rgba(91,127,214,0.12)' : '#EEF2FF' },
    { label: tr('employer.totalApplicants'), value: analytics.totalApplicants, icon: Users, color: colors.accent, bg: isDark ? 'rgba(34,211,238,0.12)' : '#E0F7FA' },
    { label: tr('employer.newApplicants'), value: analytics.weeklyApplicants, icon: TrendingUp, color: colors.success, bg: isDark ? 'rgba(52,211,153,0.12)' : '#ECFDF5' },
    { label: tr('employer.hired'), value: analytics.hired, icon: UserCheck, color: colors.warning, bg: isDark ? 'rgba(251,191,36,0.12)' : '#FFFBEB' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={isDark ? ['#111827', '#1A2544', '#111827'] : ['#1B2E5A', '#2D4797', '#3755A0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, t.bodySmall]}>
              {tr('candidate.greeting', { name: firstName })}
            </Text>
            <Text style={[styles.headerTitle, t.headingLarge]}>
              {tr('employer.dashboard')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.headerIconBtn}
          >
            <Bell size={20} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
            {hasUnreadNotifications && (
              <View style={[styles.notifDot, { backgroundColor: colors.error }]} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Stats Grid ── */}
      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
              <stat.icon size={18} color={stat.color} strokeWidth={1.8} />
            </View>
            <Text style={[{ color: colors.textPrimary, marginTop: 10 }, t.displaySmall]}>{stat.value}</Text>
            <Text style={[{ color: colors.textTertiary, marginTop: 2 }, t.caption]} numberOfLines={1}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          onPress={() => router.push('/vacancy/create')}
          activeOpacity={0.7}
          style={[styles.quickAction, { backgroundColor: isDark ? 'rgba(91,127,214,0.12)' : '#EEF2FF', borderColor: colors.primary + '20' }]}
        >
          <Plus size={20} color={colors.primary} strokeWidth={2} />
          <Text style={[{ color: colors.primary, marginLeft: 8 }, t.labelSmall]}>{tr('employer.createVacancy')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(employer)/applicants')}
          activeOpacity={0.7}
          style={[styles.quickAction, { backgroundColor: isDark ? 'rgba(34,211,238,0.12)' : '#E0F7FA', borderColor: colors.accent + '20', marginLeft: 10 }]}
        >
          <Users size={20} color={colors.accent} strokeWidth={2} />
          <Text style={[{ color: colors.accent, marginLeft: 8 }, t.labelSmall]}>{tr('employer.viewApplicants')}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/subscription' as never)}
        >
          <Card padding="lg" style={{ borderWidth: 1, borderColor: colors.cardBorder }}>
            <View style={styles.subscriptionCardHeader}>
              <View style={[styles.subscriptionIcon, { backgroundColor: isDark ? 'rgba(91,127,214,0.16)' : '#EEF2FF' }]}>
                <TrendingUp size={18} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[{ color: colors.textPrimary }, t.labelMedium]}>{getSubscriptionCatalogTitle(tr, 'employer')}</Text>
                <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.bodySmall]}>{getSubscriptionCatalogDescription(tr, 'employer')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />
            </View>

            <View style={[styles.subscriptionHighlights, { marginTop: 12 }]}> 
              {getSubscriptionPlanHighlights(tr, 'premium', 'employer').map((item) => (
                <Text key={item} style={[{ color: colors.textTertiary }, t.caption]}>
                  {item}
                </Text>
              ))}
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* ── New Applicants ── */}
      <View style={{ marginTop: 20 }}>
        <SectionHeader
          title={tr('employer.newApplicants')}
          actionTitle={tr('common.seeAll')}
          onAction={() => router.push('/(employer)/applicants')}
        />
        <View style={{ paddingHorizontal: 20 }}>
          {applicationsLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <VacancyCardSkeleton key={index} />
              ))
            : applications.slice(0, 3).map((app) => (
                <Card key={app.id} onPress={() => router.push('/(employer)/applicants')} padding="md" style={{ marginBottom: 10 }}>
                  <View style={styles.applicantRow}>
                    <Avatar uri={app.candidate?.user?.avatarUrl} name={app.candidate?.user?.fullName || 'Candidate'} size={42} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[{ color: colors.textPrimary }, t.labelMedium]} numberOfLines={1}>
                        {app.candidate?.user?.fullName || 'Candidate'}
                      </Text>
                      <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]} numberOfLines={1}>
                        {app.vacancy?.title}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <SubscriptionPill
                        planCode={app.subscriptionPlan || 'free'}
                        style={{ marginBottom: 6 }}
                      />
                      <Badge
                        label={app.status === 'pending' ? tr('employer.pendingReview') : app.status}
                        variant={app.status === 'pending' ? 'warning' : app.status === 'shortlisted' ? 'success' : 'info'}
                      />
                    </View>
                  </View>
                </Card>
              ))}
        </View>
      </View>

      {/* ── Active Vacancies ── */}
      <View style={{ marginTop: 20 }}>
        <SectionHeader
          title={tr('employer.activeVacancies')}
          actionTitle={tr('common.seeAll')}
          onAction={() => router.push('/(employer)/vacancies')}
        />
        <View style={{ paddingHorizontal: 20 }}>
          {vacanciesLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <VacancyCardSkeleton key={index} />
              ))
            : vacancies.slice(0, 3).map((vacancy) => (
                <Card
                  key={vacancy.id}
                  onPress={() => router.push({ pathname: '/vacancy/[id]', params: { id: vacancy.id } })}
                  padding="md"
                  style={{ marginBottom: 10 }}
                >
                  <View style={styles.vacancyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ color: colors.textPrimary }, t.labelMedium]} numberOfLines={1}>{vacancy.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Users size={12} color={colors.textTertiary} strokeWidth={1.8} />
                          <Text style={[{ color: colors.textTertiary, marginLeft: 4 }, t.caption]}>{vacancy.applicantCount}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Eye size={12} color={colors.textTertiary} strokeWidth={1.8} />
                          <Text style={[{ color: colors.textTertiary, marginLeft: 4 }, t.caption]}>{vacancy.viewCount}</Text>
                        </View>
                      </View>
                    </View>
                    <Badge label={vacancy.status === 'active' ? 'Active' : vacancy.status} variant="success" />
                  </View>
                </Card>
              ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  greeting: { color: 'rgba(255,255,255,0.7)' },
  headerTitle: { color: '#FFFFFF', marginTop: 2 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, marginTop: 16, gap: 10,
  },
  statCard: {
    width: '48%' as any, flexGrow: 1,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row', paddingHorizontal: 20, marginTop: 16,
  },
  quickAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  subscriptionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionHighlights: {
    gap: 6,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vacancyRow: { flexDirection: 'row', alignItems: 'center' },
});
