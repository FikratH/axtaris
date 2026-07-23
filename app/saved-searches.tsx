import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useCandidateEntitlements } from '@/hooks/useEntitlements';
import { useSavedSearches, useDeleteSavedSearch } from '@/hooks/useGrowthQueries';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { safeBack } from '@/utils/navigation';
import { getWorkTypeLabel } from '@/utils/labels';
import { SavedSearch } from '@/types/models';
import { ChevronLeft, Trash2, Search as SearchIcon, Sparkles, Play } from 'lucide-react-native';

export default function SavedSearchesScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((st) => st.user);
  const { entitlements } = useCandidateEntitlements();
  const {
    data: searches = [],
    isLoading,
    isError,
    refetch,
  } = useSavedSearches(user?.id);
  const deleteSearch = useDeleteSavedSearch(user?.id);

  const limit = entitlements.savedSearches; // number | null (null = unlimited)
  const atLimit = limit !== null && searches.length >= limit;

  const runSearch = (search: SavedSearch) => {
    router.push({
      pathname: '/(candidate)/search',
      params: {
        savedQuery: search.filters.query ?? '',
        savedCity: search.filters.city ?? '',
        savedWorkType: search.filters.workType ?? '',
        savedSkills: (search.filters.skills ?? []).join(','),
      },
    } as never);
  };

  const confirmDelete = (search: SavedSearch) => {
    Alert.alert(tr('savedSearch.deleteTitle'), tr('savedSearch.deleteMessage'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteSearch.mutate(search.id, {
            onError: (error) =>
              Alert.alert(
                tr('common.error'),
                error instanceof Error ? error.message : tr('common.error')
              ),
          });
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingHorizontal: s.xl }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => safeBack(router, '/(candidate)/search')}
          style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
        >
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[{ color: colors.textPrimary, ...t.headingMedium, flex: 1, marginLeft: s.md }]}>
          {tr('savedSearch.title')}
        </Text>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[{ color: colors.textPrimary, textAlign: 'center' }, t.headingSmall]}>
          {tr('guest.title')}
        </Text>
        <Text
          style={[
            { color: colors.textSecondary, marginTop: 8, textAlign: 'center', maxWidth: 300 },
            t.bodyMedium,
          ]}
        >
          {tr('guest.subtitle')}
        </Text>
        <View style={{ marginTop: 24, width: '100%', maxWidth: 320, gap: 10 }}>
          <Button title={tr('auth.signIn')} onPress={() => router.push('/auth/sign-in')} size="lg" />
          <Button
            title={tr('auth.createAccount')}
            onPress={() => router.push('/auth/sign-up')}
            variant="outline"
            size="md"
          />
        </View>
      </View>
    );
  }

  const renderUpgradeCta = () => (
    <View style={[styles.ctaCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '33' }]}>
      <View style={styles.ctaRow}>
        <View style={[styles.ctaIcon, { backgroundColor: colors.primary }]}>
          <Sparkles size={16} color="#FFFFFF" strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>
            {tr('savedSearch.upgradeTitle')}
          </Text>
          <Text style={[{ color: colors.textSecondary, marginTop: 4, lineHeight: 18 }, t.bodySmall]}>
            {limit === 0 ? tr('savedSearch.upgradeSubtitleFree') : tr('savedSearch.upgradeSubtitleLimit')}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <Button
          title={tr('savedSearch.upgradeCta')}
          onPress={() => router.push('/checkout?plan=pro&audience=candidate' as never)}
          size="md"
        />
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: SavedSearch }) => {
    const filterBits = [
      item.filters.query,
      item.filters.city,
      item.filters.workType ? getWorkTypeLabel(tr, item.filters.workType) : undefined,
      ...(item.filters.skills ?? []),
    ].filter(Boolean);

    return (
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <TouchableOpacity style={styles.searchPressable} activeOpacity={0.7} onPress={() => runSearch(item)}>
          <View style={[styles.searchIcon, { backgroundColor: colors.primaryLight }]}>
            <SearchIcon size={18} color={colors.primary} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.nameRow}>
              <Text style={[{ color: colors.textPrimary, flexShrink: 1 }, t.labelSmall]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.newMatchCount && item.newMatchCount > 0 ? (
                <Badge label={tr('savedSearch.newMatches', { count: item.newMatchCount })} variant="success" style={{ marginLeft: 8 }} />
              ) : null}
            </View>
            <Text style={[{ color: colors.textTertiary, marginTop: 3 }, t.caption]} numberOfLines={1}>
              {filterBits.length > 0 ? filterBits.join(' · ') : tr('savedSearch.allJobs')}
            </Text>
          </View>
          <Play size={16} color={colors.textTertiary} strokeWidth={1.8} fill={colors.textTertiary} />
        </TouchableOpacity>
        <Pressable
          onPress={() => confirmDelete(item)}
          hitSlop={8}
          style={[styles.deleteBtn, { backgroundColor: colors.error + '12', borderColor: colors.error + '24' }]}
        >
          <Trash2 size={15} color={colors.error} strokeWidth={1.9} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      {renderHeader()}
      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[{ color: colors.textSecondary, marginTop: 12 }, t.bodyMedium]}>
            {tr('common.loading')}
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.stateContainer}>
          <EmptyState
            title={tr('common.error')}
            subtitle={tr('common.retry')}
            actionTitle={tr('common.retry')}
            onAction={() => refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={searches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: s.xl, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={atLimit ? <View style={{ marginBottom: 4 }}>{renderUpgradeCta()}</View> : null}
          ListEmptyComponent={
            <View style={{ marginTop: 24 }}>
              <EmptyState
                title={tr('savedSearch.emptyTitle')}
                subtitle={tr('savedSearch.emptySubtitle')}
                icon={<SearchIcon size={48} color={colors.textTertiary} strokeWidth={1.2} />}
                actionTitle={tr('savedSearch.browseJobs')}
                onAction={() => router.push('/(candidate)/search' as never)}
              />
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  header: { marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  ctaCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  ctaRow: { flexDirection: 'row', alignItems: 'center' },
  ctaIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  searchPressable: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 8 },
  searchIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
