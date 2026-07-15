import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useCandidateProfile,
  useSavedJobIds,
  useToggleSavedJob,
} from '@/hooks/useCandidateVacancyActions';
import { useCandidateSubscriptionSummary } from '@/hooks/useSubscriptionQueries';
import { useCandidateVacancies } from '@/hooks/useVacancyQueries';
import { useGuestGate } from '@/hooks/useGuestGate';
import { VacancyCard } from '@/components/ui/VacancyCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { GuestRoleSwitch } from '@/components/GuestRoleSwitch';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { StaggeredItem } from '@/components/ui/Animated';
import { rankVacanciesByMatch } from '@/utils/jobMatch';
import {
  getSubscriptionActionLabel,
  getSubscriptionPlanLabel,
  getSubscriptionSummaryLine,
} from '@/utils/subscriptionPresentation';
import { Search, Bell, TrendingUp, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CandidateHomeScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((st) => st.user);
  const { data: profile } = useCandidateProfile(user?.id);
  const { data: subscriptionSummary } = useCandidateSubscriptionSummary(user?.id);
  const { data: savedJobIds = [] } = useSavedJobIds(user?.id);
  const toggleSave = useToggleSavedJob(user?.id);
  const { requireAuth } = useGuestGate();
  const saveJob = (id: string) => {
    if (requireAuth()) toggleSave.mutate(id);
  };
  const {
    data: vacancies = [],
    isLoading: vacanciesLoading,
    isError: vacanciesError,
    refetch,
  } = useCandidateVacancies();

  const companies = useMemo(() => {
    const unique = new Map<string, NonNullable<(typeof vacancies)[number]['company']> & { vacancyCount: number }>();

    vacancies.forEach((vacancy) => {
      if (vacancy.company) {
        const existing = unique.get(vacancy.company.id);
        unique.set(vacancy.company.id, {
          ...vacancy.company,
          vacancyCount: (existing?.vacancyCount || 0) + 1,
        });
      }
    });

    return Array.from(unique.values());
  }, [vacancies]);

  const recommended = useMemo(
    () => rankVacanciesByMatch(profile, vacancies).slice(0, 4),
    [vacancies, profile]
  );

  const firstName = user?.fullName?.split(' ')[0] || tr('common.defaultUserName');
  const completeness = profile?.profileCompleteness || 0;

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
        <View style={styles.headerContent}>
          {/* Top row: greeting + avatar + bell */}
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, t.bodySmall]}>
                {tr('candidate.greeting', { name: firstName })}
              </Text>
              <Text style={[styles.headerTitle, t.headingLarge]}>
                {tr('candidate.recommendedJobs')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
              style={styles.headerIconBtn}
            >
              <Bell size={20} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(candidate)/profile')}
              activeOpacity={0.8}
              style={{ marginLeft: 10 }}
            >
              <Avatar name={user?.fullName} uri={user?.avatarUrl} size={40} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(candidate)/search')}
            style={styles.searchBar}
          >
            <Search size={18} color="rgba(255,255,255,0.68)" strokeWidth={1.8} />
            <Text style={[styles.searchText, t.bodyMedium]}>
              {tr('candidate.searchPlaceholder')}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <GuestRoleSwitch />

      {/* ── Profile Completion Banner ── */}
      {completeness < 100 && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(candidate)/profile')}
          style={[styles.completionBanner, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        >
          <View style={[styles.completionIcon, { backgroundColor: colors.primaryLight }]}>
            <Star size={20} color={colors.primary} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{tr('candidate.completeProfile')}</Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.border, marginTop: 6 }]}>
              <View style={[styles.progressFill, { width: `${completeness}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>
          <Text style={[{ color: colors.primary, marginLeft: 12 }, t.labelMedium]}>{completeness}%</Text>
        </TouchableOpacity>
      )}

      {subscriptionSummary ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/subscription' as never)}
          style={[styles.subscriptionBanner, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        >
          <View style={[styles.subscriptionIcon, { backgroundColor: colors.primaryLight }]}>
            <Star size={20} color={colors.primary} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>
              {getSubscriptionPlanLabel(tr, subscriptionSummary.subscription.plan)}
            </Text>
            <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.bodySmall]}>
              {getSubscriptionSummaryLine(tr, subscriptionSummary)}
            </Text>
          </View>
          <Text style={[{ color: colors.primary, marginLeft: 12 }, t.labelMedium]}>
            {getSubscriptionActionLabel(tr, subscriptionSummary.subscription.plan)}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* ── Recommended Jobs ── */}
      <View style={{ marginTop: 20 }}>
        <SectionHeader
          title={tr('candidate.recommendedJobs')}
          actionTitle={tr('common.seeAll')}
          onAction={() => router.push('/(candidate)/search')}
        />
        {vacanciesError ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              title={tr('common.error')}
              subtitle={tr('common.retry')}
              actionTitle={tr('common.retry')}
              onAction={() => refetch()}
            />
          </View>
        ) : vacanciesLoading ? (
          <FlatList
            data={[1, 2, 3]}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            renderItem={() => (
              <View style={{ width: width * 0.78 }}>
                <VacancyCardSkeleton />
              </View>
            )}
            keyExtractor={(item) => item.toString()}
          />
        ) : (
          <FlatList
            data={recommended}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            renderItem={({ item }) => (
              <View style={{ width: width * 0.78 }}>
                <VacancyCard
                  vacancy={item}
                  onPress={() => router.push({ pathname: '/vacancy/[id]', params: { id: item.id } })}
                  onSave={() => saveJob(item.id)}
                  saved={savedJobIds.includes(item.id)}
                  matchScore={item.match.score}
                  compact
                />
              </View>
            )}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>

      {/* ── Top Companies ── */}
      <View style={{ marginTop: 24 }}>
        <SectionHeader
          title={tr('candidate.topCompanies')}
          actionTitle={tr('common.seeAll')}
          onAction={() => {}}
        />
        <FlatList
          data={companies}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/company/[id]', params: { id: item.id } } as never)}
              style={[styles.companyCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            >
              <Avatar name={item.name} uri={item.logoUrl} size={44} />
              <Text style={[{ color: colors.textPrimary, marginTop: 8, textAlign: 'center' }, t.labelSmall]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.companyBadge, { backgroundColor: colors.successLight }]}>
                <TrendingUp size={10} color={colors.success} strokeWidth={2} />
                <Text style={[{ color: colors.success, marginLeft: 3 }, t.caption]}>{item.vacancyCount}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* ── Recent Jobs ── */}
      <View style={{ marginTop: 24 }}>
        <SectionHeader
          title={tr('candidate.recentJobs')}
          actionTitle={tr('common.seeAll')}
          onAction={() => router.push('/(candidate)/search')}
        />
        <View style={{ paddingHorizontal: 20 }}>
          {vacanciesLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <VacancyCardSkeleton key={index} />
            ))
          ) : (
            vacancies.slice(0, 4).map((vacancy, index) => (
              <StaggeredItem key={vacancy.id} index={index} staggerDelay={60}>
                <VacancyCard
                  vacancy={vacancy}
                  onPress={() => router.push({ pathname: '/vacancy/[id]', params: { id: vacancy.id } })}
                  onSave={() => saveJob(vacancy.id)}
                  saved={savedJobIds.includes(vacancy.id)}
                />
              </StaggeredItem>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.82)',
  },
  headerTitle: {
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchText: {
    color: 'rgba(255,255,255,0.68)',
    marginLeft: 10,
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  completionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionBanner: {
    marginTop: 14,
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  companyCard: {
    width: 120,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
});
