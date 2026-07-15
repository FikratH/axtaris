import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MessageCircle, LifeBuoy } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useConversations } from '@/hooks/useChat';
import { EmptyState } from '@/components/ui/EmptyState';
import { Conversation } from '@/types/models';
import { safeBack } from '@/utils/navigation';
import { getConversationTitle } from '@/utils/chatPresentation';

export default function MessagesScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((st) => st.user);
  const { data: conversations = [], isLoading } = useConversations(user?.id);

  const openThread = (c: Conversation) => {
    router.push({ pathname: '/chat/[id]', params: { id: c.id, subject: getConversationTitle(c, user?.role, tr) } } as never);
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const support = item.kind === 'support';
    const title = getConversationTitle(item, user?.role, tr);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openThread(item)}
        style={[styles.row, { borderBottomColor: colors.divider }]}
      >
        <View style={[styles.avatar, { backgroundColor: support ? colors.warning + '20' : colors.primaryLight }]}>
          {support ? (
            <LifeBuoy size={20} color={colors.warning} strokeWidth={1.8} />
          ) : (
            <MessageCircle size={20} color={colors.primary} strokeWidth={1.8} />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: s.md }}>
          <Text numberOfLines={1} style={[{ color: colors.textPrimary }, t.labelMedium]}>
            {title}
          </Text>
          <Text numberOfLines={1} style={[{ color: colors.textTertiary, marginTop: 2 }, t.bodySmall]}>
            {item.lastMessage || tr('chat.noMessages')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => safeBack(router, user?.role === 'employer' ? '/(employer)/dashboard' : '/(candidate)/home')}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[{ color: colors.textPrimary, marginLeft: 4 }, t.headingMedium]}>{tr('chat.messages')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: s.xl, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <EmptyState title={tr('chat.emptyListTitle')} subtitle={tr('chat.emptyListSubtitle')} />
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
