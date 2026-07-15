import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { Alert } from '@/utils/dialog';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useCandidateProfile,
  useUpdateCandidateProfile,
} from '@/hooks/useCandidateVacancyActions';
import { removeListItem } from '@/utils/profileSections';
import { getLanguageLevelLabel } from '@/utils/labels';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SubscriptionPill } from '@/components/ui/SubscriptionPill';
import { Bell, Settings, MapPin, Upload, Wand2, Briefcase, GraduationCap, Languages, Award, Plus, Trash2 } from 'lucide-react-native';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useCandidateSubscriptionSummary } from '@/hooks/useSubscriptionQueries';
import { fileStorageService } from '@/services/fileStorageService';
import { userProfileService } from '@/services/userProfileService';

export default function CandidateProfileScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((st) => st.user);
  const updateUser = useAuthStore((st) => st.updateUser);
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useCandidateProfile(user?.id);
  const { data: subscriptionSummary } = useCandidateSubscriptionSummary(user?.id);
  const updateProfile = useUpdateCandidateProfile(user?.id);

  const imagePicker = useImagePicker({ aspect: [1, 1], quality: 0.8 });

  const handleChangeAvatar = async () => {
    if (!user?.id) {
      return;
    }

    const picked = await imagePicker.showPicker();
    if (picked) {
      const previousAvatarUrl = user.avatarUrl;

      try {
        const uploaded = await fileStorageService.uploadUserAvatar(user.id, {
          uri: picked.uri,
          fileName: picked.fileName,
          mimeType: picked.type,
          fileSize: picked.fileSize,
        });

        await userProfileService.updateAvatar(user.id, uploaded.url);
        await updateUser({ avatarUrl: uploaded.url });

        if (previousAvatarUrl && previousAvatarUrl !== uploaded.url) {
          void fileStorageService.removeUploadedFile(previousAvatarUrl).catch(() => undefined);
        }
      } catch (error) {
        Alert.alert(
          tr('common.error'),
          error instanceof Error ? error.message : tr('common.error')
        );
      }
    }
  };

  const confirmDelete = (onConfirm: () => void) => {
    Alert.alert(tr('common.deleteItemTitle'), tr('common.deleteItemMessage'), [
      {
        text: tr('common.cancel'),
        style: 'cancel',
      },
      {
        text: tr('common.delete'),
        style: 'destructive',
        onPress: onConfirm,
      },
    ]);
  };

  const handleDeleteError = (error: unknown) => {
    Alert.alert(tr('common.error'), error instanceof Error ? error.message : tr('common.error'));
  };

  const removeExperience = (id: string) => {
    confirmDelete(() => {
      void (async () => {
        try {
          await updateProfile.mutateAsync({
            workExperience: removeListItem(profile?.workExperience || [], id),
          });
        } catch (error) {
          handleDeleteError(error);
        }
      })();
    });
  };

  const renderInlineDeleteButton = (onPress: () => void) => (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      hitSlop={8}
      style={[
        styles.inlineDeleteButton,
        {
          backgroundColor: colors.error + '12',
          borderColor: colors.error + '24',
        },
      ]}
    >
      <Trash2 size={15} color={colors.error} strokeWidth={1.9} />
    </Pressable>
  );

  const removeEducation = (id: string) => {
    confirmDelete(() => {
      void (async () => {
        try {
          await updateProfile.mutateAsync({
            education: removeListItem(profile?.education || [], id),
          });
        } catch (error) {
          handleDeleteError(error);
        }
      })();
    });
  };

  const removeLanguage = (id: string) => {
    confirmDelete(() => {
      void (async () => {
        try {
          await updateProfile.mutateAsync({
            languages: removeListItem(profile?.languages || [], id),
          });
        } catch (error) {
          handleDeleteError(error);
        }
      })();
    });
  };

  const removeCertification = (id: string) => {
    confirmDelete(() => {
      void (async () => {
        try {
          await updateProfile.mutateAsync({
            certifications: removeListItem(profile?.certifications || [], id),
          });
        } catch (error) {
          handleDeleteError(error);
        }
      })();
    });
  };

  if (!user) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[{ color: colors.textPrimary, textAlign: 'center' }, t.headingSmall]}>
          {tr('guest.title')}
        </Text>
        <Text style={[{ color: colors.textSecondary, marginTop: 8, textAlign: 'center', maxWidth: 300 }, t.bodyMedium]}>
          {tr('guest.subtitle')}
        </Text>
        <View style={{ marginTop: 24, width: '100%', maxWidth: 320, gap: 10 }}>
          <Button title={tr('auth.signIn')} onPress={() => router.push('/auth/sign-in')} size="lg" />
          <Button title={tr('auth.createAccount')} onPress={() => router.push('/auth/sign-up')} variant="outline" size="md" />
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.textSecondary, marginTop: 12 }, t.bodyMedium]}>
          {tr('common.loading')}
        </Text>
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
          title={tr('candidate.profile')}
          subtitle={tr('common.error')}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

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
              onPress={() => router.push('/preferences' as never)}
              style={[styles.headerBtn, { marginLeft: 8 }]}
            >
              <Settings size={18} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card — inside gradient for seamless look */}
        <View style={[styles.profileCardInner, { backgroundColor: colors.surface }]}>
          <View style={styles.profileHeader}>
            <Avatar name={user?.fullName} uri={user?.avatarUrl} size={64} editable onPress={handleChangeAvatar} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[{ color: colors.textPrimary }, t.headingSmall]}>{user?.fullName}</Text>
              <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>{profile.title}</Text>
              {subscriptionSummary ? (
                <SubscriptionPill
                  planCode={subscriptionSummary.subscription.plan}
                  style={{ marginTop: 8 }}
                />
              ) : null}
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
          <Text style={[{ color: colors.textPrimary, marginBottom: 8 }, t.labelMedium]}>{tr('candidate.bio')}</Text>
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
          <View style={styles.sectionTitleInner}>
            <Briefcase size={16} color={colors.primary} strokeWidth={1.8} />
            <Text style={[{ color: colors.textPrimary, marginLeft: 8 }, t.labelMedium]}>{tr('candidate.experience_section')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile/experience/new' as never)} style={[styles.sectionAddBtn, { backgroundColor: colors.primaryLight }]}> 
            <Plus size={16} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        {profile.workExperience.length === 0 ? (
          <Text style={[{ color: colors.textTertiary }, t.bodySmall]}>{tr('profileCrud.emptyStates.experience')}</Text>
        ) : profile.workExperience.map((exp, i) => (
          <View key={exp.id} style={[styles.listItemRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}> 
            <TouchableOpacity onPress={() => router.push((`/profile/experience/${exp.id}` as never))} style={styles.listItemPressable}> 
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
            </TouchableOpacity>
            {renderInlineDeleteButton(() => removeExperience(exp.id))}
          </View>
        ))}
      </View>

      {/* ── Education ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}> 
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionTitleInner}>
            <GraduationCap size={16} color={colors.accent} strokeWidth={1.8} />
            <Text style={[{ color: colors.textPrimary, marginLeft: 8 }, t.labelMedium]}>{tr('candidate.education')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile/education/new' as never)} style={[styles.sectionAddBtn, { backgroundColor: colors.accent + '20' }]}> 
            <Plus size={16} color={colors.accent} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        {profile.education.length === 0 ? (
          <Text style={[{ color: colors.textTertiary }, t.bodySmall]}>{tr('profileCrud.emptyStates.education')}</Text>
        ) : profile.education.map((edu, i) => (
          <View key={edu.id} style={[styles.listItemRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}> 
            <TouchableOpacity onPress={() => router.push((`/profile/education/${edu.id}` as never))} style={styles.listItemPressable}> 
              <View style={[styles.listItemDot, { backgroundColor: colors.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{edu.degree} — {edu.fieldOfStudy}</Text>
                <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>{edu.institution}</Text>
                <Text style={[{ color: colors.textTertiary, marginTop: 3 }, t.caption]}>
                  {edu.startDate.slice(0, 7)} — {edu.isCurrent ? tr('candidate.present') : edu.endDate?.slice(0, 7)}
                </Text>
              </View>
            </TouchableOpacity>
            {renderInlineDeleteButton(() => removeEducation(edu.id))}
          </View>
        ))}
      </View>

      {/* ── Languages ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}> 
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionTitleInner}>
            <Languages size={16} color={colors.info} strokeWidth={1.8} />
            <Text style={[{ color: colors.textPrimary, marginLeft: 8 }, t.labelMedium]}>{tr('candidate.languages')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile/language/new' as never)} style={[styles.sectionAddBtn, { backgroundColor: colors.info + '20' }]}> 
            <Plus size={16} color={colors.info} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        {profile.languages.length === 0 ? (
          <Text style={[{ color: colors.textTertiary }, t.bodySmall]}>{tr('profileCrud.emptyStates.languages')}</Text>
        ) : profile.languages.map((lang, i) => (
          <View key={lang.id} style={[styles.listItemRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}> 
            <TouchableOpacity onPress={() => router.push((`/profile/language/${lang.id}` as never))} style={styles.listItemPressable}> 
              <View style={[styles.listItemDot, { backgroundColor: colors.info }]} />
              <View style={{ flex: 1 }}>
                <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{lang.language}</Text>
                <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>{getLanguageLevelLabel(tr, lang.level)}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.listItemTrailing}>
              <Badge label={tr(`profileCrud.language.levels.${lang.level}`)} variant="info" />
              {renderInlineDeleteButton(() => removeLanguage(lang.id))}
            </View>
          </View>
        ))}
      </View>

      {/* ── Certifications ── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}> 
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionTitleInner}>
            <Award size={16} color={colors.warning} strokeWidth={1.8} />
            <Text style={[{ color: colors.textPrimary, marginLeft: 8 }, t.labelMedium]}>{tr('candidate.certifications')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile/certification/new' as never)} style={[styles.sectionAddBtn, { backgroundColor: colors.warning + '20' }]}> 
            <Plus size={16} color={colors.warning} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        {profile.certifications.length === 0 ? (
          <Text style={[{ color: colors.textTertiary }, t.bodySmall]}>{tr('profileCrud.emptyStates.certifications')}</Text>
        ) : profile.certifications.map((cert, i) => (
          <View key={cert.id} style={[styles.listItemRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}> 
            <TouchableOpacity onPress={() => router.push((`/profile/certification/${cert.id}` as never))} style={styles.listItemPressable}> 
              <View style={[styles.listItemDot, { backgroundColor: colors.warning }]} />
              <View style={{ flex: 1 }}>
                <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{cert.name}</Text>
                <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>{cert.issuer}</Text>
              </View>
            </TouchableOpacity>
            {renderInlineDeleteButton(() => removeCertification(cert.id))}
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listItemPressable: {
    flexDirection: 'row',
    flex: 1,
    paddingVertical: 10,
  },
  listItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 12,
  },
  listItemTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    paddingLeft: 12,
  },
  inlineDeleteButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginLeft: 12,
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
