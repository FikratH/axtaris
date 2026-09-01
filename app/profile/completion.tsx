import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { springs, useMotionEnabled } from '@/theme/motion';
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { useCandidateProfile } from '@/hooks/useCandidateVacancyActions';
import { getProfileCompletionItems } from '@/utils/profileCompletion';
import { safeBack } from '@/utils/navigation';
import { Check, ChevronLeft, ChevronRight, CheckCircle2, Target } from 'lucide-react-native';

export default function ProfileCompletionScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((st) => st.user);
  const { data: profile, isLoading, isError, refetch } = useCandidateProfile(user?.id);

  const items = useMemo(() => (profile ? getProfileCompletionItems(profile) : []), [profile]);
  const doneCount = items.filter((item) => item.done).length;
  const total = items.length || 1;
  const percentage = Math.round((doneCount / total) * 100);
  const remaining = items.filter((item) => !item.done);
  const completed = items.filter((item) => item.done);
  const isComplete = remaining.length === 0 && !!profile;

  const motionEnabled = useMotionEnabled();
  const progress = useSharedValue(motionEnabled ? 0 : percentage);
  const previousPercentage = useRef<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!profile) return;
    progress.value = motionEnabled ? withSpring(percentage, springs.gentle) : percentage;
    // Celebrate only the moment 100% is REACHED, not every visit at 100%.
    if (previousPercentage.current !== null && previousPercentage.current < 100 && percentage === 100) {
      setShowCelebration(true);
    }
    previousPercentage.current = percentage;
  }, [percentage, profile, motionEnabled, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));
  const percentTextProps = useAnimatedProps(
    () => ({ text: `${Math.round(progress.value)}%` }) as { text: string }
  );

  if (!user) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <EmptyState
          title={tr('guest.title')}
          subtitle={tr('guest.subtitle')}
          actionTitle={tr('auth.signIn')}
          onAction={() => router.push('/auth/sign-in')}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.textSecondary, marginTop: 12 }, t.bodyMedium]}>{tr('common.loading')}</Text>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <EmptyState
          title={tr('common.error')}
          subtitle={tr('common.retry')}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const renderRow = (labelKey: string, hintKey: string, done: boolean, route: string, key: string) => (
    <TouchableOpacity
      key={key}
      activeOpacity={done ? 1 : 0.7}
      disabled={done}
      onPress={() => router.push(route as never)}
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: done ? colors.divider : colors.cardBorder,
          borderRadius: r.lg,
        },
      ]}
    >
      <View
        style={[
          styles.check,
          {
            backgroundColor: done ? colors.success : 'transparent',
            borderColor: done ? colors.success : colors.border,
            borderRadius: r.full,
          },
        ]}
      >
        {done ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <View style={{ flex: 1, marginLeft: s.md }}>
        <Text
          style={[
            { color: done ? colors.textTertiary : colors.textPrimary },
            t.labelMedium,
            done ? styles.doneText : null,
          ]}
        >
          {tr(labelKey)}
        </Text>
        {!done ? (
          <Text style={[{ color: colors.textTertiary, marginTop: 2 }, t.caption]}>{tr(hintKey)}</Text>
        ) : null}
      </View>
      {!done ? <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} /> : null}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 12, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => safeBack(router, '/(candidate)/profile')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('candidate.completion.title')}</Text>
      </View>

      {/* Hero progress card */}
      <Card padding="lg" style={{ marginBottom: s.xl }}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <AnimatedPercentText
              style={[{ color: colors.primary, padding: 0 }, t.displaySmall]}
              animatedProps={percentTextProps}
              editable={false}
              defaultValue={`${percentage}%`}
            />
            <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>
              {tr('candidate.completion.progress', { done: doneCount, total })}
            </Text>
          </View>
          <View style={[styles.heroIcon, { backgroundColor: isDark ? 'rgba(91,127,214,0.16)' : '#EEF2FF', borderRadius: r.lg }]}>
            {isComplete ? (
              <CheckCircle2 size={26} color={colors.success} strokeWidth={2} />
            ) : (
              <Target size={24} color={colors.primary} strokeWidth={2} />
            )}
          </View>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceSecondary, borderRadius: r.full }]}>
          <Animated.View
            style={[
              styles.fill,
              { backgroundColor: isComplete ? colors.success : colors.primary, borderRadius: r.full },
              fillStyle,
            ]}
          />
        </View>
        <Text style={[{ color: colors.textTertiary, marginTop: s.md }, t.caption]}>
          {isComplete ? tr('candidate.completion.completeBody') : tr('candidate.completion.subtitle')}
        </Text>
      </Card>

      {remaining.length > 0 ? (
        <>
          <Text style={[{ color: colors.textPrimary, marginBottom: s.sm }, t.labelMedium]}>
            {tr('candidate.completion.remainingSection', { count: remaining.length })}
          </Text>
          <View style={{ gap: 10, marginBottom: s.xl }}>
            {remaining.map((item) => renderRow(item.labelKey, item.hintKey, false, item.route, item.id))}
          </View>
        </>
      ) : null}

      {completed.length > 0 ? (
        <>
          <Text style={[{ color: colors.textSecondary, marginBottom: s.sm }, t.labelMedium]}>
            {tr('candidate.completion.completedSection', { count: completed.length })}
          </Text>
          <View style={{ gap: 10 }}>
            {completed.map((item) => renderRow(item.labelKey, item.hintKey, true, item.route, item.id))}
          </View>
        </>
      ) : null}

      <CelebrationOverlay
        visible={showCelebration}
        title={tr('candidate.completionCelebrationTitle')}
        message={tr('candidate.completionCelebrationBody')}
        primaryLabel={tr('common.done')}
        onPrimary={() => setShowCelebration(false)}
      />
    </ScrollView>
  );
}

// The animated-text trick: drive a non-editable TextInput's `text` from the UI
// thread. Reanimated's types don't model the `text` animated prop, hence the cast.
const AnimatedPercentText = Animated.createAnimatedComponent(TextInput) as unknown as React.ComponentType<
  Record<string, unknown>
>;

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  track: { height: 8, marginTop: 16, overflow: 'hidden' },
  fill: { height: 8 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1 },
  check: { width: 24, height: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  doneText: { textDecorationLine: 'line-through' },
});
