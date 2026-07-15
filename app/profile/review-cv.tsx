import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { safeBack } from '@/utils/navigation';
import { Button, Chip, DateField, EmptyState, Input, SelectField } from '@/components/ui';
import type { SelectFieldOption } from '@/components/ui/SelectField';
import { SuggestionChips } from '@/components/ui/SuggestionChips';
import { getSuggestions } from '@/data/suggestions';
import {
  useCandidateProfile,
  useUpdateCandidateProfile,
} from '@/hooks/useCandidateVacancyActions';
import { CandidateProfileMutationInput } from '@/services/candidateVacancyService';
import { Education, LanguageSkill, WorkExperience } from '@/types/models';
import { createLocalItemId, dedupeBy } from '@/utils/profileSections';
import { useResumeDraftStore } from '@/store/resumeDraftStore';

type LanguageLevel = LanguageSkill['level'];

interface ExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface EducationItem {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface LanguageItem {
  id: string;
  language: string;
  level: LanguageLevel;
}

function pad(value: string): string {
  return value.padStart(2, '0');
}

/** Coerce a (possibly partial) date string into strict YYYY-MM-DD, or null. */
function coerceDate(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let m = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;

  m = trimmed.match(/^(\d{4})[-/](\d{1,2})$/);
  if (m) return `${m[1]}-${pad(m[2])}-01`;

  m = trimmed.match(/^(\d{4})$/);
  if (m) return `${m[1]}-01-01`;

  // Loose fallback: pull the first year (and optional month/day) out of noise.
  m = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = trimmed.match(/(\d{4})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(m[2])}-01`;
  m = trimmed.match(/(\d{4})/);
  if (m) return `${m[1]}-01-01`;

  return null;
}

/** Map a fuzzy proficiency ("fluent", "B2", "C1", "native"...) to the 4 enum values. */
function mapFuzzyLevel(raw?: string): LanguageLevel {
  const v = (raw ?? '').trim().toLowerCase();
  if (!v) return 'intermediate';
  if (/(native|mother|ana dil|родн|c2)/.test(v)) return 'native';
  if (/(advanced|fluent|proficient|upper|c1|b2|yüksək|свободн|продвинут)/.test(v)) return 'advanced';
  if (/(intermediate|conversational|b1|a2|orta|средн)/.test(v)) return 'intermediate';
  if (/(beginner|basic|elementary|a1|başlanğıc|начальн)/.test(v)) return 'beginner';
  return 'intermediate';
}

export default function ReviewCvScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading, isError, refetch } = useCandidateProfile(user?.id);
  const updateProfile = useUpdateCandidateProfile(user?.id);

  const draft = useResumeDraftStore((s) => s.draft);
  const clearDraft = useResumeDraftStore((s) => s.clearDraft);
  const submittedRef = useRef(false);

  const [title, setTitle] = useState(() => draft?.title ?? '');
  const [bio, setBio] = useState(() => draft?.bio ?? '');
  const [skills, setSkills] = useState<string[]>(() => draft?.skills ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [experience, setExperience] = useState<ExperienceItem[]>(() =>
    (draft?.experience ?? []).map((e) => ({
      id: createLocalItemId('experience'),
      jobTitle: e.jobTitle ?? '',
      company: e.company ?? '',
      location: e.location ?? '',
      startDate: coerceDate(e.startDate) ?? '',
      endDate: e.isCurrent ? '' : coerceDate(e.endDate) ?? '',
      isCurrent: !!e.isCurrent,
      description: e.description ?? '',
    }))
  );
  const [education, setEducation] = useState<EducationItem[]>(() =>
    (draft?.education ?? []).map((e) => ({
      id: createLocalItemId('education'),
      degree: e.degree ?? '',
      fieldOfStudy: e.fieldOfStudy ?? '',
      institution: e.institution ?? '',
      startDate: coerceDate(e.startDate) ?? '',
      endDate: e.isCurrent ? '' : coerceDate(e.endDate) ?? '',
      isCurrent: !!e.isCurrent,
      description: e.description ?? '',
    }))
  );
  const [languages, setLanguages] = useState<LanguageItem[]>(() =>
    (draft?.languages ?? []).map((l) => ({
      id: createLocalItemId('language'),
      language: l.language ?? '',
      level: mapFuzzyLevel(l.level),
    }))
  );

  // Nothing to review (opened directly / already consumed) — bounce back.
  useEffect(() => {
    if (!draft && !submittedRef.current) {
      safeBack(router, '/(candidate)/profile');
    }
  }, [draft, router]);

  const levelOptions: SelectFieldOption<LanguageLevel>[] = [
    { value: 'beginner', label: tr('profileCrud.language.levels.beginner') },
    { value: 'intermediate', label: tr('profileCrud.language.levels.intermediate') },
    { value: 'advanced', label: tr('profileCrud.language.levels.advanced') },
    { value: 'native', label: tr('profileCrud.language.levels.native') },
  ];

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((cur) => [...cur, trimmed]);
      setSkillInput('');
    }
  };

  const updateExperience = (id: string, patch: Partial<ExperienceItem>) =>
    setExperience((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeExperience = (id: string) =>
    setExperience((cur) => cur.filter((x) => x.id !== id));

  const updateEducation = (id: string, patch: Partial<EducationItem>) =>
    setEducation((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeEducation = (id: string) =>
    setEducation((cur) => cur.filter((x) => x.id !== id));

  const updateLanguage = (id: string, patch: Partial<LanguageItem>) =>
    setLanguages((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeLanguage = (id: string) =>
    setLanguages((cur) => cur.filter((x) => x.id !== id));

  const handleDiscard = () => {
    submittedRef.current = true;
    clearDraft();
    safeBack(router, '/(candidate)/profile');
  };

  const handleConfirm = async () => {
    if (!profile) return;

    // Drop rows the DB would reject (NOT NULL start_date / company / institution).
    const parsedExperience: WorkExperience[] = experience
      .map((e): WorkExperience | null => {
        const startDate = coerceDate(e.startDate);
        const company = e.company.trim();
        if (!startDate || !company) return null;
        return {
          id: e.id,
          jobTitle: e.jobTitle.trim(),
          company,
          location: e.location.trim() || undefined,
          startDate,
          endDate: e.isCurrent ? undefined : coerceDate(e.endDate) ?? undefined,
          isCurrent: e.isCurrent,
          description: e.description.trim() || undefined,
          highlights: [],
        };
      })
      .filter((x): x is WorkExperience => x !== null);

    const parsedEducation: Education[] = education
      .map((e): Education | null => {
        const startDate = coerceDate(e.startDate);
        const institution = e.institution.trim();
        if (!startDate || !institution) return null;
        return {
          id: e.id,
          degree: e.degree.trim(),
          fieldOfStudy: e.fieldOfStudy.trim(),
          institution,
          startDate,
          endDate: e.isCurrent ? undefined : coerceDate(e.endDate) ?? undefined,
          isCurrent: e.isCurrent,
          description: e.description.trim() || undefined,
        };
      })
      .filter((x): x is Education => x !== null);

    const parsedLanguages: LanguageSkill[] = languages
      .map((l): LanguageSkill => ({ id: l.id, language: l.language.trim(), level: l.level }))
      .filter((l) => l.language.length > 0);

    // Send the UNION of existing + parsed — reconcileChildRows REPLACES each
    // child table, so existing rows must be resent or they'd be deleted.
    // Existing-first ordering means the user's own rows win any dedupe tie.
    const mergedExperience = dedupeBy(
      [...profile.workExperience, ...parsedExperience],
      (i) => `${i.jobTitle.trim().toLowerCase()}|${i.company.trim().toLowerCase()}|${i.startDate}`
    );
    const mergedEducation = dedupeBy(
      [...profile.education, ...parsedEducation],
      (i) => `${i.degree.trim().toLowerCase()}|${i.institution.trim().toLowerCase()}|${i.startDate}`
    );
    const mergedLanguages = dedupeBy(
      [...profile.languages, ...parsedLanguages],
      (i) => i.language.trim().toLowerCase()
    );
    const mergedSkills = Array.from(
      new Set([...profile.skills, ...skills].map((s) => s.trim()).filter(Boolean))
    );

    const input: CandidateProfileMutationInput = {
      skills: mergedSkills,
      workExperience: mergedExperience,
      education: mergedEducation,
      languages: mergedLanguages,
    };
    // Only fill title/bio when the profile has none — never overwrite the user's.
    if (!profile.title?.trim() && title.trim()) input.title = title.trim();
    if (!profile.bio?.trim() && bio.trim()) input.bio = bio.trim();

    try {
      await updateProfile.mutateAsync(input);
      submittedRef.current = true;
      clearDraft();
      safeBack(router, '/(candidate)/profile');
    } catch (error) {
      Alert.alert(tr('common.error'), error instanceof Error ? error.message : tr('common.error'));
    }
  };

  if (isLoading || (!draft && !submittedRef.current)) {
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

  if (!profile) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <EmptyState
          title={tr('reviewCv.title')}
          subtitle={tr('common.error')}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const langSuggestions = getSuggestions('languages', i18n.language as 'az' | 'ru' | 'en');
  const jobTitleSuggestions = getSuggestions('jobTitles', i18n.language as 'az' | 'ru' | 'en');
  const companySuggestions = getSuggestions('companies', i18n.language as 'az' | 'ru' | 'en');
  const degreeSuggestions = getSuggestions('degrees', i18n.language as 'az' | 'ru' | 'en');
  const fieldSuggestions = getSuggestions('fieldsOfStudy', i18n.language as 'az' | 'ru' | 'en');
  const skillSuggestions = getSuggestions('skills', i18n.language as 'az' | 'ru' | 'en');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 12, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={handleDiscard} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, marginLeft: 12, flex: 1 }, t.headingMedium]}>{tr('reviewCv.title')}</Text>
        </View>

        <Text style={[{ color: colors.textSecondary, marginBottom: 16 }, t.bodySmall]}>{tr('reviewCv.subtitle')}</Text>

        {/* Basics */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Input label={tr('candidate.jobTitle')} value={title} onChangeText={setTitle} placeholder={tr('profileCrud.experience.jobTitlePlaceholder')} />
          <Input
            label={tr('candidate.bio')}
            value={bio}
            onChangeText={setBio}
            placeholder={tr('candidate.description')}
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />

          <Text style={[{ color: colors.textPrimary, marginBottom: 8 }, t.labelSmall]}>{tr('candidate.skills')}</Text>
          <Input
            value={skillInput}
            onChangeText={setSkillInput}
            placeholder={tr('candidate.addSkill')}
            onSubmitEditing={addSkill}
            rightIcon={<Plus size={16} color={colors.primary} strokeWidth={2} />}
            onRightIconPress={addSkill}
          />
          <View style={styles.chipRow}>
            {skills.map((sk) => (
              <Chip key={sk} label={sk} selected onPress={() => setSkills((cur) => cur.filter((s) => s !== sk))} style={{ marginBottom: 6 }} />
            ))}
          </View>
          <SuggestionChips
            suggestions={skillSuggestions}
            query={skillInput}
            selected={skills}
            title={tr('common.suggestions')}
            onSelect={(v) => {
              setSkills((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
              setSkillInput('');
            }}
          />
        </View>

        {/* Experience */}
        {experience.length > 0 ? (
          <Text style={[{ color: colors.textPrimary, marginTop: 20, marginBottom: 10 }, t.labelMedium]}>{tr('candidate.experience_section')}</Text>
        ) : null}
        {experience.map((item) => (
          <View key={item.id} style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, marginBottom: 12 }]}>
            <View style={styles.cardHeader}>
              <Text style={[{ color: colors.textTertiary, flex: 1 }, t.caption]}>{tr('reviewCv.experienceItem')}</Text>
              <TouchableOpacity onPress={() => removeExperience(item.id)} style={styles.removeBtn} hitSlop={8}>
                <X size={16} color={colors.error} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Input label={tr('candidate.jobTitle')} value={item.jobTitle} onChangeText={(v) => updateExperience(item.id, { jobTitle: v })} placeholder={tr('profileCrud.experience.jobTitlePlaceholder')} />
            <SuggestionChips
              suggestions={jobTitleSuggestions}
              query={item.jobTitle}
              selected={item.jobTitle ? [item.jobTitle] : []}
              onSelect={(v) => updateExperience(item.id, { jobTitle: item.jobTitle === v ? '' : v })}
            />
            <Input label={tr('candidate.company')} value={item.company} onChangeText={(v) => updateExperience(item.id, { company: v })} placeholder={tr('profileCrud.experience.companyPlaceholder')} />
            <SuggestionChips
              suggestions={companySuggestions}
              query={item.company}
              selected={item.company ? [item.company] : []}
              onSelect={(v) => updateExperience(item.id, { company: item.company === v ? '' : v })}
            />
            <Input label={tr('candidate.location')} value={item.location} onChangeText={(v) => updateExperience(item.id, { location: v })} placeholder={tr('profileCrud.shared.locationPlaceholder')} />
            <DateField label={tr('candidate.startDate')} value={item.startDate} onChange={(v) => updateExperience(item.id, { startDate: v })} placeholder={tr('profileCrud.shared.selectDate')} maximumYear={new Date().getFullYear()} />
            {!item.isCurrent ? (
              <DateField label={tr('candidate.endDate')} value={item.endDate} onChange={(v) => updateExperience(item.id, { endDate: v })} placeholder={tr('profileCrud.shared.selectDate')} maximumYear={new Date().getFullYear()} />
            ) : null}
            <View style={styles.toggleRow}>
              <Chip label={tr('profileCrud.experience.currentStatus')} selected={item.isCurrent} onPress={() => updateExperience(item.id, { isCurrent: true, endDate: '' })} style={{ marginRight: 8 }} />
              <Chip label={tr('profileCrud.shared.completed')} selected={!item.isCurrent} onPress={() => updateExperience(item.id, { isCurrent: false })} />
            </View>
            <Input label={tr('candidate.description')} value={item.description} onChangeText={(v) => updateExperience(item.id, { description: v })} placeholder={tr('profileCrud.experience.descriptionPlaceholder')} multiline numberOfLines={4} style={{ minHeight: 90, textAlignVertical: 'top' }} />
          </View>
        ))}

        {/* Education */}
        {education.length > 0 ? (
          <Text style={[{ color: colors.textPrimary, marginTop: 20, marginBottom: 10 }, t.labelMedium]}>{tr('candidate.education')}</Text>
        ) : null}
        {education.map((item) => (
          <View key={item.id} style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, marginBottom: 12 }]}>
            <View style={styles.cardHeader}>
              <Text style={[{ color: colors.textTertiary, flex: 1 }, t.caption]}>{tr('reviewCv.educationItem')}</Text>
              <TouchableOpacity onPress={() => removeEducation(item.id)} style={styles.removeBtn} hitSlop={8}>
                <X size={16} color={colors.error} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Input label={tr('candidate.degree')} value={item.degree} onChangeText={(v) => updateEducation(item.id, { degree: v })} placeholder={tr('profileCrud.education.degreePlaceholder')} />
            <SuggestionChips
              suggestions={degreeSuggestions}
              query={item.degree}
              selected={item.degree ? [item.degree] : []}
              onSelect={(v) => updateEducation(item.id, { degree: item.degree === v ? '' : v })}
            />
            <Input label={tr('candidate.fieldOfStudy')} value={item.fieldOfStudy} onChangeText={(v) => updateEducation(item.id, { fieldOfStudy: v })} placeholder={tr('profileCrud.education.fieldOfStudyPlaceholder')} />
            <SuggestionChips
              suggestions={fieldSuggestions}
              query={item.fieldOfStudy}
              selected={item.fieldOfStudy ? [item.fieldOfStudy] : []}
              onSelect={(v) => updateEducation(item.id, { fieldOfStudy: item.fieldOfStudy === v ? '' : v })}
            />
            <Input label={tr('candidate.school')} value={item.institution} onChangeText={(v) => updateEducation(item.id, { institution: v })} placeholder={tr('profileCrud.education.institutionPlaceholder')} />
            <DateField label={tr('candidate.startDate')} value={item.startDate} onChange={(v) => updateEducation(item.id, { startDate: v })} placeholder={tr('profileCrud.shared.selectDate')} maximumYear={new Date().getFullYear()} />
            {!item.isCurrent ? (
              <DateField label={tr('candidate.endDate')} value={item.endDate} onChange={(v) => updateEducation(item.id, { endDate: v })} placeholder={tr('profileCrud.shared.selectDate')} maximumYear={new Date().getFullYear()} />
            ) : null}
            <View style={styles.toggleRow}>
              <Chip label={tr('profileCrud.education.currentStatus')} selected={item.isCurrent} onPress={() => updateEducation(item.id, { isCurrent: true, endDate: '' })} style={{ marginRight: 8 }} />
              <Chip label={tr('profileCrud.shared.completed')} selected={!item.isCurrent} onPress={() => updateEducation(item.id, { isCurrent: false })} />
            </View>
            <Input label={tr('candidate.description')} value={item.description} onChangeText={(v) => updateEducation(item.id, { description: v })} placeholder={tr('profileCrud.education.descriptionPlaceholder')} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          </View>
        ))}

        {/* Languages */}
        {languages.length > 0 ? (
          <Text style={[{ color: colors.textPrimary, marginTop: 20, marginBottom: 10 }, t.labelMedium]}>{tr('candidate.languages')}</Text>
        ) : null}
        {languages.map((item) => (
          <View key={item.id} style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, marginBottom: 12 }]}>
            <View style={styles.cardHeader}>
              <Text style={[{ color: colors.textTertiary, flex: 1 }, t.caption]}>{tr('reviewCv.languageItem')}</Text>
              <TouchableOpacity onPress={() => removeLanguage(item.id)} style={styles.removeBtn} hitSlop={8}>
                <X size={16} color={colors.error} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Input label={tr('profileCrud.language.languageLabel')} value={item.language} onChangeText={(v) => updateLanguage(item.id, { language: v })} placeholder={tr('profileCrud.language.languagePlaceholder')} />
            <SuggestionChips
              suggestions={langSuggestions}
              query={item.language}
              selected={item.language ? [item.language] : []}
              onSelect={(v) => updateLanguage(item.id, { language: item.language === v ? '' : v })}
            />
            <SelectField<LanguageLevel>
              label={tr('profileCrud.language.proficiencyLabel')}
              value={item.level}
              placeholder={tr('profileCrud.language.proficiencyPlaceholder')}
              options={levelOptions}
              onChange={(v) => updateLanguage(item.id, { level: v })}
            />
          </View>
        ))}

        <View style={{ marginTop: 20, gap: 10 }}>
          <Button title={tr('reviewCv.confirm')} onPress={handleConfirm} loading={updateProfile.isPending} size="lg" />
          <Button title={tr('reviewCv.discard')} onPress={handleDiscard} variant="ghost" size="md" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  removeBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});
