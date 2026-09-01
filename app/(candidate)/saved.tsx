import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useSavedJobIds,
  useToggleSavedJob,
} from '@/hooks/useCandidateVacancyActions';
import { useSavedVacancies } from '@/hooks/useVacancyQueries';
import { VacancyCard } from '@/components/ui/VacancyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { AnimatedListItem } from '@/components/ui/Animated';
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
    data: savedVacancies = [],
    isLoading,
    isError,
    refetch,
  } = useSavedVacancies(savedJobIds);
  // Fetched by id (any status) so closed/filled saved jobs still appear;
  // filtered by the live id set so an un-save is reflected instantly.
  const savedJobs = savedVacancies.filter((v) => savedJobIds.includes(v.id));

  const handlePress = React.useCallback(
    (id: string) => router.push({ pathname: '/vacancy/[id]', params: { id } }),
    [router]
  );
  const handleSave = React.useCallback((id: string) => toggleSave.mutate(id), [toggleSave]);
  const renderItem = React.useCallback(
    ({ item, index }: { item: (typeof savedJobs)[number]; index: number }) => (
      <AnimatedListItem index={index}>
        <VacancyCard
          vacancy={item}
          onPress={handlePress}
          onSave={handleSave}
          saved={savedJobIds.includes(item.id)}
        />
      </AnimatedListItem>
    ),
    [handlePress, handleSave, savedJobIds]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={[styles.header, { paddingHorizontal: s.xl }]}>
        <Text style={[{ color: colors.textPrimary, ...t.headingLarge }]}>
          {tr('candidate.saved')}
        </Text>
        <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: s.xs }]}>
          {tr('candidate.searchResultsCount', { count: savedJobs.length })}
        </Text>
      </View>

      <FlatList
        data={savedJobs}
        contentContainerStyle={{ paddingHorizontal: s.xl, paddingTop: s.lg, paddingBottom: 24 }}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.primary} />
        }
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
