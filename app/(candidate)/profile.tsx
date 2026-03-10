import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Bell, Settings, MapPin, Upload, Wand2, Briefcase, GraduationCap, Languages, Award, LogOut, ChevronRight } from 'lucide-react-native';

export default function CandidateProfileScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((st) => st.user);
  const signOut = useAuthStore((st) => st.signOut);
  const profile = useDataStore((s) => s.candidateProfile);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/role-select');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={isDark ? ['#111827', '#1A2544'] : ['#1B2E5A', '#2D4797']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <Text style={[{ color: '#FFFFFF' }, t.headingLarge]}>{tr('candidate.profile')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={styles.headerBtn}
            >
              <Bell size={18} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={[styles.headerBtn, { marginLeft: 8 }]}
            >
              <Settings size={18} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card — inside gradient for seamless look */}
        <View style={[styles.profileCardInner, { backgroundColor: colors.surface }]}>
          <View style={styles.profileHeader}>
            <Avatar name={user?.fullName} size={64} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[{ color: colors.textPrimary }, t.headingSmall]}>{user?.fullName}</Text>
              <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>{profile.title}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.textTertiary} strokeWidth={1.8} />
                <Text style={[{ color: colors.textTertiary, marginLeft: 4 }, t.caption]}>{profile.location}</Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
            <View style={styles.stat}>
              <Text style={[{ color: colors.primary }, t.headingSmall]}>{profile.profileCompleteness}%</Text>
              <Text style={[{ color: colors.textTertiary }, t.caption]}>{tr('candidate.profileCompletion')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.stat}>
              <Text style={[{ color: colors.accent }, t.headingSmall]}>{profile.skills.length}</Text>
              <Text style={[{ color: colors.textTertiary }, t.caption]}>{tr('candidate.skills')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.stat}>
              <Text style={[{ color: colors.success }, t.headingSmall]}>{profile.workExperience.length}</Text>
              <Text style={[{ color: colors.textTertiary }, t.caption]}>{tr('candidate.experience_section')}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── Action Buttons ── */}
      <View style={styles.actionRow}>
        <Button title={tr('candidate.editProfile')} onPress={() => router.push('/profile/edit')} variant="primary" size="md" />
        <View style={styles.actionRowInner}>
          <View style={{ flex: 1 }}>
            <Button
              title={tr('candidate.uploadCV')}
              onPress={() => router.push('/profile/upload-cv')}
              variant="outline"
              size="md"
              icon={<Upload size={15} color={colors.textPrimary} strokeWidth={1.8} />}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Button
              title={tr('candidate.aiAssistant')}
              onPress={() => router.push('/profile/ai-assistant')}
              variant="secondary"
              size="md"
              icon={<Wand2 size={15} color={colors.primary} strokeWidth={1.8} />}
            />
          </View>
        </View>
      </View>

      {/* ── Bio ── */}
      {profile.bio && (
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[{ color: colors.textPrimary, marginBottom: 8 }, t.labelMedium]}>Bio</Text>
          <Text style={[{ color: colors.textSecondary, lineHeight: 22 }, t.bodyMedium]}>{profile.bio}</Text>
        </View>
      )}

      {/* ── Skills ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Text style={[{ color: colors.textPrimary, marginBottom: 10 }, t.labelMedium]}>{tr('candidate.skills')}</Text>
        <View style={styles.chipGrid}>
          {profile.skills.map((skill) => (
            <Chip key={skill} label={skill} style={{ marginBottom: 6 }} />
          ))}
        </View>
      </View>

      {/* ── Experience ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionTitleRow}>
          <Briefcase size={16} color={colors.primary} strokeWidth={1.8} />
          <Text style={[{ color: colors.textPrimary, marginLeft: 8 }, t.labelMedium]}>{tr('candidate.experience_section')}</Text>
        </View>
        {profile.workExperience.map((exp, i) => (
          <View key={exp.id} style={[styles.listItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
            <View style={[styles.listItemDot, { backgroundColor: colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{exp.jobTitle}</Text>
              <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>{exp.company}</Text>
              <Text style={[{ color: colors.textTertiary, marginTop: 3 }, t.caption]}>
                {exp.startDate.slice(0, 7)} — {exp.isCurrent ? tr('candidate.present') : exp.endDate?.slice(0, 7)}
              </Text>
              {exp.description && (
                <Text style={[{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }, t.bodySmall]}>{exp.description}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* ── Education ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionTitleRow}>
          <GraduationCap size={16} color={colors.accent} strokeWidth={1.8} />
          <Text style={[{ color: colors.textPrimary, marginLeft: 8 }, t.labelMedium]}>{tr('candidate.education')}</Text>
        </View>
        {profile.education.map((edu) => (
          <View key={edu.id} style={styles.listItem}>
            <View style={[styles.listItemDot, { backgroundColor: colors.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{edu.degree} — {edu.fieldOfStudy}</Text>
              <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>{edu.institution}</Text>
              <Text style={[{ color: colors.textTertiary, marginTop: 3 }, t.caption]}>
                {edu.startDate.slice(0, 7)} — {edu.isCurrent ? tr('candidate.present') : edu.endDate?.slice(0, 7)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Languages ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionTitleRow}>
          <Languages size={16} color={colors.info} strokeWidth={1.8} />
          <Text style={[{ color: colors.textPrimary, marginLeft: 8 }, t.labelMedium]}>{tr('candidate.languages')}</Text>
        </View>
        <View style={[styles.chipGrid, { marginTop: 4 }]}>
          {profile.languages.map((lang) => (
            <Badge key={lang.id} label={`${lang.language} · ${lang.level}`} variant="info" style={{ marginBottom: 6, marginRight: 6 }} />
          ))}
        </View>
      </View>

      {/* ── Certifications ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionTitleRow}>
          <Award size={16} color={colors.warning} strokeWidth={1.8} />
          <Text style={[{ color: colors.textPrimary, marginLeft: 8 }, t.labelMedium]}>{tr('candidate.certifications')}</Text>
        </View>
        {profile.certifications.map((cert) => (
          <View key={cert.id} style={styles.listItem}>
            <View style={[styles.listItemDot, { backgroundColor: colors.warning }]} />
            <View style={{ flex: 1 }}>
              <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{cert.name}</Text>
              <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>{cert.issuer}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Sign Out ── */}
      <TouchableOpacity
        onPress={handleSignOut}
        activeOpacity={0.7}
        style={[styles.signOutBtn, { borderColor: colors.error + '30' }]}
      >
        <LogOut size={18} color={colors.error} strokeWidth={1.8} />
        <Text style={[{ color: colors.error, marginLeft: 10 }, t.labelMedium]}>{tr('settings.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: { flexDirection: 'row' },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardInner: {
    borderRadius: 16,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  stat: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, alignSelf: 'stretch' },
  actionRow: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  actionRowInner: { flexDirection: 'row' },
  sectionCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  listItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
});
