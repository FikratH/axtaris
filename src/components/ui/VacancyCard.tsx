import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Vacancy } from '@/types/models';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkCheck, MapPin, Clock, Users } from 'lucide-react-native';

interface VacancyCardProps {
  vacancy: Vacancy;
  onPress: () => void;
  onSave?: () => void;
  saved?: boolean;
  compact?: boolean;
}

const workTypeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  internship: 'Internship',
};

export function VacancyCard({ vacancy, onPress, onSave, saved, compact }: VacancyCardProps) {
  const { colors, radius: r, spacing: s, typography: t, isDark } = useTheme();
  const { t: tr } = useTranslation();

  const salary =
    vacancy.showSalary && vacancy.salaryMin
      ? `${vacancy.salaryMin}${vacancy.salaryMax ? ` - ${vacancy.salaryMax}` : '+'} ${vacancy.salaryCurrency || 'AZN'}`
      : null;

  const daysAgo = Math.max(
    1,
    Math.floor((Date.now() - new Date(vacancy.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          borderRadius: 14,
          padding: 14,
        },
      ]}
    >
      <View style={styles.header}>
        <Avatar name={vacancy.company?.name} size={40} />
        <View style={styles.headerText}>
          <Text style={[{ color: colors.textPrimary }, t.labelMedium]} numberOfLines={1}>
            {vacancy.title}
          </Text>
          <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]} numberOfLines={1}>
            {vacancy.company?.name}
          </Text>
        </View>
        {onSave && (
          <TouchableOpacity onPress={onSave} activeOpacity={0.6} style={styles.saveButton}>
            {saved
              ? <BookmarkCheck size={20} color={colors.primary} strokeWidth={1.8} />
              : <Bookmark size={20} color={colors.textTertiary} strokeWidth={1.8} />
            }
          </TouchableOpacity>
        )}
      </View>

      {!compact && (
        <View style={[styles.chipRow, { marginTop: 10 }]}>
          <Badge label={vacancy.city} variant="default" />
          <Badge
            label={workTypeLabels[vacancy.workType] || vacancy.workType}
            variant="info"
            style={{ marginLeft: 6 }}
          />
          {salary && (
            <Badge label={salary} variant="success" style={{ marginLeft: 6 }} />
          )}
        </View>
      )}

      <View style={[styles.footer, { marginTop: compact ? 8 : 10, paddingTop: compact ? 8 : 10, borderTopWidth: 1, borderTopColor: colors.divider }]}>
        <View style={styles.footerItem}>
          <Clock size={12} color={colors.textTertiary} strokeWidth={1.8} />
          <Text style={[{ color: colors.textTertiary, marginLeft: 4 }, t.caption]}>
            {tr('candidate.daysAgo', { count: daysAgo })}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Users size={12} color={colors.textTertiary} strokeWidth={1.8} />
          <Text style={[{ color: colors.textTertiary, marginLeft: 4 }, t.caption]}>
            {vacancy.applicantCount} {tr('candidate.applicants')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  saveButton: {
    padding: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
