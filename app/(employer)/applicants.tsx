import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
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
import { Users as UsersIcon } from 'lucide-react-native';

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
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [openingCvId, setOpeningCvId] = useState<string | null>(null);

  const filters: { key: 'all' | ApplicationStatus; label: string }[] = [
    { key: 'all', label: tr('common.all') },
    { key: 'pending', label: tr('employer.status.pending') },
    { key: 'shortlisted', label: tr('employer.status.shortlisted') },
    { key: 'rejected', label: tr('employer.status.rejected') },
  ];

  const filtered = filter === 'all'
    ? allApplications
    : allApplications.filter((a) => a.status === filter);

  const handleOpenCv = async (application: Application) => {
    const cvUrl = application.cvUrl || application.candidate?.cvUrl;

    if (!cvUrl) {
      Alert.alert(tr('common.error'), tr('common.notAvailable'));
      return;
    }

    setOpeningCvId(application.id);

    try {
      const resolvedUrl = await fileStorageService.resolveFileUrl(cvUrl);

      if (!resolvedUrl) {
        throw new Error(tr('common.notAvailable'));
      }

      const canOpen = await Linking.canOpenURL(resolvedUrl);

      if (!canOpen) {
        throw new Error(tr('common.error'));
      }

      await Linking.openURL(resolvedUrl);
    } catch (error) {
      Alert.alert(
        tr('common.error'),
        error instanceof Error ? error.message : tr('common.error')
      );
    } finally {
      setOpeningCvId(null);
    }
  };

  const renderApplicant = ({ item }: { item: Application }) => {
    const candidate = item.candidate;
    const candidateSkills = candidate?.skills ?? [];
    const hasCv = !!(item.cvUrl || candidate?.cvUrl);

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
        <Text style={[{ color: colors.textPrimary, ...t.headingLarge }]}>
          {tr('employer.applicants')}
        </Text>
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
          data={filtered}
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
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  actionRow: { flexDirection: 'row' },
  actionCell: { flex: 1, minWidth: 0 },
});
