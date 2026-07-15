import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Clock } from 'lucide-react-native';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useEmployerCompany, useEmployerVacancies, useUpdateEmployerCompany } from '@/hooks/useVacancyQueries';
import { fileStorageService } from '@/services/fileStorageService';
import { getVerificationPresentation } from '@/utils/labels';

export default function CompanyScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    data: company,
    isLoading,
    isError,
    refetch,
  } = useEmployerCompany(user?.id);
  const { data: vacancies = [] } = useEmployerVacancies(user?.id);
  const updateCompany = useUpdateEmployerCompany(user?.id);
  const imagePicker = useImagePicker({ aspect: [1, 1], quality: 0.8 });

  const handleChangeLogo = async () => {
    if (!user?.id || !company) {
      return;
    }

    const picked = await imagePicker.showPicker();
    if (picked) {
      const previousLogoUrl = company.logoUrl;

      try {
        const uploaded = await fileStorageService.uploadCompanyLogo(user.id, company.id, {
          uri: picked.uri,
          fileName: picked.fileName,
          mimeType: picked.type,
          fileSize: picked.fileSize,
        });

        await updateCompany.mutateAsync({
          companyId: company.id,
          input: { logoUrl: uploaded.url },
        });

        if (previousLogoUrl && previousLogoUrl !== uploaded.url) {
          void fileStorageService.removeUploadedFile(previousLogoUrl).catch(() => undefined);
        }
      } catch (error) {
        Alert.alert(
          tr('common.error'),
          error instanceof Error ? error.message : tr('common.error')
        );
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.textSecondary, marginTop: s.md }, t.bodyMedium]}>{tr('common.loading')}</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <EmptyState
          title={tr('common.error')}
          subtitle={tr('common.retry')}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  if (!company) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <EmptyState
          title={tr('employer.companyProfile')}
          subtitle={tr('common.error')}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const verification = getVerificationPresentation(tr, company.verificationStatus);

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
            <Avatar name={company.name} uri={company.logoUrl} size={72} editable onPress={handleChangeLogo} />
            <View style={[styles.profileInfo, { marginLeft: s.lg }]}>
              <Text style={[{ color: colors.textPrimary, ...t.headingMedium }]}>
                {company.name}
              </Text>
              <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: 2 }]}>
                {company.industry}
              </Text>
              <Badge
                label={verification.label}
                variant={verification.variant}
                style={{ marginTop: s.sm }}
              />
            </View>
          </View>

          <View style={[styles.statsRow, { marginTop: s.lg, paddingTop: s.lg, borderTopWidth: 1, borderTopColor: colors.divider }]}> 
            <View style={styles.stat}>
              <Text style={[{ color: colors.primary, ...t.headingSmall }]}>{vacancies.length}</Text>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.vacancies')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.stat}>
              <Text style={[{ color: colors.primary, ...t.headingSmall }]}>{company.rating || '-'}</Text>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.rating')}</Text>
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
          {tr('employer.details')}
        </Text>
        {[
          { label: tr('employer.industry'), value: company.industry },
          { label: tr('candidate.location'), value: company.location },
          { label: tr('employer.website'), value: company.website },
          { label: tr('employer.employeeCount'), value: company.employeeCount },
          { label: tr('employer.founded'), value: company.foundedYear?.toString() },
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
            <View style={[styles.verificationIcon, { backgroundColor: verification.tone === 'success' ? colors.successLight : verification.tone === 'error' ? colors.errorLight : colors.warningLight, borderRadius: r.md }]}>
              {verification.tone === 'success'
                ? <CheckCircle2 size={20} color={colors.success} strokeWidth={1.8} />
                : <Clock size={20} color={verification.tone === 'error' ? colors.error : colors.warning} strokeWidth={1.8} />
              }
            </View>
            <View style={{ marginLeft: s.md, flex: 1 }}>
              <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{verification.label}</Text>
              <Text style={[{ color: colors.textTertiary, ...t.caption, marginTop: 2 }]}>
                {verification.description}
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
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
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
