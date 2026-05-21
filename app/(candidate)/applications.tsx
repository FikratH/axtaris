import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useCandidateApplications } from '@/hooks/useCandidateVacancyActions';
import { useCandidateSubscriptionSummary } from '@/hooks/useSubscriptionQueries';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { VacancyCardSkeleton } from '@/components/ui/SkeletonLoader';
import { Application, ApplicationStatus } from '@/types/models';
import {
  getApplicationsUpsellBody,
  getApplicationsUpsellTitle,
  getSubscriptionActionLabel,
  getSubscriptionPlanLabel,
  getSubscriptionSummaryLine,
} from '@/utils/subscriptionPresentation';
import { FileText, Sparkles } from 'lucide-react-native';

const statusVariant: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  reviewed: 'info',
  shortlisted: 'success',
  rejected: 'error',
  accepted: 'success',
};

export default function ApplicationsScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    data: applications = [],
    isLoading,
    isError,
    refetch,
  } = useCandidateApplications(user?.id);
  const { data: subscriptionSummary } = useCandidateSubscriptionSummary(user?.id);

  const getStatusLabel = (status: ApplicationStatus) => {
    const labels: Record<ApplicationStatus, string> = {
      pending: tr('candidate.pending'),
      reviewed: tr('candidate.reviewed'),
      shortlisted: tr('candidate.shortlisted'),
      rejected: tr('candidate.rejected'),
      accepted: tr('candidate.accepted'),
    };
    return labels[status];
  };

  const renderApplication = ({ item }: { item: Application }) => {
    const daysAgo = Math.max(
      1,
      Math.floor((Date.now() - new Date(item.appliedAt).getTime()) / (1000 * 60 * 60 * 24))
    );

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/vacancy/[id]', params: { id: item.vacancyId } })}
        style={[
          styles.applicationCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderRadius: r.lg,
            padding: s.lg,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Avatar uri={item.vacancy?.company?.logoUrl} name={item.vacancy?.company?.name} size={42} />
          <View style={[styles.cardHeaderText, { marginLeft: s.md }]}> 
            <Text
              style={[{ color: colors.textPrimary, ...t.labelMedium }]}
              numberOfLines={1}
            >
              {item.vacancy?.title}
            </Text>
            <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: 2 }]}>
              {item.vacancy?.company?.name}
            </Text>
          </View>
        </View>

        <View style={[styles.cardFooter, { marginTop: s.md }]}>
          <Badge
            label={getStatusLabel(item.status)}
            variant={statusVariant[item.status]}
          />
          <Text style={[{ color: colors.textTertiary, ...t.caption }]}>
            {tr('candidate.daysAgo', { count: daysAgo })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={[styles.header, { paddingHorizontal: s.xl }]}> 
        <Text style={[{ color: colors.textPrimary, ...t.headingLarge }]}> 
          {tr('candidate.applications')}
        </Text>
        <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: s.xs }]}> 
          {applications.length} {tr('candidate.applications').toLowerCase()}
        </Text>
      </View>

      {subscriptionSummary ? (
        <View style={{ paddingHorizontal: s.xl, paddingTop: s.lg }}>
          <Card padding="lg" style={{ borderWidth: 1, borderColor: colors.cardBorder }}>
            <View style={styles.upsellHeader}>
              <View style={[styles.upsellIcon, { backgroundColor: colors.primaryLight, borderRadius: r.full }]}>
                <Sparkles size={18} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, marginLeft: s.md }}>
                <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>
                  {getApplicationsUpsellTitle(tr, subscriptionSummary.subscription.plan)}
                </Text>
                <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.bodySmall]}>
                  {getApplicationsUpsellBody(tr, subscriptionSummary.subscription.plan)}
                </Text>
              </View>
            </View>

            <View style={[styles.upsellMeta, { marginTop: s.md, backgroundColor: colors.surfaceSecondary, borderRadius: r.lg }]}> 
              <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>
                {getSubscriptionPlanLabel(tr, subscriptionSummary.subscription.plan)}
              </Text>
              <Text style={[{ color: colors.textSecondary, marginTop: 4 }, t.caption]}>
                {getSubscriptionSummaryLine(tr, subscriptionSummary)}
              </Text>
            </View>

            <View style={{ marginTop: s.md }}>
              <Button
                title={getSubscriptionActionLabel(tr, subscriptionSummary.subscription.plan)}
                onPress={() => router.push('/subscription' as never)}
                variant={subscriptionSummary.subscription.plan === 'free' ? 'primary' : 'outline'}
                size="md"
              />
            </View>
          </Card>
        </View>
      ) : null}

      <FlatList
        data={applications}
        contentContainerStyle={{ paddingHorizontal: s.xl, paddingTop: s.lg, paddingBottom: 24 }}
        renderItem={renderApplication}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View>
              {Array.from({ length: 3 }).map((_, index) => (
                <VacancyCardSkeleton key={index} />
              ))}
            </View>
          ) : isError ? (
            <EmptyState
              title={tr('common.error')}
              subtitle={tr('common.retry')}
              icon={<FileText size={48} color={colors.textTertiary} strokeWidth={1.2} />}
              actionTitle={tr('common.retry')}
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              title={tr('candidate.noApplications')}
              subtitle={tr('candidate.noApplicationsDesc')}
              icon={<FileText size={48} color={colors.textTertiary} strokeWidth={1.2} />}
              actionTitle={tr('candidate.search')}
              onAction={() => router.push('/(candidate)/search')}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 4,
  },
  applicationCard: {
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upsellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upsellIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upsellMeta: {
    padding: 12,
  },
});
