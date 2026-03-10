import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/store/dataStore';
import { mockCandidateProfile, mockUser } from '@/services/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Application, ApplicationStatus } from '@/types/models';
import { Users as UsersIcon } from 'lucide-react-native';

const statusVariant: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  reviewed: 'info',
  shortlisted: 'success',
  rejected: 'error',
  accepted: 'success',
};

export default function ApplicantsScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const allApplications = useDataStore((s) => s.applications);
  const updateStatus = useDataStore((s) => s.updateApplicationStatus);
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');

  const filters: { key: 'all' | ApplicationStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: tr('employer.pendingReview') },
    { key: 'shortlisted', label: tr('employer.shortlisted') },
    { key: 'rejected', label: tr('employer.rejected') },
  ];

  const enrichedApps = allApplications.map((app) => ({
    ...app,
    candidate: { ...mockCandidateProfile, user: mockUser },
  }));

  const filtered = filter === 'all'
    ? enrichedApps
    : enrichedApps.filter((a) => a.status === filter);

  const renderApplicant = ({ item }: { item: typeof enrichedApps[0] }) => (
    <Card padding="md" style={{ marginBottom: 10 }}>
      <View style={styles.applicantRow}>
        <Avatar name={item.candidate.user?.fullName} size={48} />
        <View style={[styles.applicantInfo, { marginLeft: s.md }]}>
          <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]} numberOfLines={1}>
            {item.candidate.user?.fullName}
          </Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: 2 }]} numberOfLines={1}>
            {item.candidate.title}
          </Text>
          <Text style={[{ color: colors.textTertiary, ...t.caption, marginTop: 2 }]} numberOfLines={1}>
            {item.vacancy?.title}
          </Text>
        </View>
        <Badge
          label={item.status}
          variant={statusVariant[item.status]}
        />
      </View>

      <View style={[styles.skillsRow, { marginTop: s.md }]}>
        {item.candidate.skills.slice(0, 3).map((sk) => (
          <Chip key={sk} label={sk} style={{ marginRight: 6 }} />
        ))}
        {item.candidate.skills.length > 3 && (
          <Text style={[{ color: colors.textTertiary, ...t.caption, alignSelf: 'center' }]}>
            +{item.candidate.skills.length - 3}
          </Text>
        )}
      </View>

      <View style={[styles.actionRow, { marginTop: s.md, gap: 8 }]}>
        <View style={{ flex: 1 }}>
          <Button
            title={tr('employer.shortlist')}
            onPress={() => updateStatus(item.id, 'shortlisted')}
            variant="primary"
            size="sm"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title={tr('employer.reject')}
            onPress={() => updateStatus(item.id, 'rejected')}
            variant="outline"
            size="sm"
          />
        </View>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={[styles.header, { paddingHorizontal: s.xl }]}>
        <Text style={[{ color: colors.textPrimary, ...t.headingLarge }]}>
          {tr('employer.applicants')}
        </Text>
        <View style={[styles.filterRow, { marginTop: s.md, gap: 8 }]}>
          {filters.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        contentContainerStyle={{ paddingHorizontal: s.xl, paddingTop: s.lg, paddingBottom: 24 }}
        renderItem={renderApplicant}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title={tr('employer.noApplicants')}
            subtitle={tr('employer.noApplicantsDesc')}
            icon={<UsersIcon size={48} color={colors.textTertiary} strokeWidth={1.2} />}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 4 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap' },
  applicantRow: { flexDirection: 'row', alignItems: 'center' },
  applicantInfo: { flex: 1 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  actionRow: { flexDirection: 'row' },
});
