import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ── Success overlay: animated tick + ring + confetti burst ──────────────────
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
  }, [go]);
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

export function PaymentSuccessOverlay({ visible }: { visible: boolean }) {
  const { colors } = useTheme();
  const draw = useSharedValue(0);
  const ring = useSharedValue(0);
  const pop = useSharedValue(0);
  const palette = [colors.primary, colors.success, colors.warning, '#F26D6D', '#8B5CF6'];

  useEffect(() => {
    if (visible) {
      pop.value = withSequence(withTiming(1.08, { duration: 260, easing: Easing.out(Easing.back(2)) }), withTiming(1, { duration: 160 }));
      ring.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
      draw.value = withDelay(220, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    } else {
      draw.value = 0;
      ring.value = 0;
      pop.value = 0;
    }
  }, [visible]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: RING_LEN * (1 - ring.value) }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: 48 * (1 - draw.value) }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }], opacity: pop.value > 0 ? 1 : 0 }));

  if (!visible) return null;

  return (
    <View style={styles.successWrap} pointerEvents="none">
      <View style={styles.confettiCenter}>
        {CONFETTI.map((c, i) => (
          <ConfettiPiece key={i} x={c.x} y={c.y} delay={c.delay} color={palette[i % palette.length]} go={visible} />
        ))}
      </View>
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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  successWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  confettiCenter: { position: 'absolute', width: 1, height: 1, alignItems: 'center', justifyContent: 'center' },
  confetti: { position: 'absolute', width: 10, height: 10, borderRadius: 2 },
});
