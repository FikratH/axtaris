import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonLoaderProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.skeletonBase,
          opacity,
        },
        style,
      ]}
    />
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

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginBottom: 12,
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
