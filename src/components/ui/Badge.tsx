import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', size = 'sm', style }: BadgeProps) {
  const { colors, radius: r } = useTheme();

  const bgColors: Record<string, string> = {
    default: colors.chip,
    success: colors.successLight,
    warning: colors.warningLight,
    error: colors.errorLight,
    info: colors.infoLight,
    outline: 'transparent',
  };

  const textColors: Record<string, string> = {
    default: colors.textSecondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    outline: colors.textSecondary,
  };

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bgColors[variant],
          borderRadius: r.full,
          paddingHorizontal: size === 'sm' ? 8 : 12,
          paddingVertical: size === 'sm' ? 3 : 5,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColors[variant],
            fontSize: size === 'sm' ? 11 : 13,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
