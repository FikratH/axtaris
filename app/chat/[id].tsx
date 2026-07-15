import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Send, ImagePlus, X, Briefcase } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/utils/dialog';
import { useAuthStore } from '@/store/authStore';
import { useConversation, useMessages, useSendImageMessage, useSendMessage } from '@/hooks/useChat';
import { useImagePicker } from '@/hooks/useImagePicker';
import { fileStorageService } from '@/services/fileStorageService';
import { ChatMessage } from '@/types/models';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { getConversationCounterparty, getConversationTitle } from '@/utils/chatPresentation';

function ChatImageBubble({ imageUrl, onOpen }: { imageUrl: string; onOpen: (url: string) => void }) {
  const { colors } = useTheme();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fileStorageService
      .resolveFileUrl(imageUrl)
      .then((u) => active && setUrl(u || null))
      .catch(() => active && setUrl(null));
    return () => {
      active = false;
    };
  }, [imageUrl]);

  if (!url) {
    return <View style={[styles.imageThumb, { backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={colors.primary} /></View>;
  }
  return (
    <TouchableOpacity onPress={() => onOpen(url)} activeOpacity={0.9}>
      <Image source={{ uri: url }} style={styles.imageThumb} resizeMode="cover" />
    </TouchableOpacity>
  );
}

export default function ChatThreadScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; subject?: string }>();
  const conversationId = typeof params.id === 'string' ? params.id : '';
  const user = useAuthStore((st) => st.user);

  const { data: conversation } = useConversation(conversationId);
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId, user?.id);
  const sendImage = useSendImageMessage(conversationId, user?.id);
  const imagePicker = useImagePicker({ quality: 0.8 });

  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const title = conversation
    ? getConversationTitle(conversation, user?.role, tr)
    : typeof params.subject === 'string' && params.subject
    ? params.subject
    : tr('chat.title');
  const counterparty = conversation ? getConversationCounterparty(conversation, user?.role, tr) : null;

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || sendMessage.isPending) return;
    setDraft('');
    sendMessage.mutate(text, { onError: () => setDraft(text) });
  }, [draft, sendMessage]);

  const handleAttach = useCallback(async () => {
    if (!user?.id || !conversationId || uploading) return;
    const picked = await imagePicker.showPicker();
    if (!picked) return;
    setUploading(true);
    try {
      const uploaded = await fileStorageService.uploadChatImage(user.id, conversationId, {
        uri: picked.uri,
        fileName: picked.fileName,
        mimeType: picked.type,
        fileSize: picked.fileSize,
      });
      await sendImage.mutateAsync({ imageUrl: uploaded.url });
    } catch (error) {
      Alert.alert(tr('common.error'), error instanceof Error ? error.message : tr('common.error'));
    } finally {
      setUploading(false);
    }
  }, [user?.id, conversationId, uploading, imagePicker, sendImage, tr]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const mine = item.senderId === user?.id;
      const isImage = item.kind === 'image' && !!item.imageUrl;
      return (
        <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
          <View
            style={[
              styles.bubble,
              isImage && styles.imageBubble,
              {
                backgroundColor: isImage ? 'transparent' : mine ? colors.primary : colors.surfaceSecondary,
                borderTopRightRadius: mine ? 4 : 16,
                borderTopLeftRadius: mine ? 16 : 4,
              },
            ]}
          >
            {isImage ? <ChatImageBubble imageUrl={item.imageUrl!} onOpen={setFullscreenUrl} /> : null}
            {item.body ? (
              <Text style={[{ color: mine && !isImage ? '#FFFFFF' : colors.textPrimary, marginTop: isImage ? 6 : 0 }, t.bodyMedium]}>
                {item.body}
              </Text>
            ) : null}
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
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, marginHorizontal: 4 }} onPress={() => setPanelOpen(true)} activeOpacity={0.7}>
          <Text numberOfLines={1} style={[{ color: colors.textPrimary }, t.labelLarge]}>{title}</Text>
          {counterparty ? (
            <Text numberOfLines={1} style={[{ color: colors.textTertiary, marginTop: 1 }, t.caption]}>
              {counterparty.roleLabel}{counterparty.vacancyTitle ? ` · ${tr('chat.tapForDetails')}` : ''}
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: s.lg, flexGrow: 1 }}
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
        <TouchableOpacity onPress={handleAttach} disabled={uploading} style={styles.attachBtn} hitSlop={8}>
          {uploading ? <ActivityIndicator size="small" color={colors.primary} /> : <ImagePlus size={22} color={colors.primary} strokeWidth={1.8} />}
        </TouchableOpacity>
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

      {/* Fullscreen image popup */}
      <Modal visible={!!fullscreenUrl} transparent animationType="fade" onRequestClose={() => setFullscreenUrl(null)}>
        <Pressable style={styles.fullscreenBackdrop} onPress={() => setFullscreenUrl(null)}>
          <TouchableOpacity style={[styles.fullscreenClose, { top: insets.top + 12 }]} onPress={() => setFullscreenUrl(null)} hitSlop={12}>
            <X size={26} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          {fullscreenUrl ? <Image source={{ uri: fullscreenUrl }} style={styles.fullscreenImage} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>

      {/* Details panel (who you're chatting with) */}
      <Modal visible={panelOpen} transparent animationType="slide" onRequestClose={() => setPanelOpen(false)}>
        <Pressable style={styles.panelBackdrop} onPress={() => setPanelOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.panelCard, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.panelHandle} />
            {counterparty ? (
              <>
                <View style={{ alignItems: 'center', marginTop: 8 }}>
                  <Avatar name={counterparty.name} size={64} />
                  <Text style={[{ color: colors.textPrimary, marginTop: 12 }, t.headingSmall]}>{counterparty.name}</Text>
                  <View style={[styles.rolePill, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[{ color: colors.primary }, t.caption]}>{counterparty.roleLabel}</Text>
                  </View>
                </View>
                {counterparty.vacancyTitle ? (
                  <View style={[styles.panelRow, { borderTopColor: colors.divider }]}>
                    <Briefcase size={18} color={colors.textSecondary} strokeWidth={1.8} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[{ color: colors.textTertiary }, t.caption]}>{tr('chat.aboutVacancy')}</Text>
                      <Text style={[{ color: colors.textPrimary, marginTop: 2 }, t.bodyMedium]}>{counterparty.vacancyTitle}</Text>
                    </View>
                  </View>
                ) : null}
                {conversation?.vacancyId ? (
                  <Button
                    title={tr('chat.viewVacancy')}
                    variant="outline"
                    onPress={() => {
                      setPanelOpen(false);
                      router.push({ pathname: '/vacancy/[id]', params: { id: conversation.vacancyId! } } as never);
                    }}
                    style={{ marginTop: 16 }}
                  />
                ) : null}
              </>
            ) : (
              <Text style={[{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }, t.bodyMedium]}>{tr('chat.title')}</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  imageBubble: { padding: 3 },
  imageThumb: { width: 200, height: 150, borderRadius: 12 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  fullscreenBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  fullscreenImage: { width: '100%', height: '80%' },
  fullscreenClose: { position: 'absolute', right: 16, zIndex: 2, padding: 4 },
  panelBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  panelCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  panelHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.4)', marginBottom: 8 },
  rolePill: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  panelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
