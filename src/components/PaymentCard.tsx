import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Wifi } from 'lucide-react-native';
import type { SubscriptionPlanCode } from '@/types/models';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CARD_GRADIENTS: Record<SubscriptionPlanCode, [string, string, string]> = {
  free: ['#3A4A63', '#2A3548', '#1E2636'],
  pro: ['#5B7FD6', '#3E5DB0', '#243B7A'],
  premium: ['#C69B45', '#A87B2E', '#6E4E17'],
};

function detectBrand(number: string): 'VISA' | 'MASTERCARD' | 'AMEX' | 'CARD' {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'MASTERCARD';
  if (/^3[47]/.test(n)) return 'AMEX';
  return 'CARD';
}

/** Formats a raw digit string into "#### #### #### ####" groups for display. */
function displayNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').padEnd(16, '•').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

interface PaymentCardProps {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  flipped: boolean;
  plan: SubscriptionPlanCode;
  shakeKey?: number; // bump to trigger an error shake
}

export function PaymentCard({ number, name, expiry, cvv, flipped, plan, shakeKey = 0 }: PaymentCardProps) {
  const flip = useSharedValue(0);
  const shake = useSharedValue(0);
  const brand = detectBrand(number);
  const gradient = CARD_GRADIENTS[plan] ?? CARD_GRADIENTS.pro;

  useEffect(() => {
    flip.value = withTiming(flipped ? 1 : 0, { duration: 480, easing: Easing.inOut(Easing.cubic) });
  }, [flipped]);

  useEffect(() => {
    if (shakeKey > 0) {
      shake.value = withSequence(
        withTiming(-10, { duration: 55 }),
        withTiming(10, { duration: 55 }),
        withTiming(-7, { duration: 55 }),
        withTiming(7, { duration: 55 }),
        withTiming(0, { duration: 55 })
      );
    }
  }, [shakeKey]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${flip.value * 180}deg` }, { translateX: shake.value }],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${flip.value * 180 + 180}deg` }, { translateX: shake.value }],
    opacity: flip.value < 0.5 ? 0 : 1,
  }));

  return (
    <View style={styles.wrap}>
      {/* Front */}
      <Animated.View style={[styles.face, frontStyle]}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.chip} />
            <Wifi size={20} color="rgba(255,255,255,0.85)" strokeWidth={2} style={{ transform: [{ rotate: '90deg' }] }} />
            <View style={{ flex: 1 }} />
            <Text style={styles.brand}>{brand}</Text>
          </View>
          <Text style={styles.number}>{displayNumber(number)}</Text>
          <View style={styles.cardBottomRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>CARD HOLDER</Text>
              <Text style={styles.value} numberOfLines={1}>{name ? name.toUpperCase() : 'YOUR NAME'}</Text>
            </View>
            <View>
              <Text style={styles.label}>EXPIRES</Text>
              <Text style={styles.value}>{expiry || 'MM/YY'}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[styles.face, styles.faceAbsolute, backStyle]}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.magstripe} />
          <View style={styles.cvvRow}>
            <View style={styles.cvvBand}>
              <Text style={styles.cvvValue}>{cvv || '•••'}</Text>
            </View>
          </View>
          <Text style={[styles.brand, { alignSelf: 'flex-end', marginTop: 8 }]}>{brand}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

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
  wrap: { width: '100%', aspectRatio: 1.6, maxWidth: 360, alignSelf: 'center' },
  face: { width: '100%', height: '100%', backfaceVisibility: 'hidden' },
  faceAbsolute: { position: 'absolute', top: 0, left: 0 },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 22,
    justifyContent: 'space-between',
    shadowColor: '#1E2636',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chip: { width: 40, height: 30, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.55)' },
  brand: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 1, fontStyle: 'italic' },
  number: { color: '#FFFFFF', fontSize: 21, letterSpacing: 2, fontWeight: '600' },
  cardBottomRow: { flexDirection: 'row', alignItems: 'flex-end' },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 8, letterSpacing: 1, marginBottom: 3 },
  value: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  magstripe: { height: 40, backgroundColor: 'rgba(0,0,0,0.55)', marginHorizontal: -22, marginTop: 4 },
  cvvRow: { alignItems: 'flex-end', marginTop: 16 },
  cvvBand: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, minWidth: 70, alignItems: 'flex-end' },
  cvvValue: { color: '#1E2636', fontSize: 15, fontWeight: '700', letterSpacing: 2 },
  successWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  confettiCenter: { position: 'absolute', width: 1, height: 1, alignItems: 'center', justifyContent: 'center' },
  confetti: { position: 'absolute', width: 10, height: 10, borderRadius: 2 },
});
