import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useEmployerApplications,
  useUpdateApplicationStatus,
} from '@/hooks/useEngagementQueries';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SubscriptionPill } from '@/components/ui/SubscriptionPill';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { Application, ApplicationStatus } from '@/types/models';
import { fileStorageService } from '@/services/fileStorageService';
import { useEmployerEntitlements } from '@/hooks/useEntitlements';
import { aiService } from '@/services/aiService';
import { Users as UsersIcon, MessageCircle, Sparkles } from 'lucide-react-native';

const statusVariant: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  reviewed: 'info',
  shortlisted: 'success',
  rejected: 'error',
  accepted: 'success',
};

function getStatusLabel(status: ApplicationStatus, tr: (key: string) => string) {
  const labels: Record<ApplicationStatus, string> = {
    pending: tr('employer.status.pending'),
    reviewed: tr('employer.status.reviewed'),
    shortlisted: tr('employer.status.shortlisted'),
    rejected: tr('employer.status.rejected'),
    accepted: tr('employer.status.accepted'),
  };

  return labels[status];
}

export default function ApplicantsScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    data: allApplications = [],
    isLoading,
    isError,
    refetch,
  } = useEmployerApplications(user?.id);
  const updateStatus = useUpdateApplicationStatus(user?.id);
  const { entitlements } = useEmployerEntitlements();
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [openingCvId, setOpeningCvId] = useState<string | null>(null);
  const [rankMap, setRankMap] = useState<Record<string, { score: number; reason: string }> | null>(null);
  const [ranking, setRanking] = useState(false);

  const rankByFit = async () => {
    if (!entitlements.aiApplicantRanking) {
      Alert.alert(
        tr('ai.upgradeTitle'),
        tr('ai.applicantRankingUpgrade'),
        [
          { text: tr('common.cancel'), style: 'cancel' },
          { text: tr('featured.viewPlans'), onPress: () => router.push('/subscription' as never) },
        ]
      );
      return;
    }

    setRanking(true);
    try {
      // Applications span multiple vacancies, so rank each applicant against the
      // vacancy they actually applied to, then merge every group's scores into a
      // single id -> {score, reason} lookup.
      const byVacancy = new Map<string, Application[]>();
      allApplications.forEach((app) => {
        const list = byVacancy.get(app.vacancyId) || [];
        list.push(app);
        byVacancy.set(app.vacancyId, list);
      });

      const map: Record<string, { score: number; reason: string }> = {};
      for (const apps of byVacancy.values()) {
        const ranked = await aiService.rankApplicants(
          { title: apps[0].vacancy?.title || '', skills: apps[0].vacancy?.skills || [] },
          apps.map((a) => ({ id: a.id, title: a.candidate?.title, skills: a.candidate?.skills || [] }))
        );
        ranked.forEach((entry) => {
          map[entry.id] = { score: entry.score, reason: entry.reason };
        });
      }
      setRankMap(map);
    } catch (error: any) {
      Alert.alert(tr('common.error'), error?.message || tr('common.error'));
    } finally {
      setRanking(false);
    }
  };

  const clearRanking = () => setRankMap(null);

  const filters: { key: 'all' | ApplicationStatus; label: string }[] = [
    { key: 'all', label: tr('common.all') },
    { key: 'pending', label: tr('employer.status.pending') },
    { key: 'shortlisted', label: tr('employer.status.shortlisted') },
    { key: 'rejected', label: tr('employer.status.rejected') },
  ];

  const filtered = filter === 'all'
    ? allApplications
    : allApplications.filter((a) => a.status === filter);

  // When ranked, reorder highest-fit first (scores are keyed by application id so
  // ranking composes with the status filter).
  const displayed = rankMap
    ? [...filtered].sort((a, b) => (rankMap[b.id]?.score ?? 0) - (rankMap[a.id]?.score ?? 0))
    : filtered;

  const handleOpenCv = (application: Application) => {
    const cvUrl = application.candidate?.cvUrl || application.cvUrl;

    if (!cvUrl) {
      Alert.alert(tr('common.error'), tr('common.notAvailable'));
      return;
    }

    router.push({
      pathname: '/cv-preview',
      params: { ref: cvUrl, name: application.candidate?.user?.fullName || tr('cv.title') },
    } as never);
  };

  const renderApplicant = ({ item }: { item: Application }) => {
    const candidate = item.candidate;
    const candidateSkills = candidate?.skills ?? [];
    const hasCv = !!(item.cvUrl || candidate?.cvUrl);
    const fit = rankMap?.[item.id];

    return (
      <Card padding="md" style={{ marginBottom: 10 }}>
        <View style={styles.applicantRow}>
          <Avatar uri={candidate?.user?.avatarUrl} name={candidate?.user?.fullName || tr('common.notAvailable')} size={48} />
          <View style={[styles.applicantInfo, { marginLeft: s.md }]}> 
            <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]} numberOfLines={1}>
              {candidate?.user?.fullName || tr('common.notAvailable')}
            </Text>
            <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: 2 }]} numberOfLines={1}>
              {candidate?.title || tr('common.notAvailable')}
            </Text>
            <Text style={[{ color: colors.textTertiary, ...t.caption, marginTop: 2 }]} numberOfLines={1}>
              {item.vacancy?.title}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <SubscriptionPill
              planCode={item.subscriptionPlan || 'free'}
              style={{ marginBottom: 6 }}
            />
            <Badge
              label={getStatusLabel(item.status, tr)}
              variant={statusVariant[item.status]}
            />
          </View>
        </View>

        {fit ? (
          <View style={[styles.fitRow, { backgroundColor: colors.primaryLight, borderRadius: r.md, marginTop: s.md }]}>
            <Sparkles size={13} color={colors.primary} strokeWidth={2} />
            <Text style={[{ color: colors.primary, marginLeft: 6 }, t.labelSmall]}>
              {tr('ai.fitScore', { score: fit.score })}
            </Text>
            <Text style={[{ color: colors.textSecondary, marginLeft: 8, flex: 1 }, t.caption]} numberOfLines={1}>
              {fit.reason}
            </Text>
          </View>
        ) : null}

        <View style={[styles.skillsRow, { marginTop: s.md }]}>
          {candidateSkills.slice(0, 3).map((sk) => (
            <Chip key={sk} label={sk} style={{ marginRight: 6 }} />
          ))}
          {candidateSkills.length > 3 && (
            <Text style={[{ color: colors.textTertiary, ...t.caption, alignSelf: 'center' }]}> 
              +{candidateSkills.length - 3}
            </Text>
          )}
        </View>

        <View style={{ marginTop: s.md, gap: 8 }}>
          <View style={[styles.actionRow, { gap: 8 }]}>
            <View style={styles.actionCell}>
              <Button
                title={tr('employer.review')}
                onPress={() =>
                  router.push({
                    pathname: '/(employer)/applicant/[id]',
                    params: { id: item.id },
                  } as never)
                }
                variant="secondary"
                size="sm"
              />
            </View>
            <View style={styles.actionCell}>
              <Button
                title={tr('employer.reject')}
                onPress={() =>
                  updateStatus.mutate(
                    {
                      applicationId: item.id,
                      status: 'rejected',
                    },
                    {
                      onError: (e) =>
                        Alert.alert(
                          tr('common.error'),
                          e instanceof Error ? e.message : tr('common.error')
                        ),
                    }
                  )
                }
                variant="outline"
                size="sm"
                disabled={item.status === 'rejected' || (updateStatus.isPending && updateStatus.variables?.applicationId === item.id)}
              />
            </View>
          </View>
          <View>
            <Button
              title={tr('employer.shortlist')}
              onPress={() =>
                updateStatus.mutate(
                  {
                    applicationId: item.id,
                    status: 'shortlisted',
                  },
                  {
                    onError: (e) =>
                      Alert.alert(
                        tr('common.error'),
                        e instanceof Error ? e.message : tr('common.error')
                      ),
                  }
                )
              }
              variant="primary"
              size="sm"
              disabled={item.status === 'shortlisted' || (updateStatus.isPending && updateStatus.variables?.applicationId === item.id)}
            />
          </View>
        </View>

        {hasCv ? (
          <View style={{ marginTop: s.sm }}>
            <Button
              title={tr('employer.download_cv')}
              onPress={() => handleOpenCv(item)}
              variant="ghost"
              size="sm"
              loading={openingCvId === item.id}
            />
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={[styles.header, { paddingHorizontal: s.xl }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[{ color: colors.textPrimary, ...t.headingLarge }]}>
            {tr('employer.applicants')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/messages' as never)}
            style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}
          >
            <MessageCircle size={20} color={colors.textPrimary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
        <View style={[styles.filterRow, { marginTop: s.md, gap: 8 }]}>
          {filters.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </View>
        {allApplications.length > 0 ? (
          <View style={{ marginTop: s.md }}>
            <Button
              title={rankMap ? tr('ai.clearRanking') : tr('ai.rankByFit')}
              onPress={rankMap ? clearRanking : rankByFit}
              loading={ranking}
              variant={rankMap ? 'secondary' : 'outline'}
              size="sm"
              fullWidth={false}
              style={{ alignSelf: 'flex-start' }}
              icon={<Sparkles size={16} color={rankMap ? colors.textPrimary : colors.primary} strokeWidth={2} />}
            />
          </View>
        ) : null}
      </View>

      {isError ? (
        <EmptyState
          title={tr('common.error')}
          subtitle={tr('common.retry')}
          icon={<UsersIcon size={48} color={colors.textTertiary} strokeWidth={1.2} />}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      ) : isLoading ? (
        <View style={{ paddingHorizontal: s.xl, paddingTop: s.lg }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <VacancyCardSkeleton key={index} />
          ))}
        </View>
      ) : (
        <FlatList
          data={displayed}
          contentContainerStyle={{ paddingHorizontal: s.xl, paddingTop: s.lg, paddingBottom: 24 }}
          renderItem={renderApplicant}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title={tr('employer.noApplicants')}
              subtitle={tr('employer.noApplicantsDesc')}
              icon={<UsersIcon size={48} color={colors.textTertiary} strokeWidth={1.2} />}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 4 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap' },
  applicantRow: { flexDirection: 'row', alignItems: 'center' },
  applicantInfo: { flex: 1 },
  fitRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  actionRow: { flexDirection: 'row' },
  actionCell: { flex: 1, minWidth: 0 },
});
