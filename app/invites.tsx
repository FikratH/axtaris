import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCandidateInvites, useRespondToInvite } from '@/hooks/useTalentQueries';
import { toUserMessage } from '@/utils/errorMessage';
import { safeBack } from '@/utils/navigation';
import { ChevronLeft, Building2 } from 'lucide-react-native';

export default function InvitesScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((st) => st.user);
  const { data: invites = [], isLoading } = useCandidateInvites(user?.id);
  const respond = useRespondToInvite(user?.id);

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

  const handleRespond = async (inviteId: string, status: 'accepted' | 'declined', vacancyId?: string) => {
    try {
      await respond.mutateAsync({ inviteId, status });
      if (status === 'accepted' && vacancyId) {
        router.push(`/vacancy/${vacancyId}` as never);
      }
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
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => safeBack(router, '/(candidate)/home')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}>
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('invites.title')}</Text>
      </View>

      {isLoading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : invites.length === 0 ? (
        <EmptyState title={tr('invites.emptyTitle')} subtitle={tr('invites.emptyBody')} />
      ) : (
        invites.map((invite) => (
          <Card key={invite.id} padding="lg" style={{ marginBottom: 12 }}>
            <View style={styles.cardHeader}>
              <View style={[styles.companyIcon, { backgroundColor: colors.primaryLight, borderRadius: r.md }]}>
                <Building2 size={18} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, marginLeft: s.md }}>
                <Text style={[{ color: colors.textPrimary }, t.labelMedium]}>{invite.companyName || tr('talent.anEmployer')}</Text>
                {invite.vacancyTitle ? (
                  <Text style={[{ color: colors.textSecondary, marginTop: 1 }, t.bodySmall]}>{invite.vacancyTitle}</Text>
                ) : null}
              </View>
              {invite.status !== 'pending' ? (
                <Badge
                  label={invite.status === 'accepted' ? tr('invites.accepted') : tr('invites.declined')}
                  variant={invite.status === 'accepted' ? 'success' : 'default'}
                />
              ) : null}
            </View>

            {invite.message ? (
              <Text style={[{ color: colors.textSecondary, marginTop: s.md, lineHeight: 20 }, t.bodySmall]}>{invite.message}</Text>
            ) : null}

            {invite.status === 'pending' ? (
              <View style={styles.actions}>
                <View style={{ flex: 1 }}>
                  <Button
                    title={tr('invites.accept')}
                    onPress={() => handleRespond(invite.id, 'accepted', invite.vacancyId)}
                    variant="primary"
                    size="sm"
                    loading={respond.isPending && respond.variables?.inviteId === invite.id}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title={tr('invites.decline')}
                    onPress={() => handleRespond(invite.id, 'declined')}
                    variant="ghost"
                    size="sm"
                  />
                </View>
              </View>
            ) : null}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  companyIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
});
