import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';

interface ProfileCompletionCardProps {
  percentage: number;
  onPress?: () => void;
  title: string;
  subtitle: string;
}

const RING_SIZE = 56;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function ProfileCompletionCard({ percentage, onPress, title, subtitle }: ProfileCompletionCardProps) {
  const { colors, radius: r, spacing: s, typography: t } = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const dashOffset = RING_CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.primaryLight,
          borderRadius: r.xl,
          padding: s.lg,
          borderWidth: 1,
          borderColor: colors.primary + '20',
        },
      ]}
    >
      <View style={styles.textContainer}>
        <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{title}</Text>
        <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: 4 }]}>{subtitle}</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressRing}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={colors.border}
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={colors.primary}
              strokeWidth={RING_STROKE}
              fill="none"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <Text style={[styles.progressText, { color: colors.primary, ...t.labelSmall }]}>
            {clamped}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  progressContainer: {
    marginLeft: 16,
  },
  progressRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    textAlign: 'center',
  },
});
