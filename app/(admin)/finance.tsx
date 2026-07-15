import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Wallet, TrendingUp, Users, Repeat } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAdminEngagement, useAdminFinance } from '@/hooks/useAdminQueries';
import { getSubscriptionPlanLabel } from '@/utils/subscriptionPresentation';

export default function AdminFinanceScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch, isRefetching } = useAdminFinance();
  const { data: engagement = [] } = useAdminEngagement();

  const money = (value: number, currency: string) => `${value.toLocaleString()} ${currency}`;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <EmptyState title={tr('common.error')} subtitle={tr('common.retry')} actionTitle={tr('common.retry')} onAction={() => refetch()} />
      </View>
    );
  }

  const kpis = [
    { label: tr('admin.mrr'), value: money(data.mrr, data.currency), Icon: Wallet, tint: colors.primary },
    { label: tr('admin.arr'), value: money(data.arr, data.currency), Icon: TrendingUp, tint: colors.success },
    { label: tr('admin.arpu'), value: money(data.arpu, data.currency), Icon: Repeat, tint: colors.accent },
    { label: tr('admin.payingSubscribers'), value: String(data.payingSubscribers), Icon: Users, tint: colors.info },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: s.xl, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[{ color: colors.textPrimary }, t.headingLarge]}>{tr('admin.financeTitle')}</Text>
      <Text style={[{ color: colors.textSecondary, marginTop: 4, marginBottom: s.xl }, t.bodySmall]}>
        {tr('admin.financeSubtitle')}
      </Text>

      <View style={styles.kpiGrid}>
        {kpis.map((k) => (
          <Card key={k.label} padding="md" style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: k.tint + '18' }]}>
              <k.Icon size={18} color={k.tint} strokeWidth={2} />
            </View>
            <Text style={[{ color: colors.textPrimary, marginTop: 10 }, t.headingSmall]}>{k.value}</Text>
            <Text style={[{ color: colors.textTertiary, marginTop: 2 }, t.caption]}>{k.label}</Text>
          </Card>
        ))}
      </View>

      <Text style={[{ color: colors.textPrimary, marginTop: s['2xl'], marginBottom: s.md }, t.headingSmall]}>
        {tr('admin.revenueByPlan')}
      </Text>
      <Card padding="none">
        {data.byPlan.length === 0 ? (
          <Text style={[{ color: colors.textTertiary, padding: s.lg }, t.bodySmall]}>{tr('admin.noRevenue')}</Text>
        ) : (
          data.byPlan.map((p, i) => (
            <View
              key={p.plan}
              style={[
                styles.planRow,
                { paddingHorizontal: s.lg, paddingVertical: s.lg, borderBottomWidth: i < data.byPlan.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.divider },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[{ color: colors.textPrimary }, t.labelMedium]}>{getSubscriptionPlanLabel(tr, p.plan)}</Text>
                <Text style={[{ color: colors.textTertiary, marginTop: 2 }, t.caption]}>
                  {tr('admin.subscribersCount', { count: p.subscribers })}
                </Text>
              </View>
              <Text style={[{ color: colors.primary }, t.labelMedium]}>{money(p.mrr, data.currency)}</Text>
            </View>
          ))
        )}
      </Card>

      <Text style={[{ color: colors.textTertiary, marginTop: s.lg }, t.caption]}>
        {tr('admin.financeNote', { active: data.activeSubscriptions })}
      </Text>

      <Text style={[{ color: colors.textPrimary, marginTop: s['2xl'], marginBottom: s.md }, t.headingSmall]}>
        {tr('admin.engagement')}
      </Text>
      <Card padding="none">
        {engagement.map((e, i) => (
          <View
            key={e.event}
            style={[
              styles.planRow,
              { paddingHorizontal: s.lg, paddingVertical: s.md, borderBottomWidth: i < engagement.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.divider },
            ]}
          >
            <Text style={[{ color: colors.textPrimary, flex: 1 }, t.bodyMedium]}>{tr(`admin.evt.${e.event}`)}</Text>
            <Text style={[{ color: colors.textPrimary }, t.labelMedium]}>{e.count.toLocaleString()}</Text>
          </View>
        ))}
      </Card>
      {(() => {
        const views = engagement.find((e) => e.event === 'vacancy_view')?.count || 0;
        const applies = engagement.find((e) => e.event === 'application_submit')?.count || 0;
        const rate = views > 0 ? Math.round((applies / views) * 100) : 0;
        return (
          <Text style={[{ color: colors.textTertiary, marginTop: s.lg }, t.caption]}>
            {tr('admin.viewToApply')}: {rate}%
          </Text>
        );
      })()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: { width: '47%', flexGrow: 1 },
  kpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  planRow: { flexDirection: 'row', alignItems: 'center' },
});
