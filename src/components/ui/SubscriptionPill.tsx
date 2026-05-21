import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Crown, Sparkles, Zap } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SubscriptionAudience, SubscriptionPlanCode } from '@/types/models';
import { getSubscriptionPlanName } from '@/utils/subscriptionPresentation';

interface SubscriptionPillProps {
  planCode?: SubscriptionPlanCode;
  audience?: SubscriptionAudience;
  style?: ViewStyle;
}

const iconMap: Record<SubscriptionPlanCode, typeof Sparkles> = {
  free: Sparkles,
  pro: Zap,
  premium: Crown,
};

export function SubscriptionPill({
  planCode = 'free',
  audience = 'candidate',
  style,
}: SubscriptionPillProps) {
  const { colors, radius: r } = useTheme();
  const { t: tr } = useTranslation();

  const Icon = iconMap[planCode];

  const palette = {
    free: {
      background: colors.surfaceSecondary,
      text: colors.textSecondary,
    },
    pro: {
      background: '#0EA5E9',
      text: '#FFFFFF',
    },
    premium: {
      background: '#F59E0B',
      text: '#111827',
    },
  }[planCode];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.background,
          borderRadius: r.full,
        },
        style,
      ]}
    >
      <Icon size={12} color={palette.text} strokeWidth={2} />
      <Text style={[styles.label, { color: palette.text }]}>
        {getSubscriptionPlanName(tr, planCode, audience)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
