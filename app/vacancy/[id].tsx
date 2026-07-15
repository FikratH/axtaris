import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Alert } from '@/utils/dialog';
import { Input } from '@/components/ui/Input';
import { ScreeningAnswer } from '@/types/models';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useApplyToVacancy,
  useCandidateApplications,
  useCandidateProfile,
  useSavedJobIds,
  useToggleSavedJob,
} from '@/hooks/useCandidateVacancyActions';
import { useCandidateSubscriptionSummary } from '@/hooks/useSubscriptionQueries';
import { useVacancy } from '@/hooks/useVacancyQueries';
import { useGuestGate } from '@/hooks/useGuestGate';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import {
  getSubscriptionPlanLabel,
  getSubscriptionSummaryLine,
} from '@/utils/subscriptionPresentation';
import { safeBack } from '@/utils/navigation';
import { getWorkTypeLabel, getExperienceLevelLabel } from '@/utils/labels';
import { computeJobMatch } from '@/utils/jobMatch';
import { aiService } from '@/services/aiService';
import { MatchBadge } from '@/components/ui/MatchBadge';
import { ChevronLeft, Bookmark, BookmarkCheck, MapPin, Briefcase, BarChart3, Banknote, CheckCircle2, BadgeCheck, Star, Languages as LanguagesIcon } from 'lucide-react-native';

