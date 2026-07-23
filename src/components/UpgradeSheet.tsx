import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, Crown, Zap, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Button } from '@/components/ui/Button';
import { getSubscriptionPlanName } from '@/utils/subscriptionPresentation';
import type { SubscriptionAudience, SubscriptionPlanCode } from '@/types/models';

interface UpgradeSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  benefits: string[];
  plan: SubscriptionPlanCode;
  audience: SubscriptionAudience;
  /** Overrides the default checkout navigation when provided. */
  onUpgrade?: () => void;
}

/**
 * Reusable, theme-aware paywall bottom sheet. Surfaces the value of a paid plan
 * at the moment a candidate/employer hits a gated feature or a limit, then routes
 * to `/checkout` (or a caller-supplied action). Web-safe: mirrors the transparent
 * bottom-sheet Modal pattern used by `SelectField`.
 */
export function UpgradeSheet({
  visible,
  onClose,
  title,
  subtitle,
  benefits,
  plan,
  audience,
  onUpgrade,
}: UpgradeSheetProps) {
  const { colors, radius: r, spacing: s, typography: t, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();

  const PlanIcon = plan === 'premium' ? Crown : Zap;
  const accent = plan === 'premium' ? colors.warning : colors.primary;
  const accentTint = plan === 'premium' ? colors.warningLight : colors.primaryLight;
  const planName = getSubscriptionPlanName(tr, plan, audience);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }
    onClose();
    router.push(`/checkout?plan=${plan}&audience=${audience}` as never);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.surfaceOverlay }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: r.xl,
              borderTopRightRadius: r.xl,
              paddingHorizontal: s.xl,
              paddingTop: s.lg,
              paddingBottom: s['2xl'],
            },
          ]}
        >
          <View style={styles.grabberRow}>
            <View style={[styles.grabber, { backgroundColor: colors.divider }]} />
          </View>

          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: accentTint, borderRadius: r.lg }]}>
              <PlanIcon size={24} color={accent} strokeWidth={2} />
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.full }]}
            >
              <X size={18} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Text style={[{ color: colors.textPrimary, marginTop: s.lg }, t.headingMedium]}>{title}</Text>
          {subtitle ? (
            <Text style={[{ color: colors.textSecondary, marginTop: s.xs }, t.bodyMedium]}>{subtitle}</Text>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 260, marginTop: s.lg }}
            contentContainerStyle={{ gap: s.md }}
          >
            {benefits.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <View
                  style={[
                    styles.checkCircle,
                    { backgroundColor: isDark ? 'rgba(52,211,153,0.16)' : colors.successLight, borderRadius: r.full },
                  ]}
                >
                  <Check size={13} color={colors.success} strokeWidth={2.6} />
                </View>
                <Text style={[{ color: colors.textPrimary, marginLeft: s.md, flex: 1 }, t.bodyMedium]}>
                  {benefit}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={{ marginTop: s.xl, gap: s.sm }}>
            <Button
              title={tr('paywall.upgradeTo', { plan: planName })}
              onPress={handleUpgrade}
              size="lg"
              variant="primary"
            />
            <Button title={tr('paywall.maybeLater')} onPress={onClose} size="md" variant="ghost" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '86%' },
  grabberRow: { alignItems: 'center', marginBottom: 4 },
  grabber: { width: 40, height: 4, borderRadius: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  iconBadge: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  checkCircle: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
});
