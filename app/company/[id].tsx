import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useSavedJobIds,
  useToggleSavedJob,
} from '@/hooks/useCandidateVacancyActions';
import { useCompany, useCompanyVacancies } from '@/hooks/useVacancyQueries';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCard } from '@/components/ui/VacancyCard';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { getVerificationPresentation } from '@/utils/labels';
import { safeBack } from '@/utils/navigation';
import { Building2, ChevronLeft, Globe, Star, Users } from 'lucide-react-native';

export default function CompanyDetailScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const user = useAuthStore((state) => state.user);
  const isCandidate = user?.role !== 'employer';
  const { data: company, isLoading, isError, refetch } = useCompany(id);
  const { data: vacancies = [], isLoading: vacanciesLoading } = useCompanyVacancies(id);
  const { data: savedJobIds = [] } = useSavedJobIds(isCandidate ? user?.id : undefined);
  const toggleSave = useToggleSavedJob(user?.id);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16, paddingHorizontal: s.xl }]}>
        <VacancyCardSkeleton />
      </View>
    );
  }

  if (isError || !company) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <EmptyState
          title={tr('common.error')}
          subtitle={isError ? tr('common.retry') : tr('common.noResults')}
          actionTitle={isError ? tr('common.retry') : undefined}
          onAction={isError ? () => refetch() : undefined}
        />
      </View>
    );
  }

  const verification = getVerificationPresentation(tr, company.verificationStatus);

  const details = [
    { label: tr('employer.industry'), value: company.industry },
    { label: tr('candidate.location'), value: company.location },
    { label: tr('employer.employeeCount'), value: company.employeeCount },
    { label: tr('employer.founded'), value: company.foundedYear?.toString() },
  ].filter((item) => !!item.value);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: s.xl }]}>
          <TouchableOpacity
            onPress={() => safeBack(router, isCandidate ? '/(candidate)/home' : '/(employer)/dashboard')}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
          >
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={[styles.headerSection, { paddingHorizontal: s.xl, marginTop: s.lg }]}>
          <Avatar uri={company.logoUrl} name={company.name} size={72} />
          <Text style={[{ color: colors.textPrimary, ...t.displaySmall, marginTop: s.lg }]}>{company.name}</Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginTop: s.xs }]}>{company.industry}</Text>
          <Badge label={verification.label} variant={verification.variant} style={{ marginTop: s.sm }} />
        </View>

        <View style={[styles.statsRow, { marginHorizontal: s.xl, marginTop: s.xl, backgroundColor: colors.surfaceSecondary, borderRadius: r.lg }]}>
          <View style={styles.stat}>
            <Text style={[{ color: colors.textPrimary, ...t.headingSmall }]}>{vacancies.length}</Text>
            <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.vacancies')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <View style={styles.ratingRow}>
              <Star size={13} color={colors.warning} strokeWidth={2} fill={company.rating ? colors.warning : 'transparent'} />
              <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginLeft: 4 }]}>{company.rating ?? '—'}</Text>
            </View>
            <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.rating')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Text style={[{ color: colors.textPrimary, ...t.headingSmall }]} numberOfLines={1}>{company.employeeCount || '—'}</Text>
            <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.employeeCount')}</Text>
          </View>
        </View>

        {company.website ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => company.website && Linking.openURL(company.website)}
            style={[styles.websiteRow, { marginHorizontal: s.xl, marginTop: s.md, backgroundColor: colors.surfaceSecondary, borderRadius: r.md, paddingHorizontal: s.lg, paddingVertical: s.md }]}
          >
            <Globe size={16} color={colors.primary} strokeWidth={1.8} />
            <Text style={[{ color: colors.primary, marginLeft: s.sm, flex: 1 }, t.labelSmall]} numberOfLines={1}>
              {company.website}
            </Text>
          </TouchableOpacity>
        ) : null}

        {company.description ? (
          <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
            <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.md }]}>{tr('candidate.aboutCompany')}</Text>
            <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, lineHeight: 24 }]}>{company.description}</Text>
          </View>
        ) : null}

        {details.length > 0 ? (
          <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
            <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.sm }]}>{tr('employer.details')}</Text>
            {details.map((item, i) => (
              <View
                key={i}
                style={[styles.detailRow, { paddingVertical: s.md, borderBottomWidth: i < details.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.divider }]}
              >
                <Text style={[{ color: colors.textTertiary }, t.bodySmall]}>{item.label}</Text>
                <Text style={[{ color: colors.textPrimary, flexShrink: 1, textAlign: 'right' }, t.labelSmall]}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
          <View style={styles.positionsHeader}>
            <Users size={16} color={colors.primary} strokeWidth={1.8} />
            <Text style={[{ color: colors.textPrimary, marginLeft: s.sm, ...t.headingSmall }]}>{tr('employer.activeVacancies')}</Text>
          </View>
          {vacanciesLoading ? (
            <View style={{ marginTop: s.md }}>
              {Array.from({ length: 2 }).map((_, index) => (
                <VacancyCardSkeleton key={index} />
              ))}
            </View>
          ) : vacancies.length === 0 ? (
            <View style={{ marginTop: s.md }}>
              <EmptyState
                title={tr('employer.noVacancies')}
                subtitle={tr('employer.noApplicantsDesc')}
                icon={<Building2 size={40} color={colors.textTertiary} strokeWidth={1.2} />}
              />
            </View>
          ) : (
            <View style={{ marginTop: s.md }}>
              {vacancies.map((vacancy) => (
                <VacancyCard
                  key={vacancy.id}
                  vacancy={vacancy}
                  onPress={() => router.push({ pathname: '/vacancy/[id]', params: { id: vacancy.id } })}
                  onSave={isCandidate ? () => toggleSave.mutate(vacancy.id) : undefined}
                  saved={savedJobIds.includes(vacancy.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerSection: { alignItems: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  stat: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 30 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  websiteRow: { flexDirection: 'row', alignItems: 'center' },
  section: {},
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  positionsHeader: { flexDirection: 'row', alignItems: 'center' },
});
