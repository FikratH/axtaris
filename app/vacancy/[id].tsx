import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useApplyToVacancy,
  useCandidateApplications,
  useSavedJobIds,
  useToggleSavedJob,
} from '@/hooks/useCandidateVacancyActions';
import { useCandidateSubscriptionSummary } from '@/hooks/useSubscriptionQueries';
import { useVacancy } from '@/hooks/useVacancyQueries';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import {
  getSubscriptionPlanLabel,
  getSubscriptionSummaryLine,
} from '@/utils/subscriptionPresentation';
import { ChevronLeft, Bookmark, BookmarkCheck, MapPin, Briefcase, BarChart3, Banknote, CheckCircle2, BadgeCheck, Star } from 'lucide-react-native';

const workTypeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  internship: 'Internship',
};

export default function VacancyDetailScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const isEmployer = user?.role === 'employer';
  const { data: savedJobIds = [] } = useSavedJobIds(user?.id);
  const toggleSave = useToggleSavedJob(user?.id);
  const { data: applications = [] } = useCandidateApplications(user?.id);
  const { data: subscriptionSummary } = useCandidateSubscriptionSummary(user?.id);
  const applyToVacancy = useApplyToVacancy(user?.id);
  const {
    data: vacancy,
    isLoading,
    isError,
    refetch,
  } = useVacancy(id);

  const applied = applications.some((application) => application.vacancyId === (id || ''));
  const saved = savedJobIds.includes(id || '');

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 16,
            paddingHorizontal: s.xl,
          },
        ]}
      >
        <VacancyCardSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <EmptyState
          title={tr('common.error')}
          subtitle={tr('common.retry')}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  if (!vacancy) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <EmptyState
          title={tr('common.error')}
          subtitle={tr('common.noResults')}
        />
      </View>
    );
  }

  const salary =
    vacancy.showSalary && vacancy.salaryMin
      ? `${vacancy.salaryMin}${vacancy.salaryMax ? ` - ${vacancy.salaryMax}` : '+'} ${vacancy.salaryCurrency || 'AZN'}`
      : null;

  const handleApply = async () => {
    if (!id) return;

    try {
      await applyToVacancy.mutateAsync(id);
      Alert.alert(tr('candidate.applied'));
    } catch (error: any) {
      Alert.alert(tr('common.error'), error?.message || tr('common.error'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: s.xl }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
          >
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => id && toggleSave.mutate(id)}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
          >
            {saved
              ? <BookmarkCheck size={20} color={colors.primary} strokeWidth={1.8} />
              : <Bookmark size={20} color={colors.textTertiary} strokeWidth={1.8} />
            }
          </TouchableOpacity>
        </View>

        <View style={[styles.companySection, { paddingHorizontal: s.xl, marginTop: s.xl }]}> 
          <Avatar uri={vacancy.company?.logoUrl} name={vacancy.company?.name} size={56} />
          <Text style={[{ color: colors.textPrimary, ...t.displaySmall, marginTop: s.lg }]}> 
            {vacancy.title}
          </Text>
          <TouchableOpacity activeOpacity={0.7} style={[styles.companyRow, { marginTop: s.sm }]}>
            <Text style={[{ color: colors.primary, ...t.labelMedium }]}>
              {vacancy.company?.name}
            </Text>
            {vacancy.company?.verificationStatus === 'verified' && (
              <BadgeCheck size={16} color={colors.primary} strokeWidth={1.8} style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.metaSection, { paddingHorizontal: s.xl, marginTop: s.xl }]}>
          <View style={styles.metaRow}>
            <View style={[styles.metaItem, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md, padding: s.md }]}>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('candidate.location')}</Text>
              <Text style={[{ color: colors.textPrimary, ...t.labelSmall, marginTop: 2 }]}>{vacancy.city}</Text>
            </View>
            <View style={[styles.metaItem, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md, padding: s.md, marginLeft: s.sm }]}>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('candidate.jobType')}</Text>
              <Text style={[{ color: colors.textPrimary, ...t.labelSmall, marginTop: 2 }]}>{workTypeLabels[vacancy.workType]}</Text>
            </View>
          </View>
          <View style={[styles.metaRow, { marginTop: s.sm }]}>
            <View style={[styles.metaItem, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md, padding: s.md }]}>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('candidate.experience')}</Text>
              <Text style={[{ color: colors.textPrimary, ...t.labelSmall, marginTop: 2 }]}>{vacancy.experienceLevel}</Text>
            </View>
            {salary && (
              <View style={[styles.metaItem, { backgroundColor: colors.successLight, borderRadius: r.md, padding: s.md, marginLeft: s.sm }]}>
                <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('candidate.salary')}</Text>
                <Text style={[{ color: colors.success, ...t.labelSmall, marginTop: 2 }]}>{salary}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.statsBar, { paddingHorizontal: s.xl, marginTop: s.xl }]}>
          <View style={styles.statItem}>
            <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{vacancy.applicantCount}</Text>
            <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('candidate.applicants')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{vacancy.viewCount}</Text>
            <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.views')}</Text>
          </View>
          {vacancy.responseRate && (
            <>
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.statItem}>
                <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{vacancy.responseRate}%</Text>
                <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.responses')}</Text>
              </View>
            </>
          )}
        </View>

        <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
          <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.md }]}>
            {tr('candidate.description')}
          </Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, lineHeight: 24 }]}>
            {vacancy.description}
          </Text>
        </View>

        <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
          <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.md }]}>
            {tr('candidate.requirements')}
          </Text>
          {vacancy.requirements.map((req, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={[{ color: colors.primary, ...t.bodyMedium }]}>•</Text>
              <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginLeft: s.sm, flex: 1 }]}>
                {req}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
          <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.md }]}>
            {tr('candidate.responsibilities')}
          </Text>
          {vacancy.responsibilities.map((resp, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={[{ color: colors.primary, ...t.bodyMedium }]}>•</Text>
              <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginLeft: s.sm, flex: 1 }]}>
                {resp}
              </Text>
            </View>
          ))}
        </View>

        {vacancy.benefits.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
            <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.md }]}>
              {tr('candidate.benefits')}
            </Text>
            {vacancy.benefits.map((ben, i) => (
              <View key={i} style={styles.bulletItem}>
                <CheckCircle2 size={14} color={colors.success} strokeWidth={2} />
                <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginLeft: s.sm, flex: 1 }]}>
                  {ben}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
          <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.md }]}>
            {tr('candidate.skills')}
          </Text>
          <View style={styles.chipGrid}>
            {vacancy.skills.map((skill) => (
              <Chip key={skill} label={skill} style={{ marginBottom: 6 }} />
            ))}
          </View>
        </View>

        {vacancy.company && (
          <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
            <Text style={[{ color: colors.textSecondary, marginTop: s.sm, marginBottom: s.md }, t.bodySmall]}> 
              {tr('candidate.aboutCompany')}
            </Text>
            <View style={[styles.companyCard, { backgroundColor: colors.surfaceSecondary, borderRadius: r.lg, padding: s.lg }]}> 
              <View style={styles.companyCardHeader}>
                <Avatar uri={vacancy.company.logoUrl} name={vacancy.company.name} size={44} />
                <View style={{ marginLeft: s.md, flex: 1 }}>
                  <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{vacancy.company.name}</Text>
                  <Text style={[{ color: colors.textSecondary, ...t.caption }]}>{vacancy.company.industry}</Text>
                </View>
                {vacancy.company.rating && (
                  <Badge label={`${vacancy.company.rating}`} variant="success" />
                )}
              </View>
              {vacancy.company.description && (
                <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: s.md, lineHeight: 20 }]}>
                  {vacancy.company.description}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.divider,
            paddingBottom: insets.bottom + 12,
            paddingHorizontal: s.xl,
          },
        ]}
      >
        {isEmployer ? (
          <Button
            title={tr('employer.viewApplicants')}
            onPress={() => router.push('/(employer)/applicants')}
            size="lg"
          />
        ) : (
          <View>
            {subscriptionSummary ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/subscription' as never)}
                style={[styles.subscriptionHint, { backgroundColor: colors.backgroundSecondary, borderColor: colors.divider, borderRadius: r.lg, marginBottom: s.md }]}
              >
                <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>
                  {getSubscriptionPlanLabel(tr, subscriptionSummary.subscription.plan)}
                </Text>
                <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.caption]}>
                  {getSubscriptionSummaryLine(tr, subscriptionSummary)}
                </Text>
              </TouchableOpacity>
            ) : null}
            <Button
              title={applied ? tr('candidate.applied') : tr('candidate.applyNow')}
              onPress={handleApply}
              disabled={applied || applyToVacancy.isPending}
              loading={applyToVacancy.isPending}
              size="lg"
              variant={applied ? 'secondary' : 'primary'}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companySection: {
    alignItems: 'center',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaSection: {},
  metaRow: {
    flexDirection: 'row',
  },
  metaItem: {
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  section: {},
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  companyCard: {},
  companyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  subscriptionHint: {
    borderWidth: 1,
    padding: 12,
  },
});
