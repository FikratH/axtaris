import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionTitle, onAction }: EmptyStateProps) {
  const { colors, spacing: s, typography: t } = useTheme();

  return (
    <View style={styles.container}>
      {icon && <View style={[styles.iconContainer, { marginBottom: s.xl }]}>{icon}</View>}
      <Text style={[styles.title, { color: colors.textPrimary, ...t.headingSmall }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textTertiary, ...t.bodyMedium, marginTop: s.sm }]}>
          {subtitle}
        </Text>
      )}
      {actionTitle && onAction && (
        <View style={{ marginTop: s['2xl'] }}>
          <Button title={actionTitle} onPress={onAction} variant="primary" size="md" fullWidth={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    opacity: 0.6,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
