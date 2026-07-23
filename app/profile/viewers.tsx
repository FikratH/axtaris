import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useCandidateEntitlements } from '@/hooks/useEntitlements';
import { useProfileViewSummary } from '@/hooks/useGrowthQueries';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { safeBack } from '@/utils/navigation';
import { ChevronLeft, Eye, Lock, Sparkles } from 'lucide-react-native';

export default function ProfileViewersScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((st) => st.user);
  const { entitlements } = useCandidateEntitlements();
  const visibility = entitlements.whoViewedYou;
  const {
    data: summary,
    isLoading,
    isError,
    refetch,
  } = useProfileViewSummary(user?.id, visibility);

  const formatViewedAt = (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    if (hours < 1) return tr('viewers.justNow');
    if (hours < 24) return tr('viewers.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return tr('viewers.daysAgo', { count: days });
  };

  if (!user) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[{ color: colors.textPrimary, textAlign: 'center' }, t.headingSmall]}>
          {tr('guest.title')}
        </Text>
        <Text
          style={[
            { color: colors.textSecondary, marginTop: 8, textAlign: 'center', maxWidth: 300 },
            t.bodyMedium,
          ]}
        >
          {tr('guest.subtitle')}
        </Text>
        <View style={{ marginTop: 24, width: '100%', maxWidth: 320, gap: 10 }}>
          <Button title={tr('auth.signIn')} onPress={() => router.push('/auth/sign-in')} size="lg" />
          <Button
            title={tr('auth.createAccount')}
            onPress={() => router.push('/auth/sign-up')}
            variant="outline"
            size="md"
          />
        </View>
      </View>
    );
  }

  const isLocked = visibility === 'count';

  const renderHeader = () => (
    <View style={[styles.header, { paddingHorizontal: s.xl }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => safeBack(router, '/(candidate)/profile')}
          style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
        >
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[{ color: colors.textPrimary, ...t.headingMedium, flex: 1, marginLeft: s.md }]}>
          {tr('viewers.title')}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
        {renderHeader()}
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[{ color: colors.textSecondary, marginTop: 12 }, t.bodyMedium]}>
            {tr('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
        {renderHeader()}
        <View style={styles.stateContainer}>
          <EmptyState
            title={tr('common.error')}
            subtitle={tr('common.retry')}
            actionTitle={tr('common.retry')}
            onAction={() => refetch()}
          />
        </View>
      </View>
    );
  }

  const totalViews = summary?.totalViews ?? 0;
  const weeklyViews = summary?.weeklyViews ?? 0;
  const viewers = summary?.viewers ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      {renderHeader()}
      <ScrollView
        contentContainerStyle={{ padding: s.xl, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary stats ── */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.stat}>
            <Text style={[{ color: colors.primary }, t.headingLarge]}>{totalViews}</Text>
            <Text style={[{ color: colors.textTertiary, marginTop: 2 }, t.caption]}>
              {tr('viewers.totalViews')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Text style={[{ color: colors.accent }, t.headingLarge]}>{weeklyViews}</Text>
            <Text style={[{ color: colors.textTertiary, marginTop: 2 }, t.caption]}>
              {tr('viewers.thisWeek')}
            </Text>
          </View>
        </View>

        {isLocked ? (
          <>
            {/* ── Upgrade CTA ── */}
            <View style={[styles.ctaCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '33' }]}>
              <View style={[styles.ctaIcon, { backgroundColor: colors.primary }]}>
                <Sparkles size={18} color="#FFFFFF" strokeWidth={1.9} />
              </View>
              <Text style={[{ color: colors.textPrimary, marginTop: 12 }, t.labelMedium]}>
                {tr('viewers.upgradeTitle')}
              </Text>
              <Text style={[{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }, t.bodySmall]}>
                {tr('viewers.upgradeSubtitle')}
              </Text>
              <View style={{ marginTop: 14 }}>
                <Button
                  title={tr('viewers.upgradeCta')}
                  onPress={() => router.push('/checkout?plan=pro&audience=candidate' as never)}
                  size="md"
                />
              </View>
            </View>

            {/* ── Blurred teaser list ── */}
            <Text style={[{ color: colors.textSecondary, marginTop: 24, marginBottom: 10 }, t.overline]}>
              {tr('viewers.recentViewers')}
            </Text>
            {Array.from({ length: 4 }).map((_, index) => (
              <View
                key={index}
                style={[styles.teaserRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
              >
                <View style={[styles.teaserAvatar, { backgroundColor: colors.surfaceSecondary }]}>
                  <Lock size={14} color={colors.textTertiary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={[styles.teaserBar, { backgroundColor: colors.surfaceSecondary, width: 160 - index * 22 }]} />
                  <View style={[styles.teaserBar, { backgroundColor: colors.surfaceSecondary, width: 80, marginTop: 8, height: 9 }]} />
                </View>
              </View>
            ))}
          </>
        ) : viewers.length === 0 ? (
          <View style={{ marginTop: 32 }}>
            <EmptyState
              title={tr('viewers.emptyTitle')}
              subtitle={tr('viewers.emptySubtitle')}
              icon={<Eye size={48} color={colors.textTertiary} strokeWidth={1.2} />}
            />
          </View>
        ) : (
          <>
            <Text style={[{ color: colors.textSecondary, marginTop: 24, marginBottom: 10 }, t.overline]}>
              {tr('viewers.recentViewers')}
            </Text>
            {viewers.map((viewer, index) => (
              <View
                key={`${viewer.companyId}-${index}`}
                style={[styles.viewerRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
              >
                <Avatar name={viewer.companyName} uri={viewer.companyLogoUrl} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[{ color: colors.textPrimary }, t.labelSmall]} numberOfLines={1}>
                    {viewer.companyName || tr('viewers.aCompany')}
                  </Text>
                  <Text style={[{ color: colors.textTertiary, marginTop: 3 }, t.caption]}>
                    {formatViewedAt(viewer.viewedAt)}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  header: { marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, alignSelf: 'stretch', marginVertical: 6 },
  ctaCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    opacity: 0.7,
  },
  teaserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaserBar: {
    height: 11,
    borderRadius: 6,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
});
