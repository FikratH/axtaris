import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useDeleteVacancy,
  useEmployerVacancies,
  useUpdateVacancyStatus,
} from '@/hooks/useVacancyQueries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Chip } from '@/components/ui/Chip';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { Vacancy, VacancyStatus } from '@/types/models';
import { getWorkTypeLabel } from '@/utils/labels';
import { Plus, Briefcase, Pause, Play, X, Trash2, Users, Eye, Pencil } from 'lucide-react-native';

const statusConfig: Record<VacancyStatus, { variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  active: { variant: 'success' },
  draft: { variant: 'default' },
  pending_moderation: { variant: 'warning' },
  paused: { variant: 'info' },
  closed: { variant: 'default' },
  rejected: { variant: 'error' },
};

function getVacancyStatusLabel(status: VacancyStatus, tr: (key: string) => string) {
  const labels: Record<VacancyStatus, string> = {
    active: tr('employer.status.active'),
    draft: tr('employer.status.draft'),
    pending_moderation: tr('employer.status.pendingModeration'),
    paused: tr('employer.status.paused'),
    closed: tr('employer.status.closed'),
    rejected: tr('employer.status.rejected'),
  };

  return labels[status];
}

export default function VacanciesScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    data: allVacancies = [],
    isLoading,
    isError,
    refetch,
  } = useEmployerVacancies(user?.id);
  const updateVacancyStatus = useUpdateVacancyStatus(user?.id);
  const deleteVacancy = useDeleteVacancy(user?.id);
  const [filter, setFilter] = useState<'all' | VacancyStatus>('all');

  const filters: { key: 'all' | VacancyStatus; label: string }[] = [
    { key: 'all', label: tr('common.all') },
    { key: 'active', label: tr('employer.status.active') },
    { key: 'paused', label: tr('employer.status.paused') },
    { key: 'closed', label: tr('employer.status.closed') },
  ];

  const filtered = filter === 'all' ? allVacancies : allVacancies.filter((v) => v.status === filter);

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      tr('common.confirm'),
      tr('employer.deleteVacancyConfirm', { title }),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVacancy.mutateAsync(id);
            } catch (error: any) {
              Alert.alert(tr('common.error'), error?.message || tr('common.error'));
            }
          },
        },
      ]
    );
  };

  const renderVacancy = ({ item }: { item: Vacancy }) => {
    const isActive = item.status === 'active';
    const isPaused = item.status === 'paused';
    const isClosed = item.status === 'closed';

    return (
      <Card padding="md" style={{ marginBottom: 12 }}>
        <View style={styles.vacancyHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[{ color: colors.textPrimary }, t.labelMedium]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>
              {item.city} · {getWorkTypeLabel(tr, item.workType)}
            </Text>
          </View>
          <Badge
            label={getVacancyStatusLabel(item.status, tr)}
            variant={statusConfig[item.status]?.variant || 'default'}
          />
        </View>

        <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
          <View style={styles.statItem}>
            <Users size={12} color={colors.textTertiary} strokeWidth={1.8} />
            <Text style={[{ color: colors.textTertiary, marginLeft: 4 }, t.caption]}>{item.applicantCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Eye size={12} color={colors.textTertiary} strokeWidth={1.8} />
            <Text style={[{ color: colors.textTertiary, marginLeft: 4 }, t.caption]}>{item.viewCount}</Text>
          </View>
          {item.salaryMin && (
            <Text style={[{ color: colors.success }, t.captionMedium]}>
              {item.salaryMin}-{item.salaryMax} {item.salaryCurrency}
            </Text>
          )}
        </View>

        <View style={styles.actionRow}>
          <Button
            title={tr('common.edit')}
            onPress={() => router.push({ pathname: '/vacancy/edit/[id]', params: { id: item.id } } as never)}
            variant="outline"
            size="sm"
            fullWidth={false}
            icon={<Pencil size={13} color={colors.textPrimary} strokeWidth={1.8} />}
            style={{ flex: 1, marginRight: 6 }}
          />
          {(isActive || isPaused) && (
            <Button
              title={isActive ? tr('employer.pause') : tr('employer.activate')}
              onPress={async () => {
                try {
                  await updateVacancyStatus.mutateAsync({
                    id: item.id,
                    status: isActive ? 'paused' : 'active',
                  });
                } catch (error: any) {
                  Alert.alert(tr('common.error'), error?.message || tr('common.error'));
                }
              }}
              variant="secondary"
              size="sm"
              fullWidth={false}
              icon={isActive
                ? <Pause size={13} color={colors.primary} strokeWidth={1.8} />
                : <Play size={13} color={colors.primary} strokeWidth={1.8} />
              }
              style={{ flex: 1, marginRight: 6 }}
            />
          )}
          {!isClosed && (
            <Button
              title={tr('employer.closeVacancy')}
              onPress={async () => {
                try {
                  await updateVacancyStatus.mutateAsync({
                    id: item.id,
                    status: 'closed',
                  });
                } catch (error: any) {
                  Alert.alert(tr('common.error'), error?.message || tr('common.error'));
                }
              }}
              variant="ghost"
              size="sm"
              fullWidth={false}
              icon={<X size={13} color={colors.textSecondary} strokeWidth={1.8} />}
              style={{ marginRight: 6 }}
            />
          )}
          <Button
            title=""
            onPress={() => handleDelete(item.id, item.title)}
            variant="ghost"
            size="sm"
            fullWidth={false}
            icon={<Trash2 size={15} color={colors.error} strokeWidth={1.8} />}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <View style={styles.headerRow}>
          <Text style={[{ color: colors.textPrimary }, t.headingLarge]}>
            {tr('employer.vacancies')}
          </Text>
          <Button
            title={tr('employer.createVacancy')}
            onPress={() => router.push('/vacancy/create')}
            variant="primary"
            size="sm"
            fullWidth={false}
            icon={<Plus size={14} color="#FFF" strokeWidth={2} />}
          />
        </View>
        <View style={[styles.filterRow, { marginTop: 10, gap: 8 }]}>
          {filters.map((f) => (
            <Chip
              key={f.key}
              label={`${f.label} ${f.key === 'all' ? `(${allVacancies.length})` : `(${allVacancies.filter(v => v.status === f.key).length})`}`}
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
          icon={<Briefcase size={48} color={colors.textTertiary} strokeWidth={1.2} />}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      ) : isLoading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <VacancyCardSkeleton key={index} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
          renderItem={renderVacancy}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title={tr('employer.noVacancies')}
              subtitle={tr('employer.noVacanciesDesc')}
              icon={<Briefcase size={48} color={colors.textTertiary} strokeWidth={1.2} />}
              actionTitle={tr('employer.createVacancy')}
              onAction={() => router.push('/vacancy/create')}
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap' },
  vacancyHeader: { flexDirection: 'row', alignItems: 'center' },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 8, borderTopWidth: 1,
  },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
});
