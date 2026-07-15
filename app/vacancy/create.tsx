import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useCreateVacancy,
  useEmployerCompany,
} from '@/hooks/useVacancyQueries';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { safeBack } from '@/utils/navigation';
import { getWorkTypeLabel, getExperienceLevelLabel } from '@/utils/labels';
import { ChevronLeft } from 'lucide-react-native';
import { WorkType, ExperienceLevel, VacancyStatus } from '@/types/models';

const workTypes: WorkType[] = ['full_time', 'part_time', 'remote', 'hybrid', 'onsite', 'internship'];

const expLevels: ExperienceLevel[] = ['no_experience', 'junior', 'mid', 'senior', 'lead', 'executive'];

export default function CreateVacancyScreen() {
  const { colors, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: company, isLoading: companyLoading, isError: companyError, refetch } = useEmployerCompany(user?.id);
  const createVacancy = useCreateVacancy(user?.id);

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
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const submitVacancy = async (status: VacancyStatus) => {
    if (!title.trim()) {
      Alert.alert(tr('common.error'), tr('validation.required'));
      return;
    }
    if (!description.trim()) {
      Alert.alert(tr('common.error'), tr('validation.required'));
      return;
    }

    if (!company) {
      Alert.alert(tr('common.error'), tr('employer.noVacanciesDesc'));
      return;
    }

    const parseSalary = (v: string) => {
      const value = v.trim();
      if (!value) return undefined;
      if (!/^\d+$/.test(value)) throw new Error(tr('validation.salaryNumber'));
      return Number.parseInt(value, 10);
    };

    let parsedMin: number | undefined;
    let parsedMax: number | undefined;
    try {
      parsedMin = parseSalary(salaryMin);
      parsedMax = parseSalary(salaryMax);
    } catch (e) {
      Alert.alert(tr('common.error'), e instanceof Error ? e.message : tr('common.error'));
      return;
    }

    if (parsedMin !== undefined && parsedMax !== undefined && parsedMin > parsedMax) {
      Alert.alert(tr('common.error'), tr('validation.salaryRange'));
      return;
    }

    try {
      await createVacancy.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        requirements: requirements.split('\n').map((item) => item.trim()).filter(Boolean),
        responsibilities: responsibilities.split('\n').map((item) => item.trim()).filter(Boolean),
        benefits: benefits.split('\n').map((item) => item.trim()).filter(Boolean),
        salaryMin: parsedMin,
        salaryMax: parsedMax,
        salaryCurrency: 'AZN',
        showSalary: !!(parsedMin || parsedMax),
        city: city.trim() || 'Bakı',
        workType,
        experienceLevel,
        skills,
        companyId: company.id,
        status,
      });

      Alert.alert(
        status === 'draft' ? tr('employer.saveDraft') : tr('employer.publishVacancy'),
        '',
        [{ text: tr('common.ok'), onPress: () => safeBack(router, '/(employer)/vacancies') }]
      );
    } catch (error: any) {
      Alert.alert(tr('common.error'), error?.message || tr('common.error'));
    }
  };

  if (companyError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary, justifyContent: 'center' }}>
        <EmptyState
          title={tr('common.error')}
          subtitle={tr('common.retry')}
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
          <TouchableOpacity onPress={() => safeBack(router, '/(employer)/vacancies')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('employer.createVacancy')}</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Input label={tr('employer.vacancyTitle')} value={title} onChangeText={setTitle} placeholder={tr('employer.vacancyTitlePlaceholder')} />
          <Input label={tr('employer.vacancyDescription')} value={description} onChangeText={setDescription} placeholder={tr('employer.vacancyDescription')} multiline numberOfLines={4} style={{ minHeight: 100, textAlignVertical: 'top' }} />
          <Input label={tr('candidate.city')} value={city} onChangeText={setCity} placeholder={tr('profileCrud.shared.locationPlaceholder')} />

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
              <Chip key={wt} label={getWorkTypeLabel(tr, wt)} selected={workType === wt} onPress={() => setWorkType(wt)} style={{ marginBottom: 6 }} />
            ))}
          </View>

          <Text style={[{ color: colors.textPrimary, marginTop: 16, marginBottom: 8 }, t.labelSmall]}>{tr('candidate.experience')}</Text>
          <View style={styles.chipRow}>
            {expLevels.map((el) => (
              <Chip key={el} label={getExperienceLevelLabel(tr, el)} selected={experienceLevel === el} onPress={() => setExperienceLevel(el)} style={{ marginBottom: 6 }} />
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <Input
              label={tr('candidate.skills')}
              value={skillInput}
              onChangeText={setSkillInput}
              placeholder={tr('employer.skillInputPlaceholder')}
              onSubmitEditing={addSkill}
              rightIcon={<Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>{tr('common.add')}</Text>}
              onRightIconPress={addSkill}
            />
            {skills.length > 0 && (
              <View style={styles.chipRow}>
                {skills.map((sk) => (
                  <Chip key={sk} label={sk} selected onPress={() => removeSkill(sk)} style={{ marginBottom: 6 }} />
                ))}
              </View>
            )}
          </View>

          <Input label={tr('candidate.requirements')} value={requirements} onChangeText={setRequirements} placeholder={tr('employer.onePerLine')} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          <Input label={tr('candidate.responsibilities')} value={responsibilities} onChangeText={setResponsibilities} placeholder={tr('employer.onePerLine')} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          <Input label={tr('candidate.benefits')} value={benefits} onChangeText={setBenefits} placeholder={tr('employer.onePerLine')} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Button
            title={tr('employer.publishVacancy')}
            onPress={() => submitVacancy('active')}
            loading={createVacancy.isPending}
            disabled={companyLoading}
            size="lg"
          />
          <Button
            title={tr('employer.saveDraft')}
            onPress={() => submitVacancy('draft')}
            variant="outline"
            size="md"
            disabled={companyLoading || createVacancy.isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
