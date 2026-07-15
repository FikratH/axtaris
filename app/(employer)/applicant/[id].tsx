import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useEmployerApplications,
  useUpdateApplicationReview,
  useUpdateApplicationStatus,
} from '@/hooks/useEngagementQueries';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { ApplicationStatus } from '@/types/models';
import { fileStorageService } from '@/services/fileStorageService';
import { getLanguageLevelLabel } from '@/utils/labels';
import { safeBack } from '@/utils/navigation';
import { Briefcase, ChevronLeft, Download, Mail, MapPin } from 'lucide-react-native';

const statusVariant: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  reviewed: 'info',
  shortlisted: 'success',
  rejected: 'error',
  accepted: 'success',
};

function getStatusLabel(status: ApplicationStatus, tr: (key: string) => string) {
  const labels: Record<ApplicationStatus, string> = {
    pending: tr('employer.status.pending'),
    reviewed: tr('employer.status.reviewed'),
    shortlisted: tr('employer.status.shortlisted'),
    rejected: tr('employer.status.rejected'),
    accepted: tr('employer.status.accepted'),
  };

  return labels[status];
}

function formatDate(value?: string): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

export default function EmployerApplicantDetailScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const {
    data: applications = [],
    isLoading,
    isError,
    refetch,
  } = useEmployerApplications(user?.id);
  const updateStatus = useUpdateApplicationStatus(user?.id);
  const updateReview = useUpdateApplicationReview(user?.id);
  const [openingCv, setOpeningCv] = useState(false);
  const [employerNotes, setEmployerNotes] = useState('');
  const [employerRating, setEmployerRating] = useState<number | undefined>();
  const statusActions: { status: ApplicationStatus; label: string; variant: 'primary' | 'outline' | 'ghost' }[] = [
    { status: 'reviewed', label: tr('employer.markReviewed'), variant: 'ghost' },
    { status: 'shortlisted', label: tr('employer.shortlist'), variant: 'primary' },
    { status: 'accepted', label: tr('employer.accept'), variant: 'outline' },
    { status: 'rejected', label: tr('employer.reject'), variant: 'ghost' },
  ];

  const application = useMemo(
    () => applications.find((item) => item.id === id),
    [applications, id]
  );
  const candidate = application?.candidate;
  const candidateUser = candidate?.user;
  const cvUrl = application?.cvUrl || candidate?.cvUrl;

  useEffect(() => {
    setEmployerNotes(application?.employerNotes || '');
    setEmployerRating(application?.employerRating);
  }, [application?.id, application?.employerNotes, application?.employerRating]);

  const handleOpenCv = async () => {
    if (!cvUrl) {
      Alert.alert(tr('common.error'), tr('common.notAvailable'));
      return;
    }

    setOpeningCv(true);

    try {
      const resolvedUrl = await fileStorageService.resolveFileUrl(cvUrl);

      if (!resolvedUrl) {
        throw new Error(tr('common.notAvailable'));
      }

      const canOpen = await Linking.canOpenURL(resolvedUrl);

      if (!canOpen) {
        throw new Error(tr('common.error'));
      }

      await Linking.openURL(resolvedUrl);
    } catch (error) {
      Alert.alert(
        tr('common.error'),
        error instanceof Error ? error.message : tr('common.error')
      );
    } finally {
      setOpeningCv(false);
    }
  };

  const handleStatusChange = async (status: ApplicationStatus) => {
    if (!application) return;

    try {
      await updateStatus.mutateAsync({
        applicationId: application.id,
        status,
      });
    } catch (error: any) {
      Alert.alert(tr('common.error'), error?.message || tr('common.error'));
    }
  };

  const handleSaveReview = async () => {
    if (!application) return;

    try {
      await updateReview.mutateAsync({
        applicationId: application.id,
        employerNotes,
        employerRating,
      });
      Alert.alert(tr('common.done'));
    } catch (error: any) {
      Alert.alert(tr('common.error'), error?.message || tr('common.error'));
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 16, paddingHorizontal: s.xl }]}>
        <VacancyCardSkeleton />
      </View>
    );
  }

  if (isError || !application) {
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: s.xl, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => safeBack(router, '/(employer)/applicants')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}>
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[{ color: colors.textPrimary, marginLeft: s.md }, t.headingMedium]}>
          {tr('employer.candidateReview')}
        </Text>
      </View>

      <Card padding="lg">
        <View style={styles.profileHeader}>
          <Avatar uri={candidateUser?.avatarUrl} name={candidateUser?.fullName || tr('common.notAvailable')} size={64} />
          <View style={{ flex: 1, marginLeft: s.md }}>
            <Text style={[{ color: colors.textPrimary }, t.headingSmall]}>
              {candidateUser?.fullName || tr('common.notAvailable')}
            </Text>
            <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.bodySmall]}>
              {candidate?.title || tr('common.notAvailable')}
            </Text>
            <View style={{ marginTop: s.sm, alignSelf: 'flex-start' }}>
              <Badge label={getStatusLabel(application.status, tr)} variant={statusVariant[application.status]} />
            </View>
          </View>
        </View>

        <View style={[styles.metaRow, { marginTop: s.lg }]}>
          {candidate?.location ? (
            <View style={styles.metaItem}>
              <MapPin size={14} color={colors.textTertiary} strokeWidth={1.8} />
              <Text style={[{ color: colors.textSecondary, marginLeft: 6 }, t.caption]}>
                {candidate.location}
              </Text>
            </View>
          ) : null}
          {candidateUser?.email ? (
            <View style={styles.metaItem}>
              <Mail size={14} color={colors.textTertiary} strokeWidth={1.8} />
              <Text style={[{ color: colors.textSecondary, marginLeft: 6 }, t.caption]}>
                {candidateUser.email}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Briefcase size={14} color={colors.textTertiary} strokeWidth={1.8} />
            <Text style={[{ color: colors.textSecondary, marginLeft: 6 }, t.caption]}>
              {application.vacancy?.title || tr('common.notAvailable')}
            </Text>
          </View>
        </View>

        <Text style={[{ color: colors.textTertiary, marginTop: s.md }, t.caption]}>
          {tr('employer.appliedOn', { date: formatDate(application.appliedAt) })}
        </Text>
      </Card>

      <View style={[styles.actionsGrid, { marginTop: s.md }]}>
        {statusActions.map((action) => (
          <Button
            key={action.status}
            title={action.label}
            onPress={() => handleStatusChange(action.status)}
            variant={action.variant}
            size="sm"
            fullWidth={false}
            disabled={application.status === action.status || updateStatus.isPending}
            style={styles.actionButton}
          />
        ))}
      </View>

      {cvUrl ? (
        <View style={{ marginTop: s.md }}>
          <Button
            title={candidate?.cvFileName || tr('employer.download_cv')}
            onPress={handleOpenCv}
            loading={openingCv}
            variant="outline"
            icon={<Download size={16} color={colors.textPrimary} strokeWidth={1.8} />}
          />
        </View>
      ) : null}

      <Card padding="md" style={{ marginTop: s.md }}>
        <Text style={[{ color: colors.textPrimary, marginBottom: s.sm }, t.labelMedium]}>
          {tr('employer.reviewNotes')}
        </Text>
        <Text style={[{ color: colors.textTertiary, marginBottom: s.sm }, t.caption]}>
          {tr('employer.internalReviewOnly')}
        </Text>
        <View style={[styles.ratingRow, { marginBottom: s.md }]}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <Chip
              key={rating}
              label={`${rating}`}
              selected={employerRating === rating}
              onPress={() => setEmployerRating(employerRating === rating ? undefined : rating)}
              style={{ marginBottom: 6 }}
            />
          ))}
        </View>
        <Input
          label={tr('employer.notes')}
          value={employerNotes}
          onChangeText={setEmployerNotes}
          placeholder={tr('employer.notesPlaceholder')}
          multiline
          numberOfLines={4}
          style={{ minHeight: 96, textAlignVertical: 'top' }}
        />
        <Button
          title={tr('common.save')}
          onPress={handleSaveReview}
          loading={updateReview.isPending}
          variant="secondary"
          size="md"
        />
      </Card>

      {candidate?.bio ? (
        <Card padding="md" style={{ marginTop: s.md }}>
          <Text style={[{ color: colors.textPrimary }, t.labelMedium]}>{tr('candidate.bio')}</Text>
          <Text style={[{ color: colors.textSecondary, marginTop: s.sm, lineHeight: 22 }, t.bodySmall]}>
            {candidate.bio}
          </Text>
        </Card>
      ) : null}

      {candidate?.skills.length ? (
        <Card padding="md" style={{ marginTop: s.md }}>
          <Text style={[{ color: colors.textPrimary, marginBottom: s.sm }, t.labelMedium]}>
            {tr('candidate.skills')}
          </Text>
          <View style={styles.chipRow}>
            {candidate.skills.map((skill) => (
              <Chip key={skill} label={skill} style={{ marginBottom: 6 }} />
            ))}
          </View>
        </Card>
      ) : null}

      {candidate?.workExperience.length ? (
        <Card padding="md" style={{ marginTop: s.md }}>
          <Text style={[{ color: colors.textPrimary, marginBottom: s.sm }, t.labelMedium]}>
            {tr('candidate.experience_section')}
          </Text>
          {candidate.workExperience.map((item) => (
            <View key={item.id} style={[styles.timelineItem, { borderLeftColor: colors.divider }]}>
              <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{item.jobTitle}</Text>
              <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.caption]}>
                {item.company} · {item.startDate.slice(0, 7)} - {item.isCurrent ? tr('candidate.present') : item.endDate?.slice(0, 7)}
              </Text>
              {item.description ? (
                <Text style={[{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }, t.bodySmall]}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}

      {candidate?.education.length ? (
        <Card padding="md" style={{ marginTop: s.md }}>
          <Text style={[{ color: colors.textPrimary, marginBottom: s.sm }, t.labelMedium]}>
            {tr('candidate.education')}
          </Text>
          {candidate.education.map((item) => (
            <View key={item.id} style={[styles.timelineItem, { borderLeftColor: colors.divider }]}>
              <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{item.degree}</Text>
              <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.caption]}>
                {item.institution} · {item.startDate.slice(0, 7)} - {item.isCurrent ? tr('candidate.present') : item.endDate?.slice(0, 7)}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {candidate?.languages.length || candidate?.certifications.length ? (
        <Card padding="md" style={{ marginTop: s.md }}>
          {candidate.languages.length ? (
            <>
              <Text style={[{ color: colors.textPrimary, marginBottom: s.sm }, t.labelMedium]}>
                {tr('candidate.languages')}
              </Text>
              <View style={styles.chipRow}>
                {candidate.languages.map((item) => (
                  <Chip key={item.id} label={`${item.language} · ${getLanguageLevelLabel(tr, item.level)}`} style={{ marginBottom: 6 }} />
                ))}
              </View>
            </>
          ) : null}
          {candidate.certifications.length ? (
            <View style={{ marginTop: candidate.languages.length ? s.md : 0 }}>
              <Text style={[{ color: colors.textPrimary, marginBottom: s.sm }, t.labelMedium]}>
                {tr('candidate.certifications')}
              </Text>
              {candidate.certifications.map((item) => (
                <Text key={item.id} style={[{ color: colors.textSecondary, marginBottom: 6 }, t.bodySmall]}>
                  {item.name} · {item.issuer}
                </Text>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { flexGrow: 1 },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timelineItem: { borderLeftWidth: 2, paddingLeft: 10, marginTop: 10 },
});
