import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, Crown, Star, Users, Zap } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Button, Card, EmptyState } from '@/components/ui';
import {
  useCandidateSubscriptionSummary,
  useSubscriptionFeatureComparison,
  useSubscriptionPlans,
} from '@/hooks/useSubscriptionQueries';
import { useEmployerPlan } from '@/hooks/useEntitlements';
import { SubscriptionAudience, SubscriptionPlanCode } from '@/types/models';
import {
  getSubscriptionCatalogDescription,
  getSubscriptionCatalogTitle,
  getSubscriptionFeatureLabel,
  getSubscriptionFeatureValue,
  getSubscriptionPlanHighlights,
  getSubscriptionPlanLabel,
  getSubscriptionPlanName,
  getSubscriptionPriceLabel,
  getSubscriptionUsageBadgeText,
  getSubscriptionUsageCaption,
  getSubscriptionVisibilityLabel,
} from '@/utils/subscriptionPresentation';
import { safeBack } from '@/utils/navigation';

const iconMap: Record<SubscriptionPlanCode, typeof Star> = {
  free: Star,
  pro: Zap,
  premium: Crown,
};

export default function SubscriptionScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const audience: SubscriptionAudience = user?.role === 'employer' ? 'employer' : 'candidate';
  const isCandidateAudience = audience === 'candidate';
  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch } = useCandidateSubscriptionSummary(
    isCandidateAudience ? user?.id : undefined
  );
  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans(audience);
  const { data: features = [] } = useSubscriptionFeatureComparison(audience);
  const { data: employerPlan } = useEmployerPlan(!isCandidateAudience ? user?.id : undefined);
  const currentPlan = isCandidateAudience ? summary?.subscription.plan : employerPlan ?? 'free';
  const comparisonPlanCodes: SubscriptionPlanCode[] = ['free', 'pro', 'premium'];

  // Both candidate and employer now flow through self-serve checkout (employer is
  // no longer sales-only). Instant activation happens on the checkout screen.
  const handleSelectPlan = (planCode: SubscriptionPlanCode) => {
    router.push(`/checkout?plan=${planCode}&audience=${audience}` as never);
  };

  if ((isCandidateAudience && summaryLoading) || plansLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.textSecondary, marginTop: 12 }, t.bodyMedium]}>{tr('common.loading')}</Text>
      </View>
    );
  }

  if (isCandidateAudience && (summaryError || !summary)) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <EmptyState title={tr('common.error')} subtitle={tr('common.retry')} actionTitle={tr('common.retry')} onAction={() => refetch()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: s.xl }]}> 
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => safeBack(router, user?.role === 'employer' ? '/(employer)/settings' : '/(candidate)/profile')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}> 
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, ...t.headingMedium, marginLeft: s.md }]}>{getSubscriptionCatalogTitle(tr, audience)}</Text>
        </View>

        <View style={[styles.socialProof, { backgroundColor: colors.primaryLight, borderRadius: r.lg, padding: s.lg, marginTop: s.xl }]}>
          <View style={[styles.socialProofIcon, { backgroundColor: colors.surface, borderRadius: r.full }]}>
            <Users size={18} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, marginLeft: s.md }}>
            <Text style={[{ color: colors.textPrimary }, t.labelMedium]}>{tr('paywall.socialProof')}</Text>
            <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.caption]}>{tr('paywall.socialProofSub')}</Text>
          </View>
        </View>

        <Card padding="lg" style={{ marginTop: s.lg }}>
          <Text style={[{ color: colors.textSecondary }, t.bodySmall]}>{tr('subscription.currentPlan')}</Text>
          <View style={[styles.summaryRow, { marginTop: s.sm }]}> 
            <View style={{ flex: 1 }}>
              <Text style={[{ color: colors.textPrimary }, t.headingSmall]}>{getSubscriptionPlanLabel(tr, currentPlan || 'free', audience)}</Text>
              <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.bodySmall]}>{getSubscriptionVisibilityLabel(tr, currentPlan || 'free', audience)}</Text>
            </View>
            {isCandidateAudience && summary ? (
              <View style={[styles.usageBadge, { backgroundColor: isDark ? 'rgba(91,127,214,0.16)' : '#EEF2FF', borderRadius: r.md }]}> 
                <Text style={[{ color: colors.primary }, t.labelSmall]}>
                  {getSubscriptionUsageBadgeText(tr, summary)}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[{ color: colors.textTertiary, marginTop: s.md }, t.caption]}>
            {isCandidateAudience && summary
              ? getSubscriptionUsageCaption(tr, summary)
              : getSubscriptionCatalogDescription(tr, audience)}
          </Text>
        </Card>
      </View>

      <View style={{ paddingHorizontal: s.xl, marginTop: s['2xl'] }}>
        <Text style={[{ color: colors.textPrimary, marginBottom: s.md }, t.headingSmall]}>{tr('subscription.planOptions')}</Text>
        {plans.map((plan) => {
          const Icon = iconMap[plan.code];
          const isActive = currentPlan === plan.code;
          const highlights = getSubscriptionPlanHighlights(tr, plan.code, audience);

          return (
            <Card
              key={plan.code}
              padding="lg"
              variant={plan.isPopular ? 'elevated' : 'default'}
              style={{
                marginBottom: 12,
                borderWidth: isActive || plan.isPopular ? 1.5 : 1,
                borderColor: isActive || plan.isPopular ? colors.primary : colors.cardBorder,
              }}
            >
              <View style={styles.planHeader}>
                <View style={[styles.planIcon, { backgroundColor: plan.code === 'premium' ? colors.warning + '20' : plan.code === 'pro' ? colors.primaryLight : colors.surfaceSecondary, borderRadius: r.lg }]}>
                  <Icon size={22} color={plan.code === 'premium' ? colors.warning : colors.primary} strokeWidth={2} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.planTitleRow}>
                    <Text style={[{ color: colors.textPrimary }, t.headingSmall]}>{getSubscriptionPlanName(tr, plan.code, audience)}</Text>
                    {plan.isPopular ? (
                      <View style={[styles.popularBadge, { backgroundColor: colors.primary, borderRadius: r.full }]}>
                        <Star size={11} color="#FFFFFF" strokeWidth={2.4} fill="#FFFFFF" />
                        <Text style={[{ color: '#FFFFFF', marginLeft: 4 }, t.caption]}>{tr('paywall.mostPopular')}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.bodySmall]}>{getSubscriptionPriceLabel(tr, plan.code, audience)}</Text>
                </View>
              </View>

              <View style={{ marginTop: 14, gap: 10 }}>
                {highlights.map((highlight) => (
                  <View key={`${plan.code}-${highlight}`} style={styles.featureRow}>
                    <Check size={16} color={colors.success} strokeWidth={2.2} />
                    <Text style={[{ color: colors.textPrimary, marginLeft: 8, flex: 1 }, t.bodySmall]}>{highlight}</Text>
                  </View>
                ))}
              </View>

              <View style={{ marginTop: 16 }}>
                <Button
                  title={isActive ? tr('subscription.currentPlanCta') : tr('subscription.choosePlan', { plan: getSubscriptionPlanName(tr, plan.code, audience) })}
                  onPress={() => handleSelectPlan(plan.code)}
                  disabled={isActive}
                  variant={isActive ? 'secondary' : plan.isPopular || plan.code === 'premium' ? 'primary' : 'outline'}
                  size="md"
                />
              </View>
            </Card>
          );
        })}
      </View>

      <View style={{ paddingHorizontal: s.xl, marginTop: s['2xl'] }}>
        <Text style={[{ color: colors.textPrimary, marginBottom: s.md }, t.headingSmall]}>{tr('subscription.comparison')}</Text>
        <Card padding="none" style={{ overflow: 'hidden' }}>
          <View style={[styles.tableHeader, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.divider }]}> 
            <Text style={[styles.tableFeatureCell, { color: colors.textSecondary }, t.labelSmall]}>{tr('subscription.feature')}</Text>
            {comparisonPlanCodes.map((planCode) => (
              <Text
                key={`comparison-header-${planCode}`}
                style={[styles.tablePlanCell, { color: colors.textSecondary, textAlign: 'center' }, t.labelSmall]}
              >
                {getSubscriptionPlanName(tr, planCode, audience)}
              </Text>
            ))}
          </View>
          {features.map((row, index) => (
            <View key={row.id} style={[styles.tableRow, { borderBottomWidth: index < features.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.divider }]}> 
              <Text style={[styles.tableFeatureCell, { color: colors.textPrimary }, t.bodySmall]}>{getSubscriptionFeatureLabel(tr, row.id, audience)}</Text>
              {comparisonPlanCodes.map((planCode) => (
                <Text
                  key={`${row.id}-${planCode}`}
                  style={[styles.tablePlanCell, { color: colors.textSecondary, textAlign: 'center' }, t.caption]}
                >
                  {getSubscriptionFeatureValue(tr, row.id, planCode, audience)}
                </Text>
              ))}
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  header: {},
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  usageBadge: { paddingHorizontal: 12, paddingVertical: 10 },
  socialProof: { flexDirection: 'row', alignItems: 'center' },
  socialProofIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  planHeader: { flexDirection: 'row', alignItems: 'center' },
  planIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center' },
  popularBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 14 },
  tableFeatureCell: { flex: 1.5, paddingRight: 12 },
  tablePlanCell: { flex: 1 },
});
