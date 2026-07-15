import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Alert } from '@/utils/dialog';
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
import { safeBack } from '@/utils/navigation';
import { getWorkTypeLabel, getExperienceLevelLabel } from '@/utils/labels';
import { SuggestionChips } from '@/components/ui/SuggestionChips';
import { getSuggestions } from '@/data/suggestions';
import { createLocalItemId } from '@/utils/profileSections';
import { ChevronLeft, X } from 'lucide-react-native';
import { ExperienceLevel, VacancyStatus, WorkType, ScreeningQuestion } from '@/types/models';

const workTypes: WorkType[] = ['full_time', 'part_time', 'remote', 'hybrid', 'onsite', 'internship'];

const expLevels: ExperienceLevel[] = ['no_experience', 'junior', 'mid', 'senior', 'lead', 'executive'];

function joinLines(items: string[]): string {
  return items.join('\n');
}

function splitLines(value: string): string[] {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function parseOptionalAmount(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (!/^\d+$/.test(trimmed)) {
    throw new Error('Salary must be a number');
  }

  return Number.parseInt(trimmed, 10);
}

export default function EditVacancyScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language as 'az' | 'ru' | 'en';
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
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>([]);
  const [questionInput, setQuestionInput] = useState('');

  const addQuestion = () => {
    const q = questionInput.trim();
    if (!q) return;
    setScreeningQuestions((cur) => [...cur, { id: createLocalItemId('question'), question: q, required: true }]);
    setQuestionInput('');
  };
  const removeQuestion = (qid: string) => setScreeningQuestions((cur) => cur.filter((x) => x.id !== qid));
  const toggleRequired = (qid: string) =>
    setScreeningQuestions((cur) => cur.map((x) => (x.id === qid ? { ...x, required: !x.required } : x)));
  const linesOf = (text: string) => text.split('\n').map((x) => x.trim()).filter(Boolean);
  const toggleLine = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) =>
    setter((cur) => {
      const lines = linesOf(cur);
      if (lines.includes(value)) return lines.filter((l) => l !== value).join('\n');
      return cur.trim() ? `${cur.trim()}\n${value}` : value;
    });

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
    setScreeningQuestions(vacancy.screeningQuestions || []);
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

    let nextSalaryMin: number | undefined;
    let nextSalaryMax: number | undefined;
    try {
      nextSalaryMin = parseOptionalAmount(salaryMin);
      nextSalaryMax = parseOptionalAmount(salaryMax);
    } catch {
      Alert.alert(tr('common.error'), tr('validation.salaryNumber'));
      return;
    }

    if (nextSalaryMin !== undefined && nextSalaryMax !== undefined && nextSalaryMin > nextSalaryMax) {
      Alert.alert(tr('common.error'), tr('validation.salaryRange'));
      return;
    }

    try {
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
          screeningQuestions,
        },
      });

      Alert.alert(tr('common.done'), '', [
        { text: tr('common.ok'), onPress: () => safeBack(router, '/(employer)/vacancies') },
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
          <TouchableOpacity onPress={() => safeBack(router, '/(employer)/vacancies')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>
            {tr('common.edit')}
          </Text>
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
                {skills.map((skill) => (
                  <Chip key={skill} label={skill} selected onPress={() => removeSkill(skill)} style={{ marginBottom: 6 }} />
                ))}
              </View>
            )}
          </View>

          <Input label={tr('candidate.requirements')} value={requirements} onChangeText={setRequirements} placeholder={tr('employer.onePerLine')} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          <SuggestionChips suggestions={getSuggestions('requirements', lang)} selected={linesOf(requirements)} onSelect={toggleLine(setRequirements)} title={tr('common.suggestions')} />
          <Input label={tr('candidate.responsibilities')} value={responsibilities} onChangeText={setResponsibilities} placeholder={tr('employer.onePerLine')} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          <SuggestionChips suggestions={getSuggestions('responsibilities', lang)} selected={linesOf(responsibilities)} onSelect={toggleLine(setResponsibilities)} title={tr('common.suggestions')} />
          <Input label={tr('candidate.benefits')} value={benefits} onChangeText={setBenefits} placeholder={tr('employer.onePerLine')} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          <SuggestionChips suggestions={getSuggestions('benefits', lang)} selected={linesOf(benefits)} onSelect={toggleLine(setBenefits)} title={tr('common.suggestions')} />

          <Text style={[{ color: colors.textPrimary, marginTop: 20, marginBottom: 4 }, t.labelSmall]}>{tr('employer.screeningQuestions')}</Text>
          <Text style={[{ color: colors.textTertiary, marginBottom: 8 }, t.caption]}>{tr('employer.screeningQuestionsHint')}</Text>
          {screeningQuestions.map((q) => (
            <View key={q.id} style={[styles.questionRow, { borderColor: colors.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[{ color: colors.textPrimary }, t.bodySmall]}>{q.question}</Text>
                <TouchableOpacity onPress={() => toggleRequired(q.id)} style={{ marginTop: 6 }}>
                  <Text style={[{ color: q.required ? colors.primary : colors.textTertiary }, t.caption]}>
                    {q.required ? `● ${tr('employer.questionRequired')}` : `○ ${tr('employer.questionOptional')}`}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => removeQuestion(q.id)} hitSlop={8} style={{ padding: 4 }}>
                <X size={16} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <Input
            value={questionInput}
            onChangeText={setQuestionInput}
            placeholder={tr('employer.addQuestion')}
            onSubmitEditing={addQuestion}
            rightIcon={<Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>{tr('common.add')}</Text>}
            onRightIconPress={addQuestion}
          />
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
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
});
