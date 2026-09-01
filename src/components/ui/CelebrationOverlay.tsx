import React, { useEffect } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeContext';
import { springs, useMotionEnabled } from '@/theme/motion';
import { Button } from './Button';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── The AxtarIS celebration voice ────────────────────────────
// One overlay for the moments that deserve applause: application sent,
// profile completed, subscription activated, vacancy published. Tick draws
// inside a sweeping ring while confetti bursts — the pattern users first meet
// on the checkout screen, now the celebration language of the whole app.

const RING_LEN = 2 * Math.PI * 34;
const CONFETTI = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const dist = 90 + (i % 3) * 24;
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, delay: (i % 5) * 30 };
});

function ConfettiPiece({ x, y, delay, color, go }: { x: number; y: number; delay: number; color: string; go: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (go) p.value = withDelay(delay, withTiming(1, { duration: 620, easing: Easing.out(Easing.quad) }));
  }, [go, delay, p, x, y]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.15, 0.8, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: p.value * x },
      { translateY: p.value * y },
      { scale: interpolate(p.value, [0, 0.3, 1], [0, 1, 0.7]) },
      { rotate: `${p.value * 320}deg` },
    ],
  }));
  return <Animated.View style={[styles.confetti, { backgroundColor: color }, style]} />;
}

function TickBurst({ go, motionEnabled }: { go: boolean; motionEnabled: boolean }) {
  const { colors } = useTheme();
  const draw = useSharedValue(motionEnabled ? 0 : 1);
  const ring = useSharedValue(motionEnabled ? 0 : 1);
  const pop = useSharedValue(motionEnabled ? 0 : 1);
  const palette = [colors.primary, colors.success, colors.warning, '#F26D6D', '#8B5CF6'];

  useEffect(() => {
    if (!go || !motionEnabled) return;
    pop.value = withSequence(
      withTiming(1.08, { duration: 260, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 160 })
    );
    ring.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    draw.value = withDelay(220, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [go, motionEnabled, pop, ring, draw]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: RING_LEN * (1 - ring.value) }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: 48 * (1 - draw.value) }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }], opacity: pop.value > 0 ? 1 : 0 }));

  return (
    <View style={styles.burstWrap} pointerEvents="none">
      {motionEnabled ? (
        <View style={styles.confettiCenter}>
          {CONFETTI.map((c, i) => (
            <ConfettiPiece key={i} x={c.x} y={c.y} delay={c.delay} color={palette[i % palette.length]} go={go} />
          ))}
        </View>
      ) : null}
      <Animated.View style={popStyle}>
        <Svg width={88} height={88} viewBox="0 0 88 88">
          <Circle cx={44} cy={44} r={40} fill={colors.success} opacity={0.14} />
          <AnimatedCircle
            cx={44}
            cy={44}
            r={34}
            stroke={colors.success}
            strokeWidth={4}
            fill="none"
            strokeDasharray={RING_LEN}
            strokeLinecap="round"
            animatedProps={ringProps}
            rotation={-90}
            origin="44, 44"
          />
          <AnimatedPath
            d="M30 45 L40 55 L59 34"
            stroke={colors.success}
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={48}
            animatedProps={tickProps}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

export interface CelebrationOverlayProps {
  visible: boolean;
  title: string;
  message?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function CelebrationOverlay({
  visible,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: CelebrationOverlayProps) {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const motionEnabled = useMotionEnabled();
  const cardScale = useSharedValue(motionEnabled ? 0.86 : 1);

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (motionEnabled) {
        cardScale.value = 0.86;
        cardScale.value = withSpring(1, springs.bouncy);
      }
    }
  }, [visible, motionEnabled, cardScale]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onPrimary} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(180)} style={[styles.backdrop, { backgroundColor: 'rgba(10, 22, 40, 0.55)' }]}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderRadius: r.xl, padding: s['2xl'] },
            cardStyle,
          ]}
        >
          <View style={styles.burstArea}>
            <TickBurst go={visible} motionEnabled={motionEnabled} />
          </View>
          <Text style={[{ color: colors.textPrimary, textAlign: 'center', marginTop: s.lg }, t.headingMedium]}>
            {title}
          </Text>
          {message ? (
            <Text style={[{ color: colors.textSecondary, textAlign: 'center', marginTop: s.sm, lineHeight: 21 }, t.bodySmall]}>
              {message}
            </Text>
          ) : null}
          <View style={{ marginTop: s.xl, alignSelf: 'stretch' }}>
            <Button title={primaryLabel} onPress={onPrimary} />
          </View>
          {secondaryLabel && onSecondary ? (
            <View style={{ marginTop: s.sm, alignSelf: 'stretch' }}>
              <Button title={secondaryLabel} onPress={onSecondary} variant="ghost" />
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 400, alignItems: 'center' },
  burstArea: { height: 96, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  burstWrap: { alignItems: 'center', justifyContent: 'center' },
  confettiCenter: { position: 'absolute', width: 1, height: 1, alignItems: 'center', justifyContent: 'center' },
  confetti: { position: 'absolute', width: 10, height: 10, borderRadius: 2 },
});
