import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { safeBack } from '@/utils/navigation';
import { Button, Chip, DateField, EmptyState, Input } from '@/components/ui';
import { SuggestionChips } from '@/components/ui/SuggestionChips';
import { getSuggestions } from '@/data/suggestions';
import {
  useCandidateProfile,
  useUpdateCandidateProfile,
} from '@/hooks/useCandidateVacancyActions';
import { Education } from '@/types/models';
import { createLocalItemId, removeListItem, upsertListItem } from '@/utils/profileSections';

export default function EducationFormScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { data: profile, isLoading, isError, refetch } = useCandidateProfile(user?.id);
  const updateProfile = useUpdateCandidateProfile(user?.id);

  const item = useMemo(
    () => profile?.education.find((entry) => entry.id === id),
    [id, profile?.education]
  );

  const isNew = !id || id === 'new';
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isNew) {
      setDegree('');
      setFieldOfStudy('');
      setInstitution('');
      setStartDate('');
      setEndDate('');
      setIsCurrent(false);
      setDescription('');
      return;
    }

    if (!item) return;

    setDegree(item.degree);
    setFieldOfStudy(item.fieldOfStudy);
    setInstitution(item.institution);
    setStartDate(item.startDate);
    setEndDate(item.endDate || '');
    setIsCurrent(item.isCurrent);
    setDescription(item.description || '');
  }, [isNew, item]);

  const handleSave = async () => {
    if (!profile) return;

    if (!degree.trim() || !fieldOfStudy.trim() || !institution.trim() || !startDate) {
      Alert.alert(tr('common.error'), tr('validation.required'));
      return;
    }

    if (!isCurrent && !endDate) {
      Alert.alert(tr('common.error'), tr('validation.required'));
      return;
    }

    if (!isCurrent && endDate && endDate < startDate) {
      Alert.alert(tr('common.error'), tr('validation.dateRange'));
      return;
    }

    const nextItem: Education = {
      id: item?.id || createLocalItemId('education'),
      degree: degree.trim(),
      fieldOfStudy: fieldOfStudy.trim(),
      institution: institution.trim(),
      startDate,
      endDate: isCurrent ? undefined : endDate,
      isCurrent,
      description: description.trim() || undefined,
    };

    try {
      await updateProfile.mutateAsync({
        education: upsertListItem(profile.education, nextItem),
      });
      safeBack(router, '/(candidate)/profile');
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
                education: removeListItem(profile.education, item.id),
              });
              safeBack(router, '/(candidate)/profile');
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
        <EmptyState title={tr('candidate.education')} subtitle={tr('common.error')} actionTitle={tr('common.retry')} onAction={() => refetch()} />
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
          <TouchableOpacity onPress={() => safeBack(router, '/(candidate)/profile')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}> 
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>
            {isNew ? tr('profileCrud.education.addTitle') : tr('profileCrud.education.editTitle')}
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}> 
          <Input label={tr('candidate.degree')} value={degree} onChangeText={setDegree} placeholder={tr('profileCrud.education.degreePlaceholder')} />
          <SuggestionChips
            suggestions={getSuggestions('degrees', i18n.language as 'az' | 'ru' | 'en')}
            query={degree}
            selected={degree ? [degree] : []}
            onSelect={(v) => setDegree((cur) => (cur === v ? '' : v))}
          />
          <Input label={tr('candidate.fieldOfStudy')} value={fieldOfStudy} onChangeText={setFieldOfStudy} placeholder={tr('profileCrud.education.fieldOfStudyPlaceholder')} />
          <SuggestionChips
            suggestions={getSuggestions('fieldsOfStudy', i18n.language as 'az' | 'ru' | 'en')}
            query={fieldOfStudy}
            selected={fieldOfStudy ? [fieldOfStudy] : []}
            onSelect={(v) => setFieldOfStudy((cur) => (cur === v ? '' : v))}
          />
          <Input label={tr('candidate.school')} value={institution} onChangeText={setInstitution} placeholder={tr('profileCrud.education.institutionPlaceholder')} />
          <DateField label={tr('candidate.startDate')} value={startDate} onChange={setStartDate} placeholder={tr('profileCrud.shared.selectDate')} maximumYear={new Date().getFullYear()} />
          {!isCurrent ? <DateField label={tr('candidate.endDate')} value={endDate} onChange={setEndDate} placeholder={tr('profileCrud.shared.selectDate')} maximumYear={new Date().getFullYear()} /> : null}
          <Text style={[{ color: colors.textPrimary, marginBottom: 8 }, t.labelSmall]}>{tr('profileCrud.education.statusLabel')}</Text>
          <View style={styles.toggleRow}>
            <Chip label={tr('profileCrud.education.currentStatus')} selected={isCurrent} onPress={() => setIsCurrent(true)} style={{ marginRight: 8 }} />
            <Chip label={tr('profileCrud.shared.completed')} selected={!isCurrent} onPress={() => setIsCurrent(false)} />
          </View>
          <Input label={tr('candidate.description')} value={description} onChangeText={setDescription} placeholder={tr('profileCrud.education.descriptionPlaceholder')} multiline numberOfLines={4} style={{ minHeight: 100, textAlignVertical: 'top' }} />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Button title={tr('common.save')} onPress={handleSave} loading={updateProfile.isPending} size="lg" />
          {!isNew ? (
            <Button title={tr('common.delete')} onPress={handleDelete} variant="destructive" size="md" />
          ) : null}
          <Button title={tr('common.cancel')} onPress={() => safeBack(router, '/(candidate)/profile')} variant="ghost" size="md" />
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
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
});
