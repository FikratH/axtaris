import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, BadgeCheck, Briefcase, Star } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useTopCompanies } from '@/hooks/useVacancyQueries';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { TopCompany } from '@/types/models';
import { safeBack } from '@/utils/navigation';

export default function CompaniesScreen() {
  const { colors, spacing: s, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: companies = [], isLoading } = useTopCompanies(50);

  const renderItem = ({ item }: { item: TopCompany }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/company/[id]', params: { id: item.id } } as never)}
      style={[styles.row, { borderBottomColor: colors.divider }]}
    >
      <Avatar name={item.name} uri={item.logoUrl} size={48} />
      <View style={{ flex: 1, marginLeft: s.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text numberOfLines={1} style={[{ color: colors.textPrimary }, t.labelMedium]}>{item.name}</Text>
          {item.verificationStatus === 'verified' ? (
            <BadgeCheck size={14} color={colors.primary} strokeWidth={2} style={{ marginLeft: 4 }} />
          ) : null}
        </View>
        {item.industry ? (
          <Text numberOfLines={1} style={[{ color: colors.textTertiary, marginTop: 2 }, t.caption]}>{item.industry}</Text>
        ) : null}
        <View style={styles.metaRow}>
          {item.rating ? (
            <View style={styles.meta}>
              <Star size={11} color={colors.warning} strokeWidth={2} />
              <Text style={[{ color: colors.textSecondary, marginLeft: 3 }, t.caption]}>{item.rating.toFixed(1)}</Text>
            </View>
          ) : null}
          <View style={styles.meta}>
            <Briefcase size={11} color={colors.textTertiary} strokeWidth={2} />
            <Text style={[{ color: colors.textSecondary, marginLeft: 3 }, t.caption]}>
              {tr('candidate.activeJobs', { count: item.activeVacancyCount })}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => safeBack(router, '/(candidate)/home')} style={styles.iconBtn} hitSlop={8}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[{ color: colors.textPrimary, marginLeft: 4 }, t.headingMedium]}>{tr('candidate.topCompanies')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: s.xl, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <EmptyState title={tr('candidate.topCompanies')} subtitle={tr('common.noResults')} />
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 },
  meta: { flexDirection: 'row', alignItems: 'center' },
});
