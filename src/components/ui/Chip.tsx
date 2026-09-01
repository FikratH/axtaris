import React from 'react';
import { Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const { colors, radius: r, typography } = useTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      pressedScale={0.95}
      style={StyleSheet.flatten([
        styles.base,
        {
          backgroundColor: selected ? colors.chipActive : colors.chip,
          borderRadius: r.full,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? colors.primary : colors.border,
        },
        style,
      ])}
    >
      <Text
        style={[
          typography.labelSmall,
          styles.text,
          { color: selected ? colors.primary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
  },
});
