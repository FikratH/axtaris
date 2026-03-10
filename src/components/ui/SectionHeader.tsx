import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface SectionHeaderProps {
  title: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionTitle, onAction }: SectionHeaderProps) {
  const { colors, typography: t, spacing: s } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: s.md, paddingHorizontal: s.xl }]}>
      <Text style={[styles.title, { color: colors.textPrimary, ...t.headingSmall }]}>{title}</Text>
      {actionTitle && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.action, { color: colors.primary, ...t.labelSmall }]}>{actionTitle}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {},
  action: {},
});
