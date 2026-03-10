import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/store/dataStore';
import { VacancyCard } from '@/components/ui/VacancyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bookmark } from 'lucide-react-native';

export default function SavedScreen() {
  const { colors, spacing: s, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const vacancies = useDataStore((s) => s.vacancies);
  const savedJobIds = useDataStore((s) => s.savedJobIds);
  const toggleSave = useDataStore((s) => s.toggleSaveJob);
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
            onSave={() => toggleSave(item.id)}
            saved={savedJobIds.includes(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title={tr('candidate.noSavedJobs')}
            subtitle={tr('candidate.noSavedJobsDesc')}
            icon={<Bookmark size={48} color={colors.textTertiary} strokeWidth={1.2} />}
            actionTitle={tr('candidate.search')}
            onAction={() => router.push('/(candidate)/search')}
          />
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
