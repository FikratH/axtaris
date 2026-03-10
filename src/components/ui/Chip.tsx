import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const { colors, radius: r } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.base,
        {
          backgroundColor: selected ? colors.chipActive : colors.chip,
          borderRadius: r.full,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? colors.primary : colors.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: selected ? colors.primary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
