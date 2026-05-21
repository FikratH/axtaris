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
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { safeBack } from '@/utils/navigation';
import { Button, Chip, DateField, EmptyState, Input } from '@/components/ui';
import {
  useCandidateProfile,
  useUpdateCandidateProfile,
} from '@/hooks/useCandidateVacancyActions';
import { WorkExperience } from '@/types/models';
import { createLocalItemId, removeListItem, upsertListItem } from '@/utils/profileSections';

export default function ExperienceFormScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useCandidateProfile(user?.id);
  const updateProfile = useUpdateCandidateProfile(user?.id);

  const item = useMemo(
    () => profile?.workExperience.find((entry) => entry.id === id),
    [id, profile?.workExperience]
  );

  const isNew = !id || id === 'new';
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);

  useEffect(() => {
    if (isNew) {
      setJobTitle('');
      setCompany('');
      setLocation('');
      setStartDate('');
      setEndDate('');
      setIsCurrent(false);
      setDescription('');
      setHighlights([]);
      setHighlightInput('');
      return;
    }

    if (!item) return;

    setJobTitle(item.jobTitle);
    setCompany(item.company);
    setLocation(item.location || '');
    setStartDate(item.startDate);
    setEndDate(item.endDate || '');
    setIsCurrent(item.isCurrent);
    setDescription(item.description || '');
    setHighlights(item.highlights || []);
    setHighlightInput('');
  }, [isNew, item]);

  const addHighlight = () => {
    const trimmed = highlightInput.trim();
    if (!trimmed || highlights.includes(trimmed)) return;
    setHighlights((current) => [...current, trimmed]);
    setHighlightInput('');
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
                workExperience: removeListItem(profile.workExperience, item.id),
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

  const handleSave = async () => {
    if (!profile) return;

    if (!jobTitle.trim() || !company.trim() || !startDate) {
      Alert.alert(tr('common.error'), tr('validation.required'));
      return;
    }

    if (!isCurrent && !endDate) {
      Alert.alert(tr('common.error'), tr('validation.required'));
      return;
    }

    const nextItem: WorkExperience = {
      id: item?.id || createLocalItemId('experience'),
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      location: location.trim() || undefined,
      startDate,
      endDate: isCurrent ? undefined : endDate,
      isCurrent,
      description: description.trim() || undefined,
      highlights,
    };

    try {
      await updateProfile.mutateAsync({
        workExperience: upsertListItem(profile.workExperience, nextItem),
      });
      safeBack(router, '/(candidate)/profile');
    } catch (error) {
      Alert.alert(tr('common.error'), error instanceof Error ? error.message : tr('common.error'));
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

  if (!profile || (!isNew && !item)) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <EmptyState
          title={tr('candidate.experience_section')}
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
          <TouchableOpacity onPress={() => safeBack(router, '/(candidate)/profile')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>
            {isNew ? tr('profileCrud.experience.addTitle') : tr('profileCrud.experience.editTitle')}
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}> 
          <Input
            label={tr('candidate.jobTitle')}
            value={jobTitle}
            onChangeText={setJobTitle}
            placeholder={tr('profileCrud.experience.jobTitlePlaceholder')}
          />
          <Input
            label={tr('candidate.company')}
            value={company}
            onChangeText={setCompany}
            placeholder={tr('profileCrud.experience.companyPlaceholder')}
          />
          <Input
            label={tr('candidate.location')}
            value={location}
            onChangeText={setLocation}
            placeholder={tr('profileCrud.shared.locationPlaceholder')}
          />
          <DateField
            label={tr('candidate.startDate')}
            value={startDate}
            onChange={setStartDate}
            placeholder={tr('profileCrud.shared.selectDate')}
            maximumYear={new Date().getFullYear()}
          />
          {!isCurrent ? (
            <DateField
              label={tr('candidate.endDate')}
              value={endDate}
              onChange={setEndDate}
              placeholder={tr('profileCrud.shared.selectDate')}
              maximumYear={new Date().getFullYear()}
            />
          ) : null}

          <Text style={[{ color: colors.textPrimary, marginBottom: 8 }, t.labelSmall]}>{tr('profileCrud.experience.statusLabel')}</Text>
          <View style={styles.toggleRow}>
            <Chip
              label={tr('profileCrud.experience.currentStatus')}
              selected={isCurrent}
              onPress={() => setIsCurrent(true)}
              style={{ marginRight: 8 }}
            />
            <Chip label={tr('profileCrud.shared.completed')} selected={!isCurrent} onPress={() => setIsCurrent(false)} />
          </View>

          <Input
            label={tr('candidate.description')}
            value={description}
            onChangeText={setDescription}
            placeholder={tr('profileCrud.experience.descriptionPlaceholder')}
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />

          <Text style={[{ color: colors.textPrimary, marginBottom: 8 }, t.labelSmall]}>{tr('profileCrud.experience.highlightsLabel')}</Text>
          <Input
            value={highlightInput}
            onChangeText={setHighlightInput}
            placeholder={tr('profileCrud.experience.highlightPlaceholder')}
            onSubmitEditing={addHighlight}
            rightIcon={<Plus size={16} color={colors.primary} strokeWidth={2} />}
            onRightIconPress={addHighlight}
          />
          <View style={styles.chipRow}>
            {highlights.map((highlight) => (
              <Chip
                key={highlight}
                label={highlight}
                selected
                onPress={() => setHighlights((current) => current.filter((itemValue) => itemValue !== highlight))}
                style={{ marginBottom: 6 }}
              />
            ))}
          </View>
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
