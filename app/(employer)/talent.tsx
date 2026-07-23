import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { SearchBar } from '@/components/ui/SearchBar';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEmployerCompany } from '@/hooks/useVacancyQueries';
import { useTalentSearch, useSendInvite, useCompanyInviteCount } from '@/hooks/useTalentQueries';
import { useEmployerEntitlements } from '@/hooks/useEntitlements';
import { getWorkTypeLabel } from '@/utils/labels';
import { toUserMessage } from '@/utils/errorMessage';
import type { TalentSearchFilters, WorkType } from '@/types/models';
import { MapPin, Crown, UserPlus, Check, SlidersHorizontal } from 'lucide-react-native';

const WORK_TYPES: WorkType[] = ['remote', 'hybrid', 'onsite', 'full_time', 'part_time', 'internship'];

export default function TalentScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((st) => st.user);
  const { data: company } = useEmployerCompany(user?.id);
  const { entitlements } = useEmployerEntitlements();
  const { data: inviteCount = 0 } = useCompanyInviteCount(company?.id);

  const [query, setQuery] = useState('');
  const [workPreference, setWorkPreference] = useState<WorkType | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [invited, setInvited] = useState<Record<string, boolean>>({});

  const filters: TalentSearchFilters = useMemo(
    () => ({ query: query.trim() || undefined, workPreference }),
    [query, workPreference]
  );
  const { data, isLoading } = useTalentSearch(filters);
  const sendInvite = useSendInvite(company?.id);

  const invitesLimit = entitlements.invitesPerMonth;
  const invitesRemaining = invitesLimit === null ? null : Math.max(invitesLimit - inviteCount, 0);

  if (!user) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <EmptyState
          title={tr('guest.title')}
          subtitle={tr('guest.subtitle')}
          actionTitle={tr('auth.signIn')}
          onAction={() => router.push('/auth/sign-in')}
        />
      </View>
    );
  }

  const handleInvite = async (candidateId: string, candidateUserId: string) => {
    if (!company?.id) {
      Alert.alert(tr('common.error'), tr('talent.needCompany'));
      return;
    }
    if (invitesRemaining !== null && invitesRemaining <= 0) {
      Alert.alert(tr('talent.inviteLimitTitle'), tr('talent.inviteLimitBody'), [
        { text: tr('common.cancel'), style: 'cancel' },
        { text: tr('paywall.upgrade'), onPress: () => router.push('/checkout?plan=pro&audience=employer' as never) },
      ]);
      return;
    }
    try {
      await sendInvite.mutateAsync({
        companyId: company.id,
        companyName: company.name,
        candidateId,
        candidateUserId,
        message: tr('talent.defaultInviteMessage', { company: company.name }),
      });
      setInvited((prev) => ({ ...prev, [candidateId]: true }));
    } catch (error) {
      Alert.alert(tr('common.error'), toUserMessage(error, tr));
    }
  };

  const candidates = data?.candidates || [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 12 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ paddingHorizontal: s.xl }}>
        <View style={styles.headerRow}>
          <Text style={[{ color: colors.textPrimary }, t.headingLarge]}>{tr('talent.title')}</Text>
          <View style={[styles.quotaBadge, { backgroundColor: isDark ? 'rgba(91,127,214,0.16)' : '#EEF2FF', borderRadius: r.full }]}>
            <Text style={[{ color: colors.primary }, t.labelSmall]}>
              {invitesRemaining === null
                ? tr('talent.invitesUnlimited')
                : tr('talent.invitesLeft', { count: invitesRemaining })}
            </Text>
          </View>
        </View>
        <Text style={[{ color: colors.textSecondary, marginTop: 2, marginBottom: s.md }, t.bodySmall]}>
          {tr('talent.subtitle')}
        </Text>

        <SearchBar value={query} onChangeText={setQuery} placeholder={tr('talent.searchPlaceholder')} />

        <TouchableOpacity onPress={() => setShowFilters((v) => !v)} style={styles.filterToggle} activeOpacity={0.7}>
          <SlidersHorizontal size={16} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[{ color: colors.textSecondary, marginLeft: 6 }, t.labelSmall]}>{tr('talent.filters')}</Text>
        </TouchableOpacity>

        {showFilters ? (
          <View style={styles.chipsWrap}>
            {WORK_TYPES.map((wt) => (
              <Chip
                key={wt}
                label={getWorkTypeLabel(tr, wt)}
                selected={workPreference === wt}
                onPress={() => setWorkPreference((cur) => (cur === wt ? undefined : wt))}
                style={{ marginBottom: 6 }}
              />
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: s.xl, marginTop: s.lg }}>
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : data && !data.available ? (
          <EmptyState title={tr('talent.unavailableTitle')} subtitle={tr('talent.unavailableBody')} />
        ) : candidates.length === 0 ? (
          <EmptyState title={tr('talent.emptyTitle')} subtitle={tr('talent.emptyBody')} />
        ) : (
          candidates.map((c) => (
            <Card key={c.id} padding="lg" style={{ marginBottom: 12, borderWidth: c.isSpotlight ? 1.5 : 1, borderColor: c.isSpotlight ? colors.warning : colors.cardBorder }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/talent/${c.id}` as never)}
              >
                <View style={styles.cardHeader}>
                  <Avatar uri={c.avatarUrl} name={c.fullName} size={52} />
                  <View style={{ flex: 1, marginLeft: s.md }}>
                    <View style={styles.nameRow}>
                      <Text style={[{ color: colors.textPrimary, flexShrink: 1 }, t.labelLarge]} numberOfLines={1}>
                        {c.fullName}
                      </Text>
                      {c.isSpotlight ? (
                        <View style={[styles.spotlight, { backgroundColor: colors.warning + '22', borderRadius: r.full }]}>
                          <Crown size={11} color={colors.warning} strokeWidth={2.2} />
                          <Text style={[{ color: colors.warning, marginLeft: 3 }, t.caption]}>{tr('talent.spotlight')}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[{ color: colors.textSecondary, marginTop: 1 }, t.bodySmall]} numberOfLines={1}>
                      {c.title || tr('talent.candidate')}
                    </Text>
                    {c.location ? (
                      <View style={styles.metaRow}>
                        <MapPin size={12} color={colors.textTertiary} strokeWidth={1.8} />
                        <Text style={[{ color: colors.textTertiary, marginLeft: 3 }, t.caption]}>{c.location}</Text>
                        {typeof c.matchScore === 'number' && c.matchScore > 0 ? (
                          <Text style={[{ color: colors.success, marginLeft: 8 }, t.caption]}>
                            {tr('talent.matchPercent', { percent: Math.min(c.matchScore, 100) })}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.skillsRow}>
                  {c.skills.slice(0, 4).map((sk) => (
                    <View key={sk} style={[styles.skillPill, { backgroundColor: colors.surfaceSecondary, borderRadius: r.sm }]}>
                      <Text style={[{ color: colors.textSecondary }, t.caption]}>{sk}</Text>
                    </View>
                  ))}
                  {c.skills.length > 4 ? (
                    <Text style={[{ color: colors.textTertiary, alignSelf: 'center' }, t.caption]}>+{c.skills.length - 4}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>

              <View style={{ marginTop: 12 }}>
                <Button
                  title={invited[c.id] ? tr('talent.invited') : tr('talent.invite')}
                  onPress={() => handleInvite(c.id, c.userId)}
                  disabled={invited[c.id]}
                  loading={sendInvite.isPending && sendInvite.variables?.candidateId === c.id}
                  variant={invited[c.id] ? 'secondary' : 'outline'}
                  size="sm"
                  icon={invited[c.id]
                    ? <Check size={16} color={colors.success} strokeWidth={2.2} />
                    : <UserPlus size={16} color={colors.primary} strokeWidth={2} />}
                />
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quotaBadge: { paddingHorizontal: 10, paddingVertical: 6 },
  filterToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spotlight: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  skillPill: { paddingHorizontal: 8, paddingVertical: 4 },
});
