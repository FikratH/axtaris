import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Check, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useGuestGate } from '@/hooks/useGuestGate';
import { Button } from '@/components/ui';
import { PaymentSuccessOverlay } from '@/components/PaymentCard';
import { subscriptionService } from '@/services/subscriptionService';
import { subscriptionQueryKeys } from '@/hooks/useSubscriptionQueries';
import { getSubscriptionPlanHighlights, getSubscriptionPlanName } from '@/utils/subscriptionPresentation';
import { safeBack } from '@/utils/navigation';
import { toUserMessage } from '@/utils/errorMessage';
import { Alert } from '@/utils/dialog';
import { SubscriptionAudience, SubscriptionPlanCode } from '@/types/models';

const PLAN_CODES: SubscriptionPlanCode[] = ['free', 'pro', 'premium'];
const coercePlan = (v?: string): SubscriptionPlanCode =>
  PLAN_CODES.includes(v as SubscriptionPlanCode) ? (v as SubscriptionPlanCode) : 'pro';
const coerceAudience = (v?: string): SubscriptionAudience => (v === 'employer' ? 'employer' : 'candidate');

export default function CheckoutScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { requireAuth } = useGuestGate();

  const params = useLocalSearchParams<{ plan?: string; audience?: string }>();
  const plan = coercePlan(params.plan);
  const audience = coerceAudience(params.audience);
  const planName = getSubscriptionPlanName(tr, plan, audience);
  const highlights = getSubscriptionPlanHighlights(tr, plan, audience);

  const [step, setStep] = React.useState<'confirm' | 'processing' | 'success'>('confirm');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const haptic = (type: 'success' | 'error') => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(
      type === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    ).catch(() => undefined);
  };

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
    if (step !== 'confirm') return;
    setStep('processing');
    try {
      if (!user?.id) throw new Error(tr('errors.userNotFound'));
      await subscriptionService.activatePlan(user.id, plan, audience);
      invalidateAfterActivation(user.id);
      haptic('success');
      setStep('success');
      timers.current.push(setTimeout(() => router.back(), 1800));
    } catch (error) {
      setStep('confirm');
      haptic('error');
      Alert.alert(tr('common.error'), toUserMessage(error, tr));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130, paddingHorizontal: 20, paddingTop: insets.top + 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => safeBack(router, '/subscription')}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
          >
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('checkout.title')}</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(420)} style={{ marginTop: s.xl }}>
          <View style={[styles.planBadge, { backgroundColor: colors.primaryLight, borderRadius: r.lg }]}>
            <Sparkles size={22} color={colors.primary} strokeWidth={2} />
          </View>
        </Animated.View>

        {/* Order summary */}
        <Animated.View entering={FadeIn.delay(120).duration(400)}>
          <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: r.lg, marginTop: s.lg }]}>
            <Text style={[{ color: colors.textSecondary }, t.bodyMedium]}>{planName}</Text>
            <Text style={[{ color: colors.textPrimary }, t.headingSmall]}>{tr('checkout.freeDuringBeta')}</Text>
          </View>
        </Animated.View>

        {/* Included benefits */}
        {highlights.length > 0 ? (
          <Animated.View entering={FadeIn.delay(180).duration(400)} style={{ marginTop: s.xl }}>
            <Text style={[{ color: colors.textPrimary, marginBottom: 10 }, t.labelMedium]}>{tr('checkout.included')}</Text>
            {highlights.map((item, index) => (
              <View key={index} style={styles.highlightRow}>
                <View style={[styles.checkDot, { backgroundColor: colors.primaryLight }]}>
                  <Check size={12} color={colors.primary} strokeWidth={2.5} />
                </View>
                <Text style={[{ color: colors.textSecondary, marginLeft: 10, flex: 1 }, t.bodyMedium]}>{item}</Text>
              </View>
            ))}
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeIn.delay(220).duration(400)}>
          <View style={[styles.simNote, { backgroundColor: colors.primaryLight, borderRadius: r.md }]}>
            <ShieldCheck size={13} color={colors.primary} strokeWidth={2} />
            <Text style={[{ color: colors.textSecondary, marginLeft: 8, flex: 1 }, t.caption]}>{tr('checkout.paymentComingSoon')}</Text>
          </View>

          <View style={styles.secureRow}>
            <ShieldCheck size={13} color={colors.textTertiary} strokeWidth={2} />
            <Text style={[{ color: colors.textTertiary, marginLeft: 6 }, t.caption]}>{tr('checkout.secureNote')}</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky activate button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={tr('checkout.activate')}
          onPress={() => void handleActivate()}
          disabled={step !== 'confirm'}
          size="lg"
        />
      </View>

      {/* Processing overlay */}
      {step === 'processing' ? (
        <Animated.View entering={FadeIn.duration(200)} style={[styles.overlay, { backgroundColor: isDark ? 'rgba(10,15,25,0.86)' : 'rgba(245,247,251,0.92)' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[{ color: colors.textPrimary, marginTop: 16 }, t.headingSmall]}>{tr('checkout.processing')}</Text>
        </Animated.View>
      ) : null}

      {/* Success overlay */}
      {step === 'success' ? (
        <Animated.View entering={FadeIn.duration(220)} style={[styles.overlay, { backgroundColor: isDark ? 'rgba(10,15,25,0.92)' : 'rgba(245,247,251,0.96)' }]}>
          <View style={{ height: 120, justifyContent: 'center' }}>
            <PaymentSuccessOverlay visible />
          </View>
          <Text style={[{ color: colors.textPrimary, marginTop: 8 }, t.headingMedium]}>{tr('checkout.successTitle')}</Text>
          <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.bodyMedium]}>{tr('checkout.successSub', { plan: planName })}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  planBadge: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1 },
  highlightRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  simNote: { flexDirection: 'row', alignItems: 'center', padding: 12, marginTop: 24 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 12, paddingHorizontal: 20, borderTopWidth: 0.5 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
});
