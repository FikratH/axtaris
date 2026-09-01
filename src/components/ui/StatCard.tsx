import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { useMotionEnabled } from '@/theme/motion';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  style?: ViewStyle;
}

// Numeric values count up on mount (UI-thread text animation); string values
// and reduced-motion render statically.
const AnimatedStatText = Animated.createAnimatedComponent(TextInput) as unknown as React.ComponentType<
  Record<string, unknown>
>;

function CountUpValue({ value, textStyle }: { value: number; textStyle: unknown }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [value, progress]);

  const animatedProps = useAnimatedProps(
    () => ({ text: `${Math.round(progress.value * value)}` }) as Record<string, unknown>
  );

  return (
    <AnimatedStatText
      style={[textStyle, { padding: 0 }]}
      animatedProps={animatedProps}
      editable={false}
      defaultValue={`${value}`}
    />
  );
}

export function StatCard({ label, value, icon, trend, style }: StatCardProps) {
  const { colors, radius: r, spacing: s, typography: t } = useTheme();
  const motionEnabled = useMotionEnabled();
  const countUp = motionEnabled && typeof value === 'number' && Number.isFinite(value) && value > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          borderRadius: r.lg,
          padding: s.lg,
        },
        style,
      ]}
    >
      {icon && <View style={[styles.iconContainer, { marginBottom: s.sm }]}>{icon}</View>}
      {countUp ? (
        <CountUpValue value={value as number} textStyle={{ color: colors.textPrimary, ...t.displaySmall }} />
      ) : (
        <Text style={[{ color: colors.textPrimary, ...t.displaySmall }]}>{value}</Text>
      )}
      <Text style={[{ color: colors.textSecondary, ...t.caption, marginTop: s.xs }]}>{label}</Text>
      {trend && (
        <View style={[styles.trendRow, { marginTop: s.xs }]}>
          <Text
            style={[
              {
                color: trend.positive ? colors.success : colors.error,
                ...t.captionMedium,
              },
            ]}
          >
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    flex: 1,
  },
  iconContainer: {},
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
