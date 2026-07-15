import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useMessages, useSendMessage } from '@/hooks/useChat';
import { ChatMessage } from '@/types/models';

export default function ChatThreadScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; subject?: string }>();
  const conversationId = typeof params.id === 'string' ? params.id : '';
  const title = typeof params.subject === 'string' && params.subject ? params.subject : tr('chat.title');
  const user = useAuthStore((st) => st.user);

  const { data: messages = [], isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId, user?.id);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || sendMessage.isPending) return;
    setDraft('');
    sendMessage.mutate(text, {
      onError: () => setDraft(text),
    });
  }, [draft, sendMessage]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const mine = item.senderId === user?.id;
      return (
        <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: mine ? colors.primary : colors.surfaceSecondary,
                borderTopRightRadius: mine ? 4 : 16,
                borderTopLeftRadius: mine ? 16 : 4,
              },
            ]}
          >
            <Text style={[{ color: mine ? '#FFFFFF' : colors.textPrimary }, t.bodyMedium]}>{item.body}</Text>
          </View>
        </View>
      );
    },
    [colors, t, user?.id]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[{ color: colors.textPrimary, flex: 1, marginHorizontal: 8 }, t.headingSmall]}>
          {title}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: s.lg, paddingBottom: s.lg, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[{ color: colors.textTertiary, textAlign: 'center' }, t.bodyMedium]}>{tr('chat.empty')}</Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      <View
        style={[
          styles.inputBar,
          { borderTopColor: colors.divider, backgroundColor: colors.surface, paddingBottom: insets.bottom + 8 },
        ]}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={tr('chat.messagePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderRadius: r.lg }]}
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!draft.trim() || sendMessage.isPending}
          style={[styles.sendBtn, { backgroundColor: draft.trim() ? colors.primary : colors.surfaceSecondary }]}
        >
          <Send size={18} color={draft.trim() ? '#FFFFFF' : colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  bubbleRow: { flexDirection: 'row', marginBottom: 8 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
