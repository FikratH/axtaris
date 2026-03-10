import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/store/dataStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Clock } from 'lucide-react-native';

export default function CompanyScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const companies = useDataStore((s) => s.companies);
  const company = companies[0];

  const verificationLabel =
    company.verificationStatus === 'verified'
      ? tr('employer.verified')
      : company.verificationStatus === 'pending'
      ? tr('employer.pending_verification')
      : tr('employer.notVerified');

  const verificationVariant =
    company.verificationStatus === 'verified'
      ? 'success'
      : company.verificationStatus === 'pending'
      ? 'warning'
      : ('error' as const);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: s.xl }]}>
        <Text style={[{ color: colors.textPrimary, ...t.headingLarge }]}>
          {tr('employer.companyProfile')}
        </Text>
      </View>

      <View style={[styles.profileSection, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
        <Card variant="elevated" padding="lg">
          <View style={styles.profileHeader}>
            <Avatar name={company.name} size={72} />
            <View style={[styles.profileInfo, { marginLeft: s.lg }]}>
              <Text style={[{ color: colors.textPrimary, ...t.headingMedium }]}>
                {company.name}
              </Text>
              <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: 2 }]}>
                {company.industry}
              </Text>
              <Badge
                label={verificationLabel}
                variant={verificationVariant}
                style={{ marginTop: s.sm }}
              />
            </View>
          </View>

          <View style={[styles.statsRow, { marginTop: s.lg, paddingTop: s.lg, borderTopWidth: 1, borderTopColor: colors.divider }]}>
            <View style={styles.stat}>
              <Text style={[{ color: colors.primary, ...t.headingSmall }]}>{company.vacancyCount}</Text>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.vacancies')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.stat}>
              <Text style={[{ color: colors.primary, ...t.headingSmall }]}>{company.rating || '-'}</Text>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>Rating</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.stat}>
              <Text style={[{ color: colors.primary, ...t.headingSmall }]}>{company.employeeCount}</Text>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.employeeCount')}</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={[{ paddingHorizontal: s.xl, marginTop: s.lg }]}>
        <Button title={tr('employer.editCompany')} onPress={() => router.push('/company/edit')} variant="outline" size="md" />
      </View>

      <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
        <Text style={[{ color: colors.textPrimary, ...t.labelMedium, marginBottom: s.sm }]}>
          {tr('employer.about')}
        </Text>
        <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, lineHeight: 22 }]}>
          {company.description}
        </Text>
      </View>

      <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
        <Text style={[{ color: colors.textPrimary, ...t.labelMedium, marginBottom: s.md }]}>
          Details
        </Text>
        {[
          { label: tr('employer.industry'), value: company.industry },
          { label: tr('candidate.location'), value: company.location },
          { label: tr('employer.website'), value: company.website },
          { label: tr('employer.employeeCount'), value: company.employeeCount },
          { label: 'Founded', value: company.foundedYear?.toString() },
        ].map((item, i) => (
          <View
            key={i}
            style={[
              styles.detailRow,
              {
                paddingVertical: s.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.divider,
              },
            ]}
          >
            <Text style={[{ color: colors.textTertiary, ...t.bodySmall }]}>{item.label}</Text>
            <Text style={[{ color: colors.textPrimary, ...t.labelSmall }]}>{item.value || '-'}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
        <Text style={[{ color: colors.textPrimary, ...t.labelMedium, marginBottom: s.md }]}>
          {tr('employer.verification')}
        </Text>
        <Card padding="md">
          <View style={styles.verificationRow}>
            <View style={[styles.verificationIcon, { backgroundColor: company.verificationStatus === 'verified' ? colors.successLight : colors.warningLight, borderRadius: r.md }]}>
              {company.verificationStatus === 'verified'
                ? <CheckCircle2 size={20} color={colors.success} strokeWidth={1.8} />
                : <Clock size={20} color={colors.warning} strokeWidth={1.8} />
              }
            </View>
            <View style={{ marginLeft: s.md, flex: 1 }}>
              <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{verificationLabel}</Text>
              <Text style={[{ color: colors.textTertiary, ...t.caption, marginTop: 2 }]}>
                {company.verificationStatus === 'verified'
                  ? 'Your company has been verified'
                  : 'Verification is in progress'}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  profileSection: {},
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: '100%' },
  section: {},
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verificationRow: { flexDirection: 'row', alignItems: 'center' },
  verificationIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
