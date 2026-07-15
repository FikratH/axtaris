import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAdminCompanies, useSetCompanyVerification } from '@/hooks/useAdminQueries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { getVerificationPresentation } from '@/utils/labels';
import { Company } from '@/types/models';

export default function AdminCompaniesScreen() {
  const { colors, spacing: s, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: companies = [], isLoading, isError, refetch } = useAdminCompanies();
  const setVerification = useSetCompanyVerification();

  const onError = (e: unknown) =>
    Alert.alert(tr('common.error'), e instanceof Error ? e.message : tr('common.error'));

  const renderCompany = ({ item }: { item: Company }) => {
    const v = getVerificationPresentation(tr, item.verificationStatus);
    const isVerified = item.verificationStatus === 'verified';
    return (
      <Card padding="md" style={{ marginBottom: 10 }}>
        <View style={styles.row}>
          <Avatar uri={item.logoUrl} name={item.name} size={44} />
          <View style={{ flex: 1, marginLeft: s.md }}>
            <Text style={[{ color: colors.textPrimary }, t.labelMedium]} numberOfLines={1}>{item.name}</Text>
            <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]} numberOfLines={1}>{item.industry}</Text>
          </View>
          <Badge label={v.label} variant={v.variant} />
        </View>
        <View style={styles.actions}>
          {!isVerified && (
            <View style={{ flex: 1 }}>
              <Button
                title={tr('admin.verify')}
                onPress={() => setVerification.mutate({ id: item.id, status: 'verified' }, { onError })}
                variant="primary"
                size="sm"
              />
            </View>
          )}
          {isVerified && (
            <View style={{ flex: 1 }}>
              <Button
                title={tr('admin.unverify')}
                onPress={() => setVerification.mutate({ id: item.id, status: 'not_verified' }, { onError })}
                variant="outline"
                size="sm"
              />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Button
              title={tr('admin.reject')}
              onPress={() => setVerification.mutate({ id: item.id, status: 'rejected' }, { onError })}
              variant="ghost"
              size="sm"
            />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={{ paddingHorizontal: s.xl }}>
        <Text style={[{ color: colors.textPrimary }, t.headingLarge]}>{tr('admin.companies')}</Text>
      </View>
      <FlatList
        data={isLoading ? [] : companies}
        keyExtractor={(item) => item.id}
        renderItem={renderCompany}
        contentContainerStyle={{ paddingHorizontal: s.xl, paddingTop: s.lg, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View>{Array.from({ length: 4 }).map((_, i) => <VacancyCardSkeleton key={i} />)}</View>
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
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
