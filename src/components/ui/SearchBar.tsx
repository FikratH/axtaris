import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filterIcon?: React.ReactNode;
  searchIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onFilterPress,
  filterIcon,
  searchIcon,
  style,
}: SearchBarProps) {
  const { colors, radius: r, spacing: s, typography: t } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: r.lg,
          paddingHorizontal: s.lg,
        },
        style,
      ]}
    >
      {searchIcon && <View style={styles.searchIcon}>{searchIcon}</View>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, { color: colors.textPrimary, ...t.bodyMedium }]}
        returnKeyType="search"
      />
      {onFilterPress && filterIcon && (
        <TouchableOpacity onPress={onFilterPress} activeOpacity={0.7} style={styles.filterButton}>
          {filterIcon}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 10,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  filterButton: {
    marginLeft: 10,
    padding: 4,
  },
});
