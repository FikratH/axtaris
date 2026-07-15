import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { aiService, AISuggestion } from '@/services/aiService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useCandidateProfile,
  useUpdateCandidateProfile,
} from '@/hooks/useCandidateVacancyActions';
import { safeBack } from '@/utils/navigation';
import { ChevronLeft, Sparkles, Lightbulb, Zap, CheckCircle2 } from 'lucide-react-native';

export default function AIAssistantScreen() {
  const { colors, typography: t, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    data: profile,
    isLoading: profileLoading,
    isError,
    refetch,
  } = useCandidateProfile(user?.id);
  const updateProfile = useUpdateCandidateProfile(user?.id);

  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;

    (async () => {
      const [sug, skills] = await Promise.all([
        aiService.analyzeProfile(profile),
        aiService.suggestSkills(profile.skills, profile.title),
      ]);
      setSuggestions(sug);
      setSuggestedSkills(skills);
      setLoading(false);
    })();
  }, [profile]);

  const applySuggestion = async (s: AISuggestion) => {
    if (!profile) return;

    if (s.type === 'bio' && s.suggestedText) {
      await updateProfile.mutateAsync({ bio: s.suggestedText });
    }
    if (s.type === 'skill') {
      await updateProfile.mutateAsync({
        skills: Array.from(new Set([...profile.skills, ...suggestedSkills.slice(0, 3)])),
      });
    }
    setAppliedIds((prev) => [...prev, s.id]);
  };

  const addSkill = async (skill: string) => {
    if (!profile) return;

    if (!profile.skills.includes(skill)) {
      await updateProfile.mutateAsync({ skills: [...profile.skills, skill] });
      setSuggestedSkills((prev) => prev.filter((s) => s !== skill));
    }
  };

  if (profileLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.textSecondary, marginTop: 12 }, t.bodyMedium]}>{tr('common.loading')}</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundSecondary }]}> 
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <EmptyState
          title={tr('ai.assistant')}
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
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 12, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => safeBack(router, '/(candidate)/profile')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('ai.assistant')}</Text>
      </View>

      <View style={[styles.heroBanner, { backgroundColor: isDark ? 'rgba(91,127,214,0.12)' : '#EEF2FF' }]}>
        <Sparkles size={28} color={colors.primary} strokeWidth={1.5} />
        <Text style={[{ color: colors.textPrimary, marginTop: 12 }, t.headingSmall]}>
          {tr('ai.improveProfile')}
        </Text>
        <Text style={[{ color: colors.textSecondary, marginTop: 4, textAlign: 'center' }, t.bodySmall]}>
          {tr('ai.heroSubtitle')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[{ color: colors.textSecondary, marginTop: 12 }, t.bodyMedium]}>{tr('ai.analyzingProfile')}</Text>
        </View>
      ) : (
        <>
          {suggestions.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={[{ color: colors.textPrimary, marginBottom: 12 }, t.labelMedium]}>{tr('ai.suggestions')}</Text>
              {suggestions.map((s) => {
                const isApplied = appliedIds.includes(s.id);
                return (
                  <View key={s.id} style={[styles.suggestionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <View style={styles.suggestionHeader}>
                      <View style={[styles.suggestionIcon, { backgroundColor: isApplied ? colors.successLight : (isDark ? 'rgba(91,127,214,0.12)' : '#EEF2FF') }]}>
                        {isApplied
                          ? <CheckCircle2 size={18} color={colors.success} strokeWidth={1.8} />
                          : <Lightbulb size={18} color={colors.primary} strokeWidth={1.8} />
                        }
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{s.title}</Text>
                        <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodySmall]}>{s.description}</Text>
                      </View>
                    </View>
                    {s.suggestedText && !isApplied && (
                      <View style={[styles.suggestedTextBox, { backgroundColor: isDark ? 'rgba(91,127,214,0.08)' : '#F5F7FF', borderColor: colors.primary + '20' }]}>
                        <Text style={[{ color: colors.textSecondary, lineHeight: 20 }, t.bodySmall]} numberOfLines={4}>
                          {s.suggestedText}
                        </Text>
                      </View>
                    )}
                    {!isApplied && (
                      <TouchableOpacity
                        onPress={() => applySuggestion(s)}
                        activeOpacity={0.7}
                        style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                      >
                        <Zap size={14} color="#FFF" strokeWidth={2} />
                        <Text style={[{ color: '#FFF', marginLeft: 6 }, t.labelSmall]}>{tr('ai.apply_suggestion')}</Text>
                      </TouchableOpacity>
                    )}
                    {isApplied && (
                      <Text style={[{ color: colors.success, marginTop: 8 }, t.captionMedium]}>{tr('ai.applied')}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {suggestedSkills.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={[{ color: colors.textPrimary, marginBottom: 12 }, t.labelMedium]}>{tr('ai.suggestSkills')}</Text>
              <View style={styles.chipRow}>
                {suggestedSkills.map((sk) => (
                  <Chip key={sk} label={`+ ${sk}`} onPress={() => addSkill(sk)} style={{ marginBottom: 6 }} />
                ))}
              </View>
            </View>
          )}

          <View style={{ marginTop: 24 }}>
            <Button title={tr('common.done')} onPress={() => safeBack(router, '/(candidate)/profile')} size="lg" />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroBanner: { alignItems: 'center', padding: 24, borderRadius: 16 },
  loadingContainer: { alignItems: 'center', paddingVertical: 48 },
  suggestionCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  suggestionHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  suggestionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  suggestedTextBox: { marginTop: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginTop: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
