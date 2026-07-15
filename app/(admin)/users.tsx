import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAdminUsers, useSetUserActive, useUpdateUserRole } from '@/hooks/useAdminQueries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { AdminUserSummary, UserRole } from '@/types/models';
import { Search as SearchIcon } from 'lucide-react-native';

const roleActionLabel: Record<UserRole, string> = {
  admin: 'admin.makeAdmin',
  candidate: 'admin.makeCandidate',
  employer: 'admin.makeEmployer',
};

const allRoles: UserRole[] = ['candidate', 'employer', 'admin'];

export default function AdminUsersScreen() {
  const { colors, spacing: s, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading, isError, refetch } = useAdminUsers(search);
  const updateRole = useUpdateUserRole();
  const setActive = useSetUserActive();

  const onError = (e: unknown) =>
    Alert.alert(tr('common.error'), e instanceof Error ? e.message : tr('common.error'));

  const renderUser = ({ item }: { item: AdminUserSummary }) => (
    <Card padding="md" style={{ marginBottom: 10 }}>
      <View style={styles.row}>
        <Avatar uri={item.avatarUrl} name={item.fullName} size={44} />
        <View style={{ flex: 1, marginLeft: s.md }}>
          <Text style={[{ color: colors.textPrimary }, t.labelMedium]} numberOfLines={1}>{item.fullName}</Text>
          <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]} numberOfLines={1}>{item.email}</Text>
        </View>
        <View style={styles.badges}>
          <Badge label={item.role} variant="info" />
          <Badge
            label={item.isActive ? tr('admin.active') : tr('admin.inactive')}
            variant={item.isActive ? 'success' : 'error'}
          />
        </View>
      </View>
      <View style={styles.actions}>
        {allRoles
          .filter((role) => role !== item.role)
          .map((role) => (
            <View key={role} style={{ flex: 1 }}>
              <Button
                title={tr(roleActionLabel[role])}
                onPress={() => updateRole.mutate({ userId: item.id, role }, { onError })}
                variant="outline"
                size="sm"
              />
            </View>
          ))}
      </View>
      <View style={{ marginTop: 8 }}>
        <Button
          title={item.isActive ? tr('admin.deactivate') : tr('admin.activate')}
          onPress={() => setActive.mutate({ userId: item.id, isActive: !item.isActive }, { onError })}
          variant={item.isActive ? 'ghost' : 'secondary'}
          size="sm"
        />
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={{ paddingHorizontal: s.xl }}>
        <Text style={[{ color: colors.textPrimary }, t.headingLarge]}>{tr('admin.users')}</Text>
        <View style={{ marginTop: s.md }}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={tr('admin.searchUsers')}
            searchIcon={<SearchIcon size={18} color={colors.textTertiary} strokeWidth={1.8} />}
          />
        </View>
      </View>
      <FlatList
        data={isLoading ? [] : users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ paddingHorizontal: s.xl, paddingTop: s.lg, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View>{Array.from({ length: 5 }).map((_, i) => <VacancyCardSkeleton key={i} />)}</View>
          ) : isError ? (
            <EmptyState title={tr('common.error')} subtitle={tr('common.retry')} actionTitle={tr('common.retry')} onAction={() => refetch()} />
          ) : (
            <EmptyState title={tr('common.noResults')} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  badges: { alignItems: 'flex-end', gap: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
