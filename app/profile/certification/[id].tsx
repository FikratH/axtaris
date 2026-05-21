import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Button, DateField, EmptyState, Input } from '@/components/ui';
import {
  useCandidateProfile,
  useUpdateCandidateProfile,
} from '@/hooks/useCandidateVacancyActions';
import { Certification } from '@/types/models';
import { createLocalItemId, removeListItem, upsertListItem } from '@/utils/profileSections';

export default function CertificationFormScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { data: profile, isLoading, isError, refetch } = useCandidateProfile(user?.id);
  const updateProfile = useUpdateCandidateProfile(user?.id);

  const item = useMemo(
    () => profile?.certifications.find((entry) => entry.id === id),
    [id, profile?.certifications]
  );

  const isNew = !id || id === 'new';
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');

  useEffect(() => {
    if (isNew) {
      setName('');
      setIssuer('');
      setIssueDate('');
      setExpiryDate('');
      setCredentialUrl('');
      return;
    }

    if (!item) return;

    setName(item.name);
    setIssuer(item.issuer);
    setIssueDate(item.issueDate);
    setExpiryDate(item.expiryDate || '');
    setCredentialUrl(item.credentialUrl || '');
  }, [isNew, item]);

  const handleSave = async () => {
    if (!profile) return;

    if (!name.trim() || !issuer.trim() || !issueDate) {
      Alert.alert(tr('common.error'), tr('validation.required'));
      return;
    }

    const nextItem: Certification = {
      id: item?.id || createLocalItemId('certification'),
      name: name.trim(),
      issuer: issuer.trim(),
      issueDate,
      expiryDate: expiryDate || undefined,
      credentialUrl: credentialUrl.trim() || undefined,
    };

    try {
      await updateProfile.mutateAsync({
        certifications: upsertListItem(profile.certifications, nextItem),
      });
      router.back();
    } catch (error) {
      Alert.alert(tr('common.error'), error instanceof Error ? error.message : tr('common.error'));
    }
  };

  const handleDelete = () => {
    if (!profile || isNew || !item) return;

    Alert.alert(tr('common.deleteItemTitle'), tr('common.deleteItemMessage'), [
      {
        text: tr('common.cancel'),
        style: 'cancel',
      },
      {
        text: tr('common.delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await updateProfile.mutateAsync({
                certifications: removeListItem(profile.certifications, item.id),
              });
              router.back();
            } catch (error) {
              Alert.alert(tr('common.error'), error instanceof Error ? error.message : tr('common.error'));
            }
          })();
        },
      },
    ]);
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
        <EmptyState title={tr('common.error')} subtitle={tr('common.retry')} actionTitle={tr('common.retry')} onAction={() => refetch()} />
      </View>
    );
  }

  if (!profile || (!isNew && !item)) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <EmptyState title={tr('candidate.certifications')} subtitle={tr('common.error')} actionTitle={tr('common.retry')} onAction={() => refetch()} />
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
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}> 
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>
            {isNew ? tr('profileCrud.certification.addTitle') : tr('profileCrud.certification.editTitle')}
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}> 
          <Input label={tr('profileCrud.certification.nameLabel')} value={name} onChangeText={setName} placeholder={tr('profileCrud.certification.namePlaceholder')} />
          <Input label={tr('profileCrud.certification.issuerLabel')} value={issuer} onChangeText={setIssuer} placeholder={tr('profileCrud.certification.issuerPlaceholder')} />
          <DateField label={tr('profileCrud.certification.issueDateLabel')} value={issueDate} onChange={setIssueDate} placeholder={tr('profileCrud.shared.selectDate')} maximumYear={new Date().getFullYear()} />
          <DateField label={tr('profileCrud.certification.expiryDateLabel')} value={expiryDate} onChange={setExpiryDate} placeholder={tr('profileCrud.certification.expiryDatePlaceholder')} maximumYear={new Date().getFullYear() + 10} />
          <Input label={tr('profileCrud.certification.credentialUrlLabel')} value={credentialUrl} onChangeText={setCredentialUrl} placeholder={tr('profileCrud.certification.credentialUrlPlaceholder')} keyboardType="url" autoCapitalize="none" />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Button title={tr('common.save')} onPress={handleSave} loading={updateProfile.isPending} size="lg" />
          {!isNew ? (
            <Button title={tr('common.delete')} onPress={handleDelete} variant="destructive" size="md" />
          ) : null}
          <Button title={tr('common.cancel')} onPress={() => router.back()} variant="ghost" size="md" />
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
