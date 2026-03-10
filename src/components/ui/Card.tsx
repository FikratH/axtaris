import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  const { colors, radius: r, spacing: s, elevation: e, isDark } = useTheme();

  const cardStyle: ViewStyle[] = [
    styles.base,
    { borderRadius: r.lg },
  ];

  switch (padding) {
    case 'sm':
      cardStyle.push({ padding: s.md });
      break;
    case 'md':
      cardStyle.push({ padding: s.lg });
      break;
    case 'lg':
      cardStyle.push({ padding: s.xl });
      break;
  }

  switch (variant) {
    case 'default':
      cardStyle.push({
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.cardBorder,
      });
      break;
    case 'elevated':
      cardStyle.push({
        backgroundColor: colors.cardBackground,
        ...(!isDark ? e.md : {}),
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.cardBorder,
      });
      break;
    case 'outlined':
      cardStyle.push({
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.border,
      });
      break;
  }

  if (style) cardStyle.push(style);

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
