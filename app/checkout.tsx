import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, Crown, ShieldCheck, Sparkles, Star, Zap } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useGuestGate } from '@/hooks/useGuestGate';
import { Button, Card } from '@/components/ui';
import { subscriptionService } from '@/services/subscriptionService';
import { subscriptionQueryKeys } from '@/hooks/useSubscriptionQueries';
import {
  getSubscriptionPlanHighlights,
  getSubscriptionPlanName,
  getSubscriptionPriceLabel,
} from '@/utils/subscriptionPresentation';
import { safeBack } from '@/utils/navigation';
import { toUserMessage } from '@/utils/errorMessage';
import { SubscriptionAudience, SubscriptionPlanCode } from '@/types/models';

const iconMap: Record<SubscriptionPlanCode, typeof Star> = {
  free: Star,
  pro: Zap,
  premium: Crown,
};

const PLAN_CODES: SubscriptionPlanCode[] = ['free', 'pro', 'premium'];

function coercePlan(value?: string): SubscriptionPlanCode {
  return PLAN_CODES.includes(value as SubscriptionPlanCode) ? (value as SubscriptionPlanCode) : 'pro';
}

function coerceAudience(value?: string): SubscriptionAudience {
  return value === 'employer' ? 'employer' : 'candidate';
}

export default function CheckoutScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { requireAuth } = useGuestGate();

  const params = useLocalSearchParams<{ plan?: string; audience?: string }>();
  const plan = coercePlan(params.plan);
  const audience = coerceAudience(params.audience);

  const [activating, setActivating] = useState(false);

  const planName = getSubscriptionPlanName(tr, plan, audience);
  const priceLabel = getSubscriptionPriceLabel(tr, plan, audience);
  const highlights = getSubscriptionPlanHighlights(tr, plan, audience);
  const PlanIcon = iconMap[plan];
  const accent = plan === 'premium' ? colors.warning : colors.primary;
  const accentTint = plan === 'premium' ? colors.warningLight : colors.primaryLight;

  const invalidateAfterActivation = (userId: string) => {
    if (audience === 'employer') {
      queryClient.invalidateQueries({ queryKey: ['employer-subscription-plan', userId] });
      return;
    }
    queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.candidateSummary(userId) });
    queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
  };

  const handleActivate = async () => {
    if (!requireAuth()) return;
    if (!user?.id || activating) return;

    setActivating(true);
    try {
      await subscriptionService.activatePlan(user.id, plan, audience);
      invalidateAfterActivation(user.id);
      Alert.alert(
        tr('checkout.successTitle'),
        tr('checkout.successMessage', { plan: planName }),
        [{ text: tr('common.ok'), onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert(tr('common.error'), toUserMessage(error, tr));
    } finally {
      setActivating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: s.xl }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => safeBack(router, '/subscription')}
              style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
            >
              <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={[{ color: colors.textPrimary, marginLeft: s.md }, t.headingMedium]}>
              {tr('checkout.title')}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: s.xl, marginTop: s.xl }}>
          <Card padding="lg" variant="elevated">
            <View style={styles.planHeader}>
              <View style={[styles.planIcon, { backgroundColor: accentTint, borderRadius: r.lg }]}>
                <PlanIcon size={24} color={accent} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, marginLeft: s.md }}>
                <Text style={[{ color: colors.textPrimary }, t.headingMedium]}>{planName}</Text>
                <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>{priceLabel}</Text>
              </View>
            </View>

            {highlights.length > 0 ? (
              <>
                <Text style={[{ color: colors.textSecondary, marginTop: s.xl, marginBottom: s.sm }, t.labelSmall]}>
                  {tr('checkout.included')}
                </Text>
                <View style={{ gap: s.md }}>
                  {highlights.map((highlight) => (
                    <View key={highlight} style={styles.benefitRow}>
                      <Check size={16} color={colors.success} strokeWidth={2.4} />
                      <Text style={[{ color: colors.textPrimary, marginLeft: s.sm, flex: 1 }, t.bodySmall]}>
                        {highlight}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </Card>

          <Card padding="lg" style={{ marginTop: s.lg }}>
            <View style={styles.totalRow}>
              <Text style={[{ color: colors.textSecondary }, t.bodyMedium]}>{tr('checkout.dueToday')}</Text>
              <Text style={[{ color: colors.textPrimary }, t.headingSmall]}>{tr('checkout.freeDuringBeta')}</Text>
            </View>
            <View style={[styles.noteRow, { backgroundColor: colors.primaryLight, borderRadius: r.md, marginTop: s.lg }]}>
              <Sparkles size={16} color={colors.primary} strokeWidth={2} style={{ marginTop: 1 }} />
              <Text style={[{ color: colors.textSecondary, marginLeft: s.sm, flex: 1 }, t.caption]}>
                {tr('checkout.paymentComingSoon')}
              </Text>
            </View>
          </Card>

          <View style={styles.secureRow}>
            <ShieldCheck size={14} color={colors.textTertiary} strokeWidth={2} />
            <Text style={[{ color: colors.textTertiary, marginLeft: 6 }, t.caption]}>
              {tr('checkout.secureNote')}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.divider,
            paddingBottom: insets.bottom + 12,
            paddingHorizontal: s.xl,
          },
        ]}
      >
        <Button
          title={tr('checkout.activate')}
          onPress={handleActivate}
          loading={activating}
          disabled={activating}
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  planHeader: { flexDirection: 'row', alignItems: 'center' },
  planIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start' },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 12 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
});
