import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTalentCandidate, useSendInvite, useCompanyInviteCount } from '@/hooks/useTalentQueries';
import { useEmployerCompany } from '@/hooks/useVacancyQueries';
import { useEmployerEntitlements } from '@/hooks/useEntitlements';
import { talentService } from '@/services/talentService';
import { toUserMessage } from '@/utils/errorMessage';
import { safeBack } from '@/utils/navigation';
import { ChevronLeft, MapPin, Crown, UserPlus, Lock, Briefcase, Clock } from 'lucide-react-native';

export default function TalentDetailScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((st) => st.user);
  const { data: company } = useEmployerCompany(user?.id);
  const { entitlements } = useEmployerEntitlements();
  const { data: candidate, isLoading } = useTalentCandidate(id);
  const { data: inviteCount = 0 } = useCompanyInviteCount(company?.id);
  const sendInvite = useSendInvite(company?.id);
  const [invited, setInvited] = React.useState(false);

  // Record the profile view once (drives the candidate's "who viewed you").
  useEffect(() => {
    if (candidate?.id && company?.id) {
      void talentService.recordProfileView(candidate.id, company.id);
    }
  }, [candidate?.id, company?.id]);

  const invitesRemaining = entitlements.invitesPerMonth === null
    ? null
    : Math.max(entitlements.invitesPerMonth - inviteCount, 0);

  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!candidate) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <EmptyState title={tr('talent.notFoundTitle')} subtitle={tr('talent.notFoundBody')} actionTitle={tr('common.back')} onAction={() => safeBack(router, '/(employer)/talent' as never)} />
      </View>
    );
  }

  const handleInvite = async () => {
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
        candidateId: candidate.id,
        candidateUserId: candidate.userId,
        message: tr('talent.defaultInviteMessage', { company: company.name }),
      });
      setInvited(true);
    } catch (error) {
      Alert.alert(tr('common.error'), toUserMessage(error, tr));
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 12, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => safeBack(router, '/(employer)/talent' as never)} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}>
        <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
      </TouchableOpacity>

      <Card padding="lg" style={{ marginTop: s.lg }}>
        <View style={styles.header}>
          <Avatar uri={candidate.avatarUrl} name={candidate.fullName} size={72} />
          <View style={{ flex: 1, marginLeft: s.lg }}>
            <View style={styles.nameRow}>
              <Text style={[{ color: colors.textPrimary, flexShrink: 1 }, t.headingMedium]} numberOfLines={2}>
                {candidate.fullName}
              </Text>
              {candidate.isSpotlight ? (
                <View style={[styles.spotlight, { backgroundColor: colors.warning + '22', borderRadius: r.full }]}>
                  <Crown size={11} color={colors.warning} strokeWidth={2.2} />
                  <Text style={[{ color: colors.warning, marginLeft: 3 }, t.caption]}>{tr('talent.spotlight')}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[{ color: colors.textSecondary, marginTop: 2 }, t.bodyMedium]}>{candidate.title || tr('talent.candidate')}</Text>
            {candidate.location ? (
              <View style={styles.metaRow}>
                <MapPin size={13} color={colors.textTertiary} strokeWidth={1.8} />
                <Text style={[{ color: colors.textTertiary, marginLeft: 4 }, t.caption]}>{candidate.location}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {candidate.bioSnippet ? (
          <Text style={[{ color: colors.textSecondary, marginTop: s.lg, lineHeight: 21 }, t.bodySmall]}>{candidate.bioSnippet}</Text>
        ) : null}

        <View style={[styles.factRow, { marginTop: s.lg }]}>
          <View style={styles.fact}>
            <Briefcase size={15} color={colors.primary} strokeWidth={1.8} />
            <Text style={[{ color: colors.textSecondary, marginLeft: 6 }, t.caption]}>
              {tr('talent.experienceCount', { count: candidate.experienceCount })}
            </Text>
          </View>
          {candidate.availability ? (
            <View style={styles.fact}>
              <Clock size={15} color={colors.primary} strokeWidth={1.8} />
              <Text style={[{ color: colors.textSecondary, marginLeft: 6 }, t.caption]}>
                {tr(`candidate.availabilityOptions.${candidate.availability}`)}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Text style={[{ color: colors.textPrimary, marginTop: s['2xl'], marginBottom: s.sm }, t.labelMedium]}>{tr('candidate.skills')}</Text>
      <View style={styles.skillsWrap}>
        {candidate.skills.map((sk) => (
          <View key={sk} style={[styles.skillPill, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: r.md }]}>
            <Text style={[{ color: colors.textPrimary }, t.bodySmall]}>{sk}</Text>
          </View>
        ))}
      </View>

      {candidate.expectedSalary ? (
        <Card padding="md" style={{ marginTop: s.xl }}>
          <Text style={[{ color: colors.textTertiary }, t.caption]}>{tr('candidate.expectedSalary')}</Text>
          <Text style={[{ color: colors.textPrimary, marginTop: 2 }, t.headingSmall]}>
            {candidate.expectedSalary} {candidate.salaryCurrency || 'AZN'}
          </Text>
        </Card>
      ) : null}

      {/* Contact is private — reached only through an accepted invite. */}
      <View style={[styles.privacyNote, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F6F7FB', borderRadius: r.md, marginTop: s.xl }]}>
        <Lock size={14} color={colors.textTertiary} strokeWidth={1.8} />
        <Text style={[{ color: colors.textTertiary, marginLeft: 8, flex: 1 }, t.caption]}>{tr('talent.contactPrivate')}</Text>
      </View>

      <View style={{ marginTop: s.xl }}>
        <Button
          title={invited ? tr('talent.invited') : tr('talent.invite')}
          onPress={handleInvite}
          disabled={invited}
          loading={sendInvite.isPending}
          variant={invited ? 'secondary' : 'primary'}
          size="lg"
          icon={invited ? undefined : <UserPlus size={18} color="#FFFFFF" strokeWidth={2} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spotlight: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  fact: { flexDirection: 'row', alignItems: 'center' },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  privacyNote: { flexDirection: 'row', alignItems: 'center', padding: 12 },
});
