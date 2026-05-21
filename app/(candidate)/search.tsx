import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
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
import { SearchBar } from '@/components/ui/SearchBar';
import { VacancyCard } from '@/components/ui/VacancyCard';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { WorkType } from '@/types/models';
import { Search as SearchIcon, SlidersHorizontal, SearchX } from 'lucide-react-native';

const cities = ['Bakı', 'Gəncə', 'Sumqayıt', 'Mingəçevir', 'Lənkəran'];

export default function SearchScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const { data: savedJobIds = [] } = useSavedJobIds(user?.id);
  const toggleSave = useToggleSavedJob(user?.id);
  const {
    data: allVacancies = [],
    isLoading,
    isError,
    refetch,
  } = useCandidateVacancies();
  const [query, setQuery] = useState('');
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<WorkType[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const workTypes: { key: WorkType; label: string }[] = [
    { key: 'full_time', label: tr('candidate.fullTime') },
    { key: 'part_time', label: tr('candidate.partTime') },
    { key: 'remote', label: tr('candidate.remote') },
    { key: 'hybrid', label: tr('candidate.hybrid') },
    { key: 'onsite', label: tr('candidate.onsite') },
    { key: 'internship', label: tr('candidate.internship') },
  ];

  const filteredVacancies = useMemo(() => {
    let results = [...allVacancies];
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.company?.name?.toLowerCase().includes(q) ||
          v.skills.some((sk) => sk.toLowerCase().includes(q))
      );
    }
    if (selectedWorkTypes.length > 0) {
      results = results.filter((v) => selectedWorkTypes.includes(v.workType));
    }
    if (selectedCity) {
      results = results.filter((v) => v.city === selectedCity);
    }
    return results;
  }, [query, selectedWorkTypes, selectedCity, allVacancies]);

  const toggleWorkType = (wt: WorkType) => {
    setSelectedWorkTypes((prev) =>
      prev.includes(wt) ? prev.filter((x) => x !== wt) : [...prev, wt]
    );
  };

  const activeFilterCount =
    selectedWorkTypes.length + (selectedCity ? 1 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={[styles.searchSection, { paddingHorizontal: s.xl }]}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={tr('candidate.searchPlaceholder')}
          searchIcon={<SearchIcon size={18} color={colors.textTertiary} strokeWidth={1.8} />}
          filterIcon={
            <View>
              <SlidersHorizontal size={18} color={activeFilterCount > 0 ? colors.primary : colors.textTertiary} strokeWidth={1.8} />
              {activeFilterCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </View>
          }
          onFilterPress={() => setShowFilters(true)}
        />

        {(selectedWorkTypes.length > 0 || selectedCity) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: s.sm }}
            contentContainerStyle={{ gap: 6 }}
          >
            {selectedWorkTypes.map((wt) => (
              <Chip
                key={wt}
                label={workTypes.find((x) => x.key === wt)?.label || wt}
                selected
                onPress={() => toggleWorkType(wt)}
              />
            ))}
            {selectedCity && (
              <Chip label={selectedCity} selected onPress={() => setSelectedCity(null)} />
            )}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={isLoading ? [] : filteredVacancies}
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
          isLoading ? (
            <View>
              {Array.from({ length: 3 }).map((_, index) => (
                <VacancyCardSkeleton key={index} />
              ))}
            </View>
          ) : isError ? (
            <EmptyState
              title={tr('common.error')}
              subtitle={tr('common.retry')}
              icon={<SearchX size={48} color={colors.textTertiary} strokeWidth={1.2} />}
              actionTitle={tr('common.retry')}
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              title={tr('common.noResults')}
              subtitle={tr('candidate.searchPlaceholder')}
              icon={<SearchX size={48} color={colors.textTertiary} strokeWidth={1.2} />}
            />
          )
        }
        ListHeaderComponent={
          !isLoading ? (
            <Text style={[{ color: colors.textSecondary, ...t.caption, marginBottom: s.md }]}>
              {filteredVacancies.length} {tr('employer.vacancies').toLowerCase()}
            </Text>
          ) : null
        }
      />

      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.filterModal, { backgroundColor: colors.background, paddingTop: s['2xl'] }]}>
          <View style={[styles.filterHeader, { paddingHorizontal: s.xl }]}>
            <Text style={[{ color: colors.textPrimary, ...t.headingMedium }]}>
              {tr('candidate.filters')}
            </Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={[{ color: colors.primary, ...t.labelMedium }]}>{tr('common.done')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: s.xl }}>
            <Text style={[{ color: colors.textPrimary, ...t.labelMedium, marginBottom: s.md }]}>
              {tr('candidate.jobType')}
            </Text>
            <View style={styles.chipGrid}>
              {workTypes.map((wt) => (
                <Chip
                  key={wt.key}
                  label={wt.label}
                  selected={selectedWorkTypes.includes(wt.key)}
                  onPress={() => toggleWorkType(wt.key)}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </View>

            <Text style={[{ color: colors.textPrimary, ...t.labelMedium, marginTop: s['2xl'], marginBottom: s.md }]}>
              {tr('candidate.city')}
            </Text>
            <View style={styles.chipGrid}>
              {cities.map((city) => (
                <Chip
                  key={city}
                  label={city}
                  selected={selectedCity === city}
                  onPress={() => setSelectedCity(selectedCity === city ? null : city)}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </View>

            <View style={{ marginTop: s['3xl'], gap: 12 }}>
              <Button title={tr('common.apply')} onPress={() => setShowFilters(false)} size="lg" />
              <Button
                title={tr('common.reset')}
                onPress={() => {
                  setSelectedWorkTypes([]);
                  setSelectedCity(null);
                }}
                variant="ghost"
                size="md"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {},
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterModal: {
    flex: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
