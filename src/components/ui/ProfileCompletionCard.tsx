import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface ProfileCompletionCardProps {
  percentage: number;
  onPress?: () => void;
  title: string;
  subtitle: string;
}

export function ProfileCompletionCard({ percentage, onPress, title, subtitle }: ProfileCompletionCardProps) {
  const { colors, radius: r, spacing: s, typography: t } = useTheme();

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
        <View
          style={[
            styles.progressRing,
            {
              borderColor: colors.border,
              borderWidth: 3,
            },
          ]}
        >
          <View
            style={[
              styles.progressRingInner,
              {
                borderColor: colors.primary,
                borderWidth: 3,
                borderLeftColor: 'transparent',
                borderBottomColor: percentage > 50 ? colors.primary : 'transparent',
                transform: [{ rotate: `${(percentage / 100) * 360}deg` }],
              },
            ]}
          />
          <Text style={[styles.progressText, { color: colors.primary, ...t.labelSmall }]}>
            {percentage}%
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingInner: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  progressText: {
    textAlign: 'center',
  },
});