export default function VacancyDetailScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const isEmployer = user?.role === 'employer';
  const { data: savedJobIds = [] } = useSavedJobIds(user?.id);
  const toggleSave = useToggleSavedJob(user?.id);
  const { data: applications = [] } = useCandidateApplications(user?.id);
  const { data: subscriptionSummary } = useCandidateSubscriptionSummary(user?.id);
  const { data: profile } = useCandidateProfile(isEmployer ? undefined : user?.id);
  const applyToVacancy = useApplyToVacancy(user?.id);
  const { requireAuth } = useGuestGate();
  const {
    data: vacancy,
    isLoading,
    isError,
    refetch,
  } = useVacancy(id);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showTranslation, setShowTranslation] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState<{
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
  } | null>(null);

  const applied = applications.some((application) => application.vacancyId === (id || ''));
  const saved = savedJobIds.includes(id || '');

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 16,
            paddingHorizontal: s.xl,
          },
        ]}
      >
        <VacancyCardSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <EmptyState
          title={tr('common.error')}
          subtitle={tr('common.retry')}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  if (!vacancy) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <EmptyState
          title={tr('common.error')}
          subtitle={tr('common.noResults')}
        />
      </View>
    );
  }

  const currency = vacancy.salaryCurrency || 'AZN';
  const salary =
    vacancy.showSalary && (vacancy.salaryMin || vacancy.salaryMax)
      ? vacancy.salaryMin && vacancy.salaryMax
        ? `${vacancy.salaryMin} - ${vacancy.salaryMax} ${currency}`
        : vacancy.salaryMin
        ? `${vacancy.salaryMin}+ ${currency}`
        : `≤ ${vacancy.salaryMax} ${currency}`
      : null;

  const jobMatch = !isEmployer && profile ? computeJobMatch(profile, vacancy) : null;

  const submitApplication = async (screeningAnswers: ScreeningAnswer[]) => {
    if (!id) return;
    try {
      await applyToVacancy.mutateAsync({ vacancyId: id, answers: screeningAnswers });
      setShowApplyModal(false);
      Alert.alert(tr('candidate.applied'));
    } catch (error: any) {
      Alert.alert(tr('common.error'), error?.message || tr('common.error'));
    }
  };

  const handleApply = async () => {
    if (!id || !requireAuth()) return;

    if (vacancy.screeningQuestions && vacancy.screeningQuestions.length > 0) {
      setAnswers({});
      setShowApplyModal(true);
      return;
    }

    await submitApplication([]);
  };

  const handleSubmitAnswers = () => {
    const questions = vacancy.screeningQuestions || [];
    const missing = questions.find((q) => q.required && !(answers[q.id] || '').trim());
    if (missing) {
      Alert.alert(tr('common.error'), tr('apply.answerRequired'));
      return;
    }
    const screeningAnswers: ScreeningAnswer[] = questions.map((q) => ({
      question: q.question,
      answer: (answers[q.id] || '').trim(),
    }));
    void submitApplication(screeningAnswers);
  };

  const targetLanguageName =
    i18n.language === 'az' ? 'Azerbaijani' : i18n.language === 'ru' ? 'Russian' : 'English';

  const handleTranslate = async () => {
    if (translation) {
      setShowTranslation((v) => !v);
      return;
    }
    setTranslating(true);
    try {
      const [d, req, resp] = await Promise.all([
        aiService.translateText(vacancy.description, targetLanguageName),
        aiService.translateText(vacancy.requirements.join('\n'), targetLanguageName),
        aiService.translateText(vacancy.responsibilities.join('\n'), targetLanguageName),
      ]);
      if (!d && !req && !resp) {
        Alert.alert(tr('ai.translateUnavailable'));
        return;
      }
      setTranslation({
        description: d || undefined,
        requirements: req ? req.split('\n').map((x) => x.trim()).filter(Boolean) : undefined,
        responsibilities: resp ? resp.split('\n').map((x) => x.trim()).filter(Boolean) : undefined,
      });
      setShowTranslation(true);
    } catch {
      Alert.alert(tr('common.error'));
    } finally {
      setTranslating(false);
    }
  };

  const descriptionText =
    showTranslation && translation?.description ? translation.description : vacancy.description;
  const requirementsList =
    showTranslation && translation?.requirements ? translation.requirements : vacancy.requirements;
  const responsibilitiesList =
    showTranslation && translation?.responsibilities
      ? translation.responsibilities
      : vacancy.responsibilities;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: s.xl }]}>
          <TouchableOpacity
            onPress={() => safeBack(router, isEmployer ? '/(employer)/vacancies' : '/(candidate)/search')}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
          >
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (requireAuth() && id) toggleSave.mutate(id);
            }}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
          >
            {saved
              ? <BookmarkCheck size={20} color={colors.primary} strokeWidth={1.8} />
              : <Bookmark size={20} color={colors.textTertiary} strokeWidth={1.8} />
            }
          </TouchableOpacity>
        </View>

        <View style={[styles.companySection, { paddingHorizontal: s.xl, marginTop: s.xl }]}> 
          <Avatar uri={vacancy.company?.logoUrl} name={vacancy.company?.name} size={56} />
          <Text style={[{ color: colors.textPrimary, ...t.displaySmall, marginTop: s.lg }]}> 
            {vacancy.title}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!vacancy.company?.id}
            onPress={() =>
              vacancy.company?.id &&
              router.push({ pathname: '/company/[id]', params: { id: vacancy.company.id } } as never)
            }
            style={[styles.companyRow, { marginTop: s.sm }]}
          >
            <Text style={[{ color: colors.primary, ...t.labelMedium }]}>
              {vacancy.company?.name}
            </Text>
            {vacancy.company?.verificationStatus === 'verified' && (
              <BadgeCheck size={16} color={colors.primary} strokeWidth={1.8} style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.metaSection, { paddingHorizontal: s.xl, marginTop: s.xl }]}>
          <View style={styles.metaRow}>
            <View style={[styles.metaItem, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md, padding: s.md }]}>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('candidate.location')}</Text>
              <Text style={[{ color: colors.textPrimary, ...t.labelSmall, marginTop: 2 }]}>{vacancy.city}</Text>
            </View>
            <View style={[styles.metaItem, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md, padding: s.md, marginLeft: s.sm }]}>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('candidate.jobType')}</Text>
              <Text style={[{ color: colors.textPrimary, ...t.labelSmall, marginTop: 2 }]}>{getWorkTypeLabel(tr, vacancy.workType)}</Text>
            </View>
          </View>
          <View style={[styles.metaRow, { marginTop: s.sm }]}>
            <View style={[styles.metaItem, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md, padding: s.md }]}>
              <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('candidate.experience')}</Text>
              <Text style={[{ color: colors.textPrimary, ...t.labelSmall, marginTop: 2 }]}>{getExperienceLevelLabel(tr, vacancy.experienceLevel)}</Text>
            </View>
            {salary && (
              <View style={[styles.metaItem, { backgroundColor: colors.successLight, borderRadius: r.md, padding: s.md, marginLeft: s.sm }]}>
                <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('candidate.salary')}</Text>
                <Text style={[{ color: colors.success, ...t.labelSmall, marginTop: 2 }]}>{salary}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.statsBar, { paddingHorizontal: s.xl, marginTop: s.xl }]}>
          <View style={styles.statItem}>
            <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{vacancy.applicantCount}</Text>
            <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('candidate.applicants')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{vacancy.viewCount}</Text>
            <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.views')}</Text>
          </View>
          {vacancy.responseRate && (
            <>
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.statItem}>
                <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{vacancy.responseRate}%</Text>
                <Text style={[{ color: colors.textTertiary, ...t.caption }]}>{tr('employer.responses')}</Text>
              </View>
            </>
          )}
        </View>

        {jobMatch && jobMatch.score >= 40 && jobMatch.reasons.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: r.lg, padding: s.lg }}>
              <View style={styles.matchHeader}>
                <Text style={[{ color: colors.textPrimary }, t.headingSmall]}>{tr('match.title')}</Text>
                <MatchBadge score={jobMatch.score} minScore={0} />
              </View>
              <View style={{ marginTop: s.md, gap: 8 }}>
                {jobMatch.reasons.map((reason) => (
                  <View key={reason} style={styles.matchReason}>
                    <CheckCircle2 size={15} color={colors.success} strokeWidth={2} />
                    <Text style={[{ color: colors.textSecondary, marginLeft: 8, flex: 1 }, t.bodySmall]}>
                      {tr(`match.reasons.${reason}`, { count: jobMatch.matchedSkills.length })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[{ color: colors.textPrimary, ...t.headingSmall }]}>
              {tr('candidate.description')}
            </Text>
            <TouchableOpacity
              onPress={handleTranslate}
              disabled={translating}
              activeOpacity={0.7}
              style={[styles.translateBtn, { backgroundColor: colors.primaryLight, borderRadius: r.sm }]}
            >
              {translating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <LanguagesIcon size={14} color={colors.primary} strokeWidth={2} />
              )}
              <Text style={[{ color: colors.primary, marginLeft: 6 }, t.caption]}>
                {showTranslation ? tr('ai.showOriginal') : tr('ai.translate')}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, lineHeight: 24, marginTop: s.md }]}>
            {descriptionText}
          </Text>
        </View>

        <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
          <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.md }]}>
            {tr('candidate.requirements')}
          </Text>
          {requirementsList.map((req, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={[{ color: colors.primary, ...t.bodyMedium }]}>•</Text>
              <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginLeft: s.sm, flex: 1 }]}>
                {req}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
          <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.md }]}>
            {tr('candidate.responsibilities')}
          </Text>
          {responsibilitiesList.map((resp, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={[{ color: colors.primary, ...t.bodyMedium }]}>•</Text>
              <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginLeft: s.sm, flex: 1 }]}>
                {resp}
              </Text>
            </View>
          ))}
        </View>

        {vacancy.benefits.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
            <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.md }]}>
              {tr('candidate.benefits')}
            </Text>
            {vacancy.benefits.map((ben, i) => (
              <View key={i} style={styles.bulletItem}>
                <CheckCircle2 size={14} color={colors.success} strokeWidth={2} />
                <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginLeft: s.sm, flex: 1 }]}>
                  {ben}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
          <Text style={[{ color: colors.textPrimary, ...t.headingSmall, marginBottom: s.md }]}>
            {tr('candidate.skills')}
          </Text>
          <View style={styles.chipGrid}>
            {vacancy.skills.map((skill) => (
              <Chip key={skill} label={skill} style={{ marginBottom: 6 }} />
            ))}
          </View>
        </View>

        {vacancy.company && (
          <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
            <Text style={[{ color: colors.textSecondary, marginTop: s.sm, marginBottom: s.md }, t.bodySmall]}> 
              {tr('candidate.aboutCompany')}
            </Text>
            <View style={[styles.companyCard, { backgroundColor: colors.surfaceSecondary, borderRadius: r.lg, padding: s.lg }]}> 
              <View style={styles.companyCardHeader}>
                <Avatar uri={vacancy.company.logoUrl} name={vacancy.company.name} size={44} />
                <View style={{ marginLeft: s.md, flex: 1 }}>
                  <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{vacancy.company.name}</Text>
                  <Text style={[{ color: colors.textSecondary, ...t.caption }]}>{vacancy.company.industry}</Text>
                </View>
                {vacancy.company.rating && (
                  <Badge label={`${vacancy.company.rating}`} variant="success" />
                )}
              </View>
              {vacancy.company.description && (
                <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: s.md, lineHeight: 20 }]}>
                  {vacancy.company.description}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.divider,
            paddingBottom: insets.bottom + 12,
            paddingHorizontal: s.xl,
          },
        ]}
      >
        {isEmployer ? (
          <Button
            title={tr('employer.viewApplicants')}
            onPress={() => router.push('/(employer)/applicants')}
            size="lg"
          />
        ) : (
          <View>
            {subscriptionSummary ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/subscription' as never)}
                style={[styles.subscriptionHint, { backgroundColor: colors.backgroundSecondary, borderColor: colors.divider, borderRadius: r.lg, marginBottom: s.md }]}
              >
                <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>
                  {getSubscriptionPlanLabel(tr, subscriptionSummary.subscription.plan)}
                </Text>
                <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.caption]}>
                  {getSubscriptionSummaryLine(tr, subscriptionSummary)}
                </Text>
              </TouchableOpacity>
            ) : null}
            <Button
              title={applied ? tr('candidate.applied') : tr('candidate.applyNow')}
              onPress={handleApply}
              disabled={applied || applyToVacancy.isPending}
              loading={applyToVacancy.isPending}
              size="lg"
              variant={applied ? 'secondary' : 'primary'}
            />
          </View>
        )}
      </View>

      <Modal visible={showApplyModal} transparent animationType="slide" onRequestClose={() => setShowApplyModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[{ color: colors.textPrimary, marginBottom: 4 }, t.headingSmall]}>{tr('apply.answerQuestions')}</Text>
            <Text style={[{ color: colors.textTertiary, marginBottom: 12 }, t.caption]}>{tr('apply.answerQuestionsHint')}</Text>
            <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {(vacancy.screeningQuestions || []).map((q, idx) => (
                <View key={q.id} style={{ marginBottom: 12 }}>
                  <Input
                    label={`${idx + 1}. ${q.question}${q.required ? ' *' : ''}`}
                    value={answers[q.id] || ''}
                    onChangeText={(v) => setAnswers((cur) => ({ ...cur, [q.id]: v }))}
                    placeholder={tr('apply.yourAnswer')}
                    multiline
                    numberOfLines={2}
                    style={{ minHeight: 56, textAlignVertical: 'top' }}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={{ gap: 10, marginTop: 8 }}>
              <Button title={tr('candidate.applyNow')} onPress={handleSubmitAnswers} loading={applyToVacancy.isPending} size="lg" />
              <Button title={tr('common.cancel')} onPress={() => setShowApplyModal(false)} variant="ghost" size="md" />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companySection: {
    alignItems: 'center',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaSection: {},
  metaRow: {
    flexDirection: 'row',
  },
  metaItem: {
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  section: {},
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchReason: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  companyCard: {},
  companyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  subscriptionHint: {
    borderWidth: 1,
    padding: 12,
  },
});
