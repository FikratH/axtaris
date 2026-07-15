import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeContext';
import { Vacancy, WorkType } from '@/types/models';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { MatchBadge } from './MatchBadge';
import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkCheck, MapPin, Clock, Users } from 'lucide-react-native';

interface VacancyCardProps {
  vacancy: Vacancy;
  onPress: () => void;
  onSave?: () => void;
  saved?: boolean;
  compact?: boolean;
  matchScore?: number;
  applied?: boolean;
}

const workTypeTranslationKeys: Record<WorkType, string> = {
  full_time: 'candidate.fullTime',
  part_time: 'candidate.partTime',
  remote: 'candidate.remote',
  hybrid: 'candidate.hybrid',
  onsite: 'candidate.onsite',
  internship: 'candidate.internship',
};

function AnimatedSaveButton({
  saved,
  onPress,
  colors,
}: {
  saved?: boolean;
  onPress: () => void;
  colors: Record<string, string>;
}) {
  const scale = useSharedValue(1);
  const prevSaved = React.useRef(saved);

  useEffect(() => {
    if (prevSaved.current !== saved) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      prevSaved.current = saved;
    }
  }, [saved]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={styles.saveButton}>
      <Animated.View style={animatedStyle}>
        {saved ? (
          <BookmarkCheck size={20} color={colors.primary} strokeWidth={1.8} />
        ) : (
          <Bookmark size={20} color={colors.textTertiary} strokeWidth={1.8} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function VacancyCard({ vacancy, onPress, onSave, saved, compact, matchScore, applied }: VacancyCardProps) {
  const { colors, radius: r, spacing: s, typography: t, elevation: e, isDark } = useTheme();
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
          borderRadius: r.lg,
          padding: 14,
          ...(!isDark ? e.sm : {}),
        },
      ]}
    >
      <View style={styles.header}>
        <Avatar uri={vacancy.company?.logoUrl} name={vacancy.company?.name} size={40} />
        <View style={styles.headerText}>
          <Text style={[{ color: colors.textPrimary }, t.labelMedium]} numberOfLines={1}>
            {vacancy.title}
          </Text>
          <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]} numberOfLines={1}>
            {vacancy.company?.name}
          </Text>
          {matchScore !== undefined && <MatchBadge score={matchScore} style={{ marginTop: 6 }} />}
        </View>
        {applied && (
          <View style={[styles.appliedPill, { backgroundColor: colors.successLight, marginRight: onSave ? 8 : 0 }]}>
            <Text style={[{ color: colors.success }, t.caption]}>{tr('candidate.applied')}</Text>
          </View>
        )}
        {onSave && (
          <AnimatedSaveButton saved={saved} onPress={onSave} colors={colors} />
        )}
      </View>

      {!compact && (
        <View style={[styles.chipRow, { marginTop: 10 }]}>
          <Badge label={vacancy.city} variant="default" />
          <Badge label={tr(workTypeTranslationKeys[vacancy.workType])} variant="info" />
          {salary && <Badge label={salary} variant="success" />}
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
    gap: 6,
  },
  appliedPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
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
