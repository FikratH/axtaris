import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useEmployerCompany, useUpdateEmployerCompany } from '@/hooks/useVacancyQueries';
import { useGuestGate } from '@/hooks/useGuestGate';
import { safeBack } from '@/utils/navigation';
import { toUserMessage } from '@/utils/errorMessage';
import { ChevronLeft } from 'lucide-react-native';

export default function EditCompanyScreen() {
  const { colors, typography: t } = useTheme();
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
  const updateCompany = useUpdateEmployerCompany(user?.id);
  const { requireAuth } = useGuestGate();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');

  useEffect(() => {
    if (!company) return;

    setName(company.name || '');
    setIndustry(company.industry || '');
    setDescription(company.description || '');
    setWebsite(company.website || '');
    setLocation(company.location || '');
    setEmployeeCount(company.employeeCount || '');
  }, [company]);

  const handleSave = async () => {
    if (!requireAuth()) return;
    if (!name.trim()) { Alert.alert(tr('common.error'), tr('validation.required')); return; }

    if (!company) {
      return;
    }

    try {
      await updateCompany.mutateAsync({
        companyId: company.id,
        input: {
          name,
          industry,
          description,
          website,
          location,
          employeeCount,
        },
      });

      Alert.alert(tr('common.save'), '', [{ text: tr('common.ok'), onPress: () => safeBack(router, '/(employer)/company') }]);
    } catch (error) {
      Alert.alert(tr('common.error'), toUserMessage(error, tr));
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.textSecondary, marginTop: 12 }, t.bodyMedium]}>{tr('common.loading')}</Text>
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
          title={tr('employer.editCompany')}
          subtitle={tr('common.error')}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 12, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => safeBack(router, '/(employer)/company')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('employer.editCompany')}</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Input label={tr('employer.companyName')} value={name} onChangeText={setName} placeholder={tr('employer.companyNamePlaceholder')} />
          <Input label={tr('employer.industry')} value={industry} onChangeText={setIndustry} placeholder={tr('employer.industryPlaceholder')} />
          <Input label={tr('employer.about')} value={description} onChangeText={setDescription} placeholder={tr('employer.aboutPlaceholder')} multiline numberOfLines={4} style={{ minHeight: 100, textAlignVertical: 'top' }} />
          <Input label={tr('employer.website')} value={website} onChangeText={setWebsite} placeholder="https://company.com" keyboardType="url" autoCapitalize="none" />
          <Input label={tr('candidate.location')} value={location} onChangeText={setLocation} placeholder={tr('profileCrud.shared.locationPlaceholder')} />
          <Input label={tr('employer.employeeCount')} value={employeeCount} onChangeText={setEmployeeCount} placeholder="100-500" />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Button title={tr('common.save')} onPress={handleSave} loading={updateCompany.isPending} size="lg" />
          <Button title={tr('common.cancel')} onPress={() => safeBack(router, '/(employer)/company')} variant="ghost" size="md" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
});
