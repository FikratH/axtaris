import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Target } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { matchTier } from '@/utils/jobMatch';

interface MatchBadgeProps {
  score: number;
  style?: ViewStyle;
  minScore?: number;
}

export function MatchBadge({ score, style, minScore = 40 }: MatchBadgeProps) {
  const { colors } = useTheme();
  const { t: tr } = useTranslation();

  if (score < minScore) return null;

  const tier = matchTier(score);
  const color =
    tier === 'strong' ? colors.success : tier === 'good' ? colors.primary : colors.accent;
  const background =
    tier === 'strong'
      ? colors.successLight
      : tier === 'good'
      ? colors.primaryLight
      : colors.accentLight;

  return (
    <View style={[styles.container, { backgroundColor: background }, style]}>
      <Target size={11} color={color} strokeWidth={2} />
      <Text style={[styles.text, { color }]}>{tr('match.badge', { score })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
