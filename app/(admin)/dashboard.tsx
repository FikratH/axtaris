import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useAdminDashboard } from '@/hooks/useAdminQueries';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader, StatTile, MiniBarRow, CountChip } from '@/components/ui/AdminDashboardBits';
import {
  Users,
  UserPlus,
  Building2,
  Briefcase,
  FileText,
  ShieldAlert,
  Flag,
  LogOut,
  Settings,
  MessageCircle,
  MessagesSquare,
  BellRing,
  Eye,
  Bookmark,
  Search,
  Send,
  Sparkles,
  UserX,
  Ban,
  LifeBuoy,
  Wallet,
  CreditCard,
  FileCheck,
} from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const { colors, typography: t, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore((state) => state.signOut);
  const { data: s, isLoading, isError, refetch, isRefetching } = useAdminDashboard();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/role-select');
  };

  const sum14 = (pick: (d: { newUsers: number; applications: number; messages: number }) => number) =>
    s ? s.daily14d.reduce((acc, d) => acc + pick(d), 0) : 0;

  const notifTypeLabel = (type: string) =>
    tr(`admin.dash.notifType.${type}`, { defaultValue: type.replace(/_/g, ' ') });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <LinearGradient
        colors={isDark ? ['#111827', '#1A2544', '#111827'] : ['#1B2E5A', '#2D4797', '#3755A0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, t.headingLarge]}>{tr('admin.panel')}</Text>
            <Text style={[styles.subtitle, t.bodySmall]}>{tr('admin.overview')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/messages' as never)} style={styles.headerBtn}>
            <MessageCircle size={19} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/preferences' as never)} style={[styles.headerBtn, { marginLeft: 8 }]}>
            <Settings size={19} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={[styles.headerBtn, { marginLeft: 8 }]}>
            <LogOut size={19} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {isError ? (
        <View style={{ paddingTop: 40 }}>
          <EmptyState
            title={tr('common.error')}
            subtitle={tr('common.retry')}
            actionTitle={tr('common.retry')}
            onAction={() => refetch()}
          />
        </View>
      ) : isLoading || !s ? (
        <View style={styles.body}>
          <View style={styles.grid}>
            {Array.from({ length: 8 }, (_, i) => (
              <View key={i} style={[styles.skeleton, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          {/* ── Today ─────────────────────────────────────── */}
          <SectionHeader title={tr('admin.dash.today')} />
          <View style={[styles.wideCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.todayRow}>
              {[
                { label: tr('admin.dash.newUsers'), value: s.users.newToday },
                { label: tr('admin.stats.applications'), value: s.applications.today },
                { label: tr('chat.messages'), value: s.messaging.messagesToday },
                { label: tr('admin.dash.aiUses'), value: s.ai.usesToday },
              ].map((item, i) => (
                <View key={i} style={styles.todayCol}>
                  <Text style={[t.displaySmall, { color: colors.textPrimary }]}>{item.value}</Text>
                  <Text style={[t.caption, { color: colors.textTertiary, textAlign: 'center' }]} numberOfLines={2}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── 14-day activity ───────────────────────────── */}
          <SectionHeader title={tr('admin.dash.activity')} />
          <View style={[styles.wideCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <MiniBarRow
              label={tr('admin.dash.newUsers')}
              total={String(sum14((d) => d.newUsers))}
              values={s.daily14d.map((d) => d.newUsers)}
              color={colors.primary}
            />
            <MiniBarRow
              label={tr('admin.stats.applications')}
              total={String(sum14((d) => d.applications))}
              values={s.daily14d.map((d) => d.applications)}
              color={colors.success}
            />
            <MiniBarRow
              label={tr('chat.messages')}
              total={String(sum14((d) => d.messages))}
              values={s.daily14d.map((d) => d.messages)}
              color={colors.accent}
            />
          </View>

          {/* ── Users ─────────────────────────────────────── */}
          <SectionHeader title={tr('admin.dash.users')} />
          <View style={styles.grid}>
            <StatTile
              label={tr('admin.stats.users')}
              value={s.users.total}
              sub={`${s.users.candidates} · ${s.users.employers} · ${s.users.admins}`}
              icon={Users} color={colors.primary} bg={colors.primaryLight}
              onPress={() => router.push('/(admin)/users' as never)}
            />
            <StatTile
              label={tr('admin.dash.new7d')}
              value={s.users.new7d}
              sub={tr('admin.dash.new30dSub', { count: s.users.new30d })}
              icon={UserPlus} color={colors.success} bg={colors.successLight}
            />
            <StatTile
              label={tr('admin.dash.pushDevices')}
              value={s.users.withPushToken}
              icon={BellRing} color={colors.accent} bg={colors.accentLight}
            />
            <StatTile
              label={tr('admin.dash.withCv')}
              value={s.candidates.withCv}
              sub={tr('admin.dash.completenessSub', { pct: s.candidates.avgCompleteness })}
              icon={FileCheck} color={colors.info} bg={colors.infoLight}
            />
          </View>

          {/* ── Marketplace ───────────────────────────────── */}
          <SectionHeader title={tr('admin.dash.marketplace')} />
          <View style={styles.grid}>
            <StatTile
              label={tr('admin.stats.vacancies')}
              value={s.vacancies.total}
              sub={tr('admin.dash.vacancyBreakdownSub', {
                active: s.vacancies.active, draft: s.vacancies.draft, paused: s.vacancies.paused,
              })}
              icon={Briefcase} color={colors.success} bg={colors.successLight}
            />
            <StatTile
              label={tr('admin.dash.totalViews')}
              value={s.vacancies.totalViews}
              sub={tr('admin.dash.featuredSub', { count: s.vacancies.featured })}
              icon={Eye} color={colors.info} bg={colors.infoLight}
            />
            <StatTile
              label={tr('admin.stats.companies')}
              value={s.companies.total}
              sub={`${s.companies.verified} ${tr('admin.stats.verified').toLowerCase()}`}
              icon={Building2} color={colors.accent} bg={colors.accentLight}
              onPress={() => router.push('/(admin)/companies' as never)}
            />
            <StatTile
              label={tr('admin.stats.pendingModeration')}
              value={s.vacancies.pendingModeration}
              sub={`${s.companies.pendingVerification} ${tr('admin.stats.pendingVerification').toLowerCase()}`}
              icon={ShieldAlert} color={colors.warning} bg={colors.warningLight}
              onPress={() => router.push('/(admin)/moderation' as never)}
            />
            <StatTile
              label={tr('admin.viewToApply')}
              value={`${s.funnel30d.conversionPct}%`}
              sub={`${s.funnel30d.vacancyViews} → ${s.funnel30d.applicationSubmits}`}
              icon={FileText} color={colors.primary} bg={colors.primaryLight}
            />
            <StatTile
              label={tr('admin.stats.applications')}
              value={s.applications.total}
              sub={tr('admin.dash.appsTodaySub', { count: s.applications.today, count7: s.applications.last7d })}
              icon={Send} color={colors.info} bg={colors.infoLight}
            />
          </View>
          <View style={[styles.wideCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, marginTop: 10 }]}>
            <Text style={[t.caption, { color: colors.textTertiary, marginBottom: 8 }]}>
              {tr('admin.dash.applicationsByStatus')}
            </Text>
            <View style={styles.chipRow}>
              <CountChip label={tr('candidate.pending')} count={s.applications.pending} color={colors.warning} bg={colors.warningLight} />
              <CountChip label={tr('candidate.reviewed')} count={s.applications.reviewed} color={colors.info} bg={colors.infoLight} />
              <CountChip label={tr('candidate.shortlisted')} count={s.applications.shortlisted} color={colors.primary} bg={colors.primaryLight} />
              <CountChip label={tr('candidate.accepted')} count={s.applications.accepted} color={colors.success} bg={colors.successLight} />
              <CountChip label={tr('candidate.rejected')} count={s.applications.rejected} color={colors.error} bg={colors.errorLight} />
            </View>
          </View>

          {/* ── Engagement ────────────────────────────────── */}
          <SectionHeader title={tr('admin.dash.engagement')} />
          <View style={styles.grid}>
            <StatTile
              label={tr('admin.dash.messages7d')}
              value={s.messaging.messages7d}
              sub={tr('admin.dash.msgTodaySub', { count: s.messaging.messagesToday })}
              icon={MessagesSquare} color={colors.accent} bg={colors.accentLight}
            />
            <StatTile
              label={tr('admin.dash.activeConvos')}
              value={s.messaging.activeConversations7d}
              sub={tr('admin.dash.convosTotalSub', { count: s.messaging.conversationsTotal })}
              icon={MessageCircle} color={colors.primary} bg={colors.primaryLight}
            />
            <StatTile
              label={tr('invites.title')}
              value={s.invites.total}
              sub={tr('admin.dash.invitesSub', { accepted: s.invites.accepted, pending: s.invites.pending })}
              icon={Send} color={colors.success} bg={colors.successLight}
            />
            <StatTile
              label={tr('admin.dash.profileViews30d')}
              value={s.talent.profileViews30d}
              icon={Eye} color={colors.info} bg={colors.infoLight}
            />
            <StatTile
              label={tr('candidate.saved')}
              value={s.talent.savedJobs}
              icon={Bookmark} color={colors.warning} bg={colors.warningLight}
            />
            <StatTile
              label={tr('savedSearch.title')}
              value={s.talent.savedSearches}
              icon={Search} color={colors.accent} bg={colors.accentLight}
            />
            <StatTile
              label={tr('admin.dash.aiUses30d')}
              value={s.ai.uses30d}
              sub={tr('admin.dash.aiUsersSub', { count: s.ai.users30d })}
              icon={Sparkles} color={colors.primary} bg={colors.primaryLight}
            />
          </View>
          {s.notifications7d.length > 0 ? (
            <View style={[styles.wideCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, marginTop: 10 }]}>
              <Text style={[t.caption, { color: colors.textTertiary, marginBottom: 8 }]}>
                {tr('admin.dash.notifications7d')}
              </Text>
              <View style={styles.chipRow}>
                {s.notifications7d.map((n) => (
                  <CountChip key={n.type} label={notifTypeLabel(n.type)} count={n.count} color={colors.primary} bg={colors.primaryLight} />
                ))}
              </View>
            </View>
          ) : null}

          {/* ── Safety & moderation ───────────────────────── */}
          <SectionHeader title={tr('admin.dash.safety')} />
          <View style={styles.grid}>
            <StatTile
              label={tr('admin.stats.flags')}
              value={s.moderation.openFlags}
              sub={tr('admin.dash.resolved7dSub', { count: s.moderation.resolved7d })}
              icon={Flag} color={colors.error} bg={colors.errorLight}
              onPress={() => router.push('/(admin)/moderation' as never)}
            />
            <StatTile
              label={tr('admin.dash.blockedPairs')}
              value={s.moderation.blockedPairs}
              icon={Ban} color={colors.warning} bg={colors.warningLight}
            />
            <StatTile
              label={tr('admin.dash.inactive')}
              value={s.users.inactive}
              icon={UserX} color={colors.textTertiary} bg={colors.backgroundTertiary}
            />
            <StatTile
              label={tr('admin.dash.supportConvos')}
              value={s.messaging.supportConversations}
              icon={LifeBuoy} color={colors.info} bg={colors.infoLight}
            />
          </View>

          {/* ── Revenue ───────────────────────────────────── */}
          <SectionHeader title={tr('admin.dash.revenue')} />
          <View style={styles.grid}>
            <StatTile
              label={tr('admin.mrr')}
              value={`${s.revenue.candidateMrr + s.revenue.employerMrr} AZN`}
              sub={tr('admin.dash.mrrSub', { c: s.revenue.candidateMrr, e: s.revenue.employerMrr })}
              icon={Wallet} color={colors.success} bg={colors.successLight}
              onPress={() => router.push('/(admin)/finance' as never)}
            />
            <StatTile
              label={tr('admin.dash.payingSubs')}
              value={s.revenue.payingCandidates + s.revenue.payingEmployers}
              sub={tr('admin.dash.payingSubsSub', { c: s.revenue.payingCandidates, e: s.revenue.payingEmployers })}
              icon={CreditCard} color={colors.primary} bg={colors.primaryLight}
              onPress={() => router.push('/(admin)/finance' as never)}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#FFFFFF' },
  subtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  body: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 10 },
  wideCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginTop: 10 },
  todayRow: { flexDirection: 'row' },
  todayCol: { flex: 1, alignItems: 'center', gap: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skeleton: { width: '47%', flexGrow: 1, height: 110, borderRadius: 16, borderWidth: 1 },
});
