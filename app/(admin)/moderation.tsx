import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  useModerationFlags,
  useModerationVacancies,
  useResolveFlag,
  useSetVacancyModeration,
} from '@/hooks/useAdminQueries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { getVacancyStatusPresentation } from '@/utils/labels';

export default function AdminModerationScreen() {
  const { colors, spacing: s, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: vacancies = [], isLoading } = useModerationVacancies();
  const { data: flags = [] } = useModerationFlags();
  const setStatus = useSetVacancyModeration();
  const resolveFlag = useResolveFlag();

  const onError = (e: unknown) =>
    Alert.alert(tr('common.error'), e instanceof Error ? e.message : tr('common.error'));

  const emptyText = (message: string) => (
    <Text style={[{ color: colors.textTertiary, textAlign: 'center', paddingVertical: 24 }, t.bodySmall]}>
      {message}
    </Text>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: s.xl }}>
        <Text style={[{ color: colors.textPrimary }, t.headingLarge]}>{tr('admin.moderation')}</Text>
      </View>

      <View style={{ paddingHorizontal: s.xl, marginTop: s.lg }}>
        <Text style={[{ color: colors.textSecondary, ...t.overline, marginBottom: s.md }]}>{tr('admin.reviewQueue')}</Text>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <VacancyCardSkeleton key={i} />)
        ) : vacancies.length === 0 ? (
          emptyText(tr('admin.noPending'))
        ) : (
          vacancies.map((v) => {
            const p = getVacancyStatusPresentation(tr, v.status);
            return (
              <Card key={v.id} padding="md" style={{ marginBottom: 10 }}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[{ color: colors.textPrimary }, t.labelMedium]} numberOfLines={1}>{v.title}</Text>
                    <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]} numberOfLines={1}>
                      {v.company?.name} · {v.city}
                    </Text>
                  </View>
                  <Badge label={p.label} variant={p.variant} />
                </View>
                <View style={[styles.actions, { marginTop: s.md }]}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title={tr('admin.approve')}
                      onPress={() => setStatus.mutate({ id: v.id, status: 'active' }, { onError })}
                      variant="primary"
                      size="sm"
                      disabled={v.status === 'active' || setStatus.isPending}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title={tr('admin.takedown')}
                      onPress={() => setStatus.mutate({ id: v.id, status: 'rejected' }, { onError })}
                      variant="outline"
                      size="sm"
                      disabled={v.status === 'rejected' || setStatus.isPending}
                    />
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </View>

      <View style={{ paddingHorizontal: s.xl, marginTop: s['2xl'] }}>
        <Text style={[{ color: colors.textSecondary, ...t.overline, marginBottom: s.md }]}>{tr('admin.flagsTitle')}</Text>
        {flags.length === 0
          ? emptyText(tr('admin.noFlags'))
          : flags.map((f) => (
              <Card key={f.id} padding="md" style={{ marginBottom: 10 }}>
                <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{f.entityType}</Text>
                <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.bodySmall]}>{f.reason}</Text>
                <View style={[styles.actions, { marginTop: s.md }]}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title={tr('admin.resolve')}
                      onPress={() => resolveFlag.mutate({ id: f.id, status: 'approved' }, { onError })}
                      variant="primary"
                      size="sm"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title={tr('admin.dismiss')}
                      onPress={() => resolveFlag.mutate({ id: f.id, status: 'rejected' }, { onError })}
                      variant="ghost"
                      size="sm"
                    />
                  </View>
                </View>
              </Card>
            ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 8 },
});
