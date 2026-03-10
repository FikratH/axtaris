import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  style?: ViewStyle;
}

export function StatCard({ label, value, icon, trend, style }: StatCardProps) {
  const { colors, radius: r, spacing: s, typography: t } = useTheme();

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
      <Text style={[{ color: colors.textPrimary, ...t.displaySmall }]}>{value}</Text>
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
