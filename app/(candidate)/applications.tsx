import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/store/dataStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Application, ApplicationStatus } from '@/types/models';
import { FileText } from 'lucide-react-native';

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
  const applications = useDataStore((s) => s.applications);

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
          <Avatar name={item.vacancy?.company?.name} size={42} />
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

      <FlatList
        data={applications}
        contentContainerStyle={{ paddingHorizontal: s.xl, paddingTop: s.lg, paddingBottom: 24 }}
        renderItem={renderApplication}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title={tr('candidate.noApplications')}
            subtitle={tr('candidate.noApplicationsDesc')}
            icon={<FileText size={48} color={colors.textTertiary} strokeWidth={1.2} />}
            actionTitle={tr('candidate.search')}
            onAction={() => router.push('/(candidate)/search')}
          />
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
});
