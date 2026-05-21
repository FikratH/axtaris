import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useSavedJobIds,
  useToggleSavedJob,
} from '@/hooks/useCandidateVacancyActions';
import { useCandidateVacancies } from '@/hooks/useVacancyQueries';
import { VacancyCard } from '@/components/ui/VacancyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { Bookmark } from 'lucide-react-native';

export default function SavedScreen() {
  const { colors, spacing: s, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const {
    data: savedJobIds = [],
    isLoading: savedJobsLoading,
  } = useSavedJobIds(user?.id);
  const toggleSave = useToggleSavedJob(user?.id);
  const {
    data: vacancies = [],
    isLoading,
    isError,
    refetch,
  } = useCandidateVacancies();
  const savedJobs = vacancies.filter((v) => savedJobIds.includes(v.id));

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={[styles.header, { paddingHorizontal: s.xl }]}>
        <Text style={[{ color: colors.textPrimary, ...t.headingLarge }]}>
          {tr('candidate.saved')}
        </Text>
        <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: s.xs }]}>
          {savedJobs.length} {tr('employer.vacancies').toLowerCase()}
        </Text>
      </View>

      <FlatList
        data={savedJobs}
        contentContainerStyle={{ paddingHorizontal: s.xl, paddingTop: s.lg, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <VacancyCard
            vacancy={item}
            onPress={() => router.push({ pathname: '/vacancy/[id]', params: { id: item.id } })}
            onSave={() => toggleSave.mutate(item.id)}
            saved={savedJobIds.includes(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading || savedJobsLoading ? (
            <View>
              {Array.from({ length: 3 }).map((_, index) => (
                <VacancyCardSkeleton key={index} />
              ))}
            </View>
          ) : isError ? (
            <EmptyState
              title={tr('common.error')}
              subtitle={tr('common.retry')}
              icon={<Bookmark size={48} color={colors.textTertiary} strokeWidth={1.2} />}
              actionTitle={tr('common.retry')}
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              title={tr('candidate.noSavedJobs')}
              subtitle={tr('candidate.noSavedJobsDesc')}
              icon={<Bookmark size={48} color={colors.textTertiary} strokeWidth={1.2} />}
              actionTitle={tr('candidate.search')}
              onAction={() => router.push('/(candidate)/search')}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 4,
  },
});
