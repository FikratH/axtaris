import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Alert } from '@/utils/dialog';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, ShieldCheck, Lock, Wand2 } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useGuestGate } from '@/hooks/useGuestGate';
import { Button } from '@/components/ui';
import { PaymentCard, PaymentSuccessOverlay } from '@/components/PaymentCard';
import { subscriptionService } from '@/services/subscriptionService';
import { subscriptionQueryKeys, useSubscriptionPlans } from '@/hooks/useSubscriptionQueries';
import { getSubscriptionPlanName } from '@/utils/subscriptionPresentation';
import { safeBack } from '@/utils/navigation';
import { toUserMessage } from '@/utils/errorMessage';
import { SubscriptionAudience, SubscriptionPlanCode } from '@/types/models';

const PLAN_CODES: SubscriptionPlanCode[] = ['free', 'pro', 'premium'];
const coercePlan = (v?: string): SubscriptionPlanCode =>
  PLAN_CODES.includes(v as SubscriptionPlanCode) ? (v as SubscriptionPlanCode) : 'pro';
const coerceAudience = (v?: string): SubscriptionAudience => (v === 'employer' ? 'employer' : 'candidate');

const onlyDigits = (v: string) => v.replace(/\D/g, '');
const formatNumber = (v: string) => onlyDigits(v).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

function luhnValid(num: string): boolean {
  const d = onlyDigits(num);
  if (d.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function expiryValid(v: string): boolean {
  const d = onlyDigits(v);
  if (d.length !== 4) return false;
  const mm = parseInt(d.slice(0, 2), 10);
  return mm >= 1 && mm <= 12;
}

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

  const { data: plans = [] } = useSubscriptionPlans(audience);
  const amount = plans.find((p) => p.code === plan)?.monthlyPriceAzn ?? 0;

  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cvvFocused, setCvvFocused] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
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

  const fillDemo = () => {
    setNumber('4242 4242 4242 4242');
    setExpiry('12/34');
    setCvv('123');
    setName(user?.fullName || 'Test User');
    setErrors({});
  };

  const validate = (): boolean => {
    const next: Record<string, boolean> = {};
    if (!luhnValid(number)) next.number = true;
    if (!expiryValid(expiry)) next.expiry = true;
    if (onlyDigits(cvv).length < 3) next.cvv = true;
    if (!name.trim()) next.name = true;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const runSimulation = async () => {
    setStep('processing');
    await new Promise((resolve) => {
      timers.current.push(setTimeout(resolve, 1700));
    });
    try {
      if (!user?.id) throw new Error('User not found');
      await subscriptionService.activatePlan(user.id, plan, audience);
      invalidateAfterActivation(user.id);
      haptic('success');
      setStep('success');
      timers.current.push(setTimeout(() => router.back(), 1800));
    } catch (error) {
      setStep('form');
      Alert.alert(tr('common.error'), toUserMessage(error, tr));
    }
  };

  const handlePay = () => {
    if (!requireAuth()) return;
    if (step !== 'form') return;
    if (!validate()) {
      setShakeKey((k) => k + 1);
      haptic('error');
      return;
    }
    void runSimulation();
  };

  const inputStyle = (field: string) => [
    styles.input,
    {
      backgroundColor: colors.inputBackground,
      borderColor: errors[field] ? colors.error : colors.inputBorder,
      color: colors.textPrimary,
      borderRadius: r.md,
    },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 130, paddingHorizontal: 20, paddingTop: insets.top + 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            <PaymentCard number={number} name={name} expiry={expiry} cvv={cvv} flipped={cvvFocused} plan={plan} shakeKey={shakeKey} />
          </Animated.View>

          {/* Order summary */}
          <Animated.View entering={FadeIn.delay(120).duration(400)}>
            <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: r.lg, marginTop: s.xl }]}>
              <Text style={[{ color: colors.textSecondary }, t.bodyMedium]}>{planName}</Text>
              <Text style={[{ color: colors.textPrimary }, t.headingSmall]}>{amount} AZN</Text>
            </View>
          </Animated.View>

          {/* Card form */}
          <Animated.View entering={FadeIn.delay(180).duration(400)} style={{ marginTop: s.xl }}>
            <View style={styles.labelRow}>
              <Text style={[{ color: colors.textPrimary }, t.labelMedium]}>{tr('checkout.paymentDetails')}</Text>
              <TouchableOpacity onPress={fillDemo} style={styles.demoBtn} activeOpacity={0.7}>
                <Wand2 size={13} color={colors.primary} strokeWidth={2} />
                <Text style={[{ color: colors.primary, marginLeft: 4 }, t.caption]}>{tr('checkout.fillDemo')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }, t.caption]}>{tr('checkout.cardNumber')}</Text>
            <TextInput
              style={inputStyle('number')}
              value={number}
              onChangeText={(v) => setNumber(formatNumber(v))}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={19}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }, t.caption]}>{tr('checkout.expiry')}</Text>
                <TextInput
                  style={inputStyle('expiry')}
                  value={expiry}
                  onChangeText={(v) => setExpiry(formatExpiry(v))}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }, t.caption]}>{tr('checkout.cvv')}</Text>
                <TextInput
                  style={inputStyle('cvv')}
                  value={cvv}
                  onChangeText={(v) => setCvv(onlyDigits(v).slice(0, 4))}
                  onFocus={() => setCvvFocused(true)}
                  onBlur={() => setCvvFocused(false)}
                  placeholder="123"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }, t.caption]}>{tr('checkout.cardHolder')}</Text>
            <TextInput
              style={inputStyle('name')}
              value={name}
              onChangeText={setName}
              placeholder={tr('checkout.cardHolderPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
            />

            <View style={[styles.simNote, { backgroundColor: colors.primaryLight, borderRadius: r.md }]}>
              <Lock size={13} color={colors.primary} strokeWidth={2} />
              <Text style={[{ color: colors.textSecondary, marginLeft: 8, flex: 1 }, t.caption]}>{tr('checkout.simulatedNote')}</Text>
            </View>

            <View style={styles.secureRow}>
              <ShieldCheck size={13} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[{ color: colors.textTertiary, marginLeft: 6 }, t.caption]}>{tr('checkout.secureNote')}</Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Sticky pay button */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingBottom: insets.bottom + 12 }]}>
          <Button
            title={tr('checkout.pay', { price: `${amount} AZN` })}
            onPress={handlePay}
            disabled={step !== 'form'}
            size="lg"
            icon={<Lock size={16} color="#FFFFFF" strokeWidth={2.2} />}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  demoBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8 },
  fieldLabel: { marginBottom: 6, marginTop: 12 },
  input: { height: 50, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 16, letterSpacing: 0.5 },
  row: { flexDirection: 'row' },
  simNote: { flexDirection: 'row', alignItems: 'center', padding: 12, marginTop: 20 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 12, paddingHorizontal: 20, borderTopWidth: 0.5 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
});
