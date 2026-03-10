import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notification } from '@/types/models';
import { ChevronLeft, FileText, UserPlus, Briefcase, Star, BadgeCheck, ClipboardList, Bell as BellIcon } from 'lucide-react-native';

const typeIconMap: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth: number }>> = {
  application_update: FileText,
  new_application: UserPlus,
  new_job_match: Briefcase,
  profile_reminder: Star,
  company_verification: BadgeCheck,
  vacancy_moderation: ClipboardList,
  system: BellIcon,
};

export default function NotificationsScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const role = user?.role === 'employer' ? 'employer' : 'candidate';
  const candidateNotifs = useDataStore((s) => s.candidateNotifications);
  const employerNotifs = useDataStore((s) => s.employerNotifications);
  const markAllRead = useDataStore((s) => s.markAllNotificationsRead);
  const markRead = useDataStore((s) => s.markNotificationRead);

  const notifications = role === 'employer' ? employerNotifs : candidateNotifs;

  const today = notifications.filter((n) => {
    const diff = Date.now() - new Date(n.createdAt).getTime();
    return diff < 24 * 60 * 60 * 1000;
  });
  const earlier = notifications.filter((n) => {
    const diff = Date.now() - new Date(n.createdAt).getTime();
    return diff >= 24 * 60 * 60 * 1000;
  });

  const sections = [
    ...(today.length > 0 ? [{ title: tr('notifications.today'), data: today }] : []),
    ...(earlier.length > 0 ? [{ title: tr('notifications.earlier'), data: earlier }] : []),
  ];

  const allItems: Array<{ kind: 'header'; title: string; id: string } | { kind: 'item'; notification: Notification }> = sections.flatMap((section) => [
    { kind: 'header' as const, title: section.title, id: `header-${section.title}` },
    ...section.data.map((item) => ({ kind: 'item' as const, notification: item })),
  ]);

  const renderItem = ({ item }: { item: typeof allItems[0] }) => {
    if (item.kind === 'header') {
      return (
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...t.overline, paddingHorizontal: s.xl, marginTop: s.xl, marginBottom: s.sm }]}>
          {item.title}
        </Text>
      );
    }

    const notif = item.notification;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => markRead(role, notif.id)}
        style={[
          styles.notifItem,
          {
            paddingHorizontal: s.xl,
            paddingVertical: s.lg,
            backgroundColor: notif.read ? 'transparent' : colors.primaryLight,
          },
        ]}
      >
        <View style={[styles.notifIcon, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}>
          {React.createElement(typeIconMap[notif.type] || BellIcon, { size: 18, color: colors.textSecondary, strokeWidth: 1.8 })}
        </View>
        <View style={[styles.notifContent, { marginLeft: s.md }]}>
          <Text style={[{ color: colors.textPrimary, ...t.labelSmall }]} numberOfLines={1}>
            {notif.title}
          </Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: 2 }]} numberOfLines={2}>
            {notif.body}
          </Text>
          <Text style={[{ color: colors.textTertiary, ...t.caption, marginTop: 4 }]}>
            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!notif.read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={[styles.header, { paddingHorizontal: s.xl }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}>
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, ...t.headingMedium, flex: 1, marginLeft: s.md }]}>
            {tr('notifications.title')}
          </Text>
          <TouchableOpacity onPress={() => markAllRead(role)} activeOpacity={0.7}>
            <Text style={[{ color: colors.primary, ...t.labelSmall }]}>{tr('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={allItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.kind === 'header' ? item.id : item.notification.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <EmptyState
            title={tr('notifications.empty')}
            subtitle={tr('notifications.emptyDesc')}
            icon={<BellIcon size={48} color={colors.textTertiary} strokeWidth={1.2} />}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {},
  notifItem: { flexDirection: 'row', alignItems: 'flex-start' },
  notifIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  notifContent: { flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
