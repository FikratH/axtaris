import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useEmployerCompany,
  useUpdateVacancy,
  useVacancy,
} from '@/hooks/useVacancyQueries';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { ChevronLeft } from 'lucide-react-native';
import { ExperienceLevel, VacancyStatus, WorkType } from '@/types/models';

const workTypes: { key: WorkType; label: string }[] = [
  { key: 'full_time', label: 'Full-time' },
  { key: 'part_time', label: 'Part-time' },
  { key: 'remote', label: 'Remote' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'onsite', label: 'On-site' },
  { key: 'internship', label: 'Internship' },
];

const expLevels: { key: ExperienceLevel; label: string }[] = [
  { key: 'no_experience', label: 'No experience' },
  { key: 'junior', label: 'Junior' },
  { key: 'mid', label: 'Mid' },
  { key: 'senior', label: 'Senior' },
  { key: 'lead', label: 'Lead' },
  { key: 'executive', label: 'Executive' },
];

function joinLines(items: string[]): string {
  return items.join('\n');
}

function splitLines(value: string): string[] {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function parseOptionalAmount(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) {
    throw new Error('Salary must be a number');
  }

  return parsed;
}

export default function EditVacancyScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: vacancy, isLoading, isError, refetch } = useVacancy(id);
  const { data: company } = useEmployerCompany(user?.id);
  const updateVacancy = useUpdateVacancy(user?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Bakı');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [workType, setWorkType] = useState<WorkType>('full_time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [requirements, setRequirements] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [benefits, setBenefits] = useState('');

  useEffect(() => {
    if (!vacancy) return;

    setTitle(vacancy.title);
    setDescription(vacancy.description);
    setCity(vacancy.city);
    setSalaryMin(vacancy.salaryMin ? String(vacancy.salaryMin) : '');
    setSalaryMax(vacancy.salaryMax ? String(vacancy.salaryMax) : '');
    setWorkType(vacancy.workType);
    setExperienceLevel(vacancy.experienceLevel);
    setSkills(vacancy.skills);
    setRequirements(joinLines(vacancy.requirements));
    setResponsibilities(joinLines(vacancy.responsibilities));
    setBenefits(joinLines(vacancy.benefits));
  }, [vacancy]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((item) => item !== skill));
  };

  const submitVacancy = async (status: VacancyStatus) => {
    if (!id || !vacancy) return;

    if (!title.trim() || !description.trim()) {
      Alert.alert(tr('common.error'), tr('validation.required'));
      return;
    }

    const companyId = company?.id || vacancy.companyId;

    if (!companyId) {
      Alert.alert(tr('common.error'), tr('employer.noVacanciesDesc'));
      return;
    }

    try {
      const nextSalaryMin = parseOptionalAmount(salaryMin);
      const nextSalaryMax = parseOptionalAmount(salaryMax);

      await updateVacancy.mutateAsync({
        id,
        input: {
          title: title.trim(),
          description: description.trim(),
          requirements: splitLines(requirements),
          responsibilities: splitLines(responsibilities),
          benefits: splitLines(benefits),
          salaryMin: nextSalaryMin,
          salaryMax: nextSalaryMax,
          salaryCurrency: 'AZN',
          showSalary: !!(nextSalaryMin || nextSalaryMax),
          city: city.trim() || 'Bakı',
          workType,
          experienceLevel,
          skills,
          companyId,
          status,
        },
      });

      Alert.alert(tr('common.done'), '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(tr('common.error'), error?.message || tr('common.error'));
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 16, paddingHorizontal: 20 }]}>
        <VacancyCardSkeleton />
      </View>
    );
  }

  if (isError || !vacancy) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.backgroundSecondary }]}>
        <EmptyState
          title={tr('common.error')}
          subtitle={isError ? tr('common.retry') : tr('common.noResults')}
          actionTitle={isError ? tr('common.retry') : undefined}
          onAction={isError ? () => refetch() : undefined}
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
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>
            {tr('common.edit')}
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Input label={tr('employer.vacancyTitle')} value={title} onChangeText={setTitle} placeholder="e.g. Senior React Native Developer" />
          <Input label={tr('employer.vacancyDescription')} value={description} onChangeText={setDescription} placeholder={tr('employer.vacancyDescription')} multiline numberOfLines={4} style={{ minHeight: 100, textAlignVertical: 'top' }} />
          <Input label={tr('candidate.city')} value={city} onChangeText={setCity} placeholder="Bakı" />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input label={`${tr('candidate.salary')} (min)`} value={salaryMin} onChangeText={setSalaryMin} placeholder="1000" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label={`${tr('candidate.salary')} (max)`} value={salaryMax} onChangeText={setSalaryMax} placeholder="3000" keyboardType="numeric" />
            </View>
          </View>

          <Text style={[{ color: colors.textPrimary, marginBottom: 8 }, t.labelSmall]}>{tr('candidate.jobType')}</Text>
          <View style={styles.chipRow}>
            {workTypes.map((wt) => (
              <Chip key={wt.key} label={wt.label} selected={workType === wt.key} onPress={() => setWorkType(wt.key)} style={{ marginBottom: 6 }} />
            ))}
          </View>

          <Text style={[{ color: colors.textPrimary, marginTop: 16, marginBottom: 8 }, t.labelSmall]}>{tr('candidate.experience')}</Text>
          <View style={styles.chipRow}>
            {expLevels.map((el) => (
              <Chip key={el.key} label={el.label} selected={experienceLevel === el.key} onPress={() => setExperienceLevel(el.key)} style={{ marginBottom: 6 }} />
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <Input
              label={tr('candidate.skills')}
              value={skillInput}
              onChangeText={setSkillInput}
              placeholder="Type a skill and press Add"
              onSubmitEditing={addSkill}
              rightIcon={<Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Add</Text>}
              onRightIconPress={addSkill}
            />
            {skills.length > 0 && (
              <View style={styles.chipRow}>
                {skills.map((skill) => (
                  <Chip key={skill} label={skill} selected onPress={() => removeSkill(skill)} style={{ marginBottom: 6 }} />
                ))}
              </View>
            )}
          </View>

          <Input label={tr('candidate.requirements')} value={requirements} onChangeText={setRequirements} placeholder="One per line" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          <Input label={tr('candidate.responsibilities')} value={responsibilities} onChangeText={setResponsibilities} placeholder="One per line" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          <Input label={tr('candidate.benefits')} value={benefits} onChangeText={setBenefits} placeholder="One per line" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Button
            title={tr('common.save')}
            onPress={() => submitVacancy(vacancy.status)}
            loading={updateVacancy.isPending}
            size="lg"
          />
          {vacancy.status !== 'active' ? (
            <Button
              title={tr('employer.publishVacancy')}
              onPress={() => submitVacancy('active')}
              variant="outline"
              size="md"
              disabled={updateVacancy.isPending}
            />
          ) : null}
          {vacancy.status !== 'draft' ? (
            <Button
              title={tr('employer.saveDraft')}
              onPress={() => submitVacancy('draft')}
              variant="ghost"
              size="md"
              disabled={updateVacancy.isPending}
            />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
