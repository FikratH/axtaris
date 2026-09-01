import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';
import { useMotionEnabled } from '@/theme/motion';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Shimmer skeleton: a soft highlight sweeps across the base block. Under
 * reduced motion it falls back to a static two-tone block (state stays
 * legible without the sweep).
 */
export function SkeletonLoader({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonLoaderProps) {
  const { colors } = useTheme();
  const motionEnabled = useMotionEnabled();
  const progress = useSharedValue(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    if (!motionEnabled) return;
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [motionEnabled, progress]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value * 2 - 1) * Math.max(measuredWidth, 60) }],
  }));

  return (
    <View
      onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}
      style={[
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius,
          backgroundColor: colors.skeletonBase,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {motionEnabled && measuredWidth > 0 ? (
        <AnimatedGradient
          colors={['transparent', colors.skeletonHighlight, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, sweepStyle]}
        />
      ) : null}
    </View>
  );
}

export function VacancyCardSkeleton() {
  const { colors, radius: r, spacing: s } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          borderRadius: r.lg,
          padding: s.lg,
        },
      ]}
    >
      <View style={styles.row}>
        <SkeletonLoader width={44} height={44} borderRadius={12} />
        <View style={[styles.col, { marginLeft: s.md }]}>
          <SkeletonLoader width={160} height={16} />
          <SkeletonLoader width={100} height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={[styles.chipRow, { marginTop: s.md }]}>
        <SkeletonLoader width={70} height={26} borderRadius={13} />
        <SkeletonLoader width={80} height={26} borderRadius={13} style={{ marginLeft: 8 }} />
        <SkeletonLoader width={60} height={26} borderRadius={13} style={{ marginLeft: 8 }} />
      </View>
      <SkeletonLoader width="60%" height={14} style={{ marginTop: 12 }} />
    </View>
  );
}

/** Generic list-row skeleton: avatar + two text lines (users, companies, chats). */
export function RowSkeleton() {
  const { colors, radius: r, spacing: s } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          borderRadius: r.lg,
          padding: s.lg,
        },
      ]}
    >
      <View style={styles.row}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={[styles.col, { marginLeft: s.md }]}>
          <SkeletonLoader width={140} height={14} />
          <SkeletonLoader width={190} height={11} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
}

/** Dashboard stat-tile skeleton. */
export function StatSkeleton() {
  const { colors, radius: r, spacing: s } = useTheme();

  return (
    <View
      style={[
        styles.stat,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          borderRadius: r.lg,
          padding: s.lg,
        },
      ]}
    >
      <SkeletonLoader width={44} height={24} />
      <SkeletonLoader width={72} height={11} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginBottom: 12,
  },
  stat: {
    borderWidth: 1,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
  },
});
