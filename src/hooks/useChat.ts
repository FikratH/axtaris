import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService, EnsureApplicationConversationParams } from '@/services/chatService';
import { analyticsService } from '@/services/analyticsService';
import { ChatMessage } from '@/types/models';

export const chatKeys = {
  conversations: (userId?: string) => ['chat', 'conversations', userId] as const,
  messages: (conversationId?: string) => ['chat', 'messages', conversationId] as const,
};

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: chatKeys.conversations(userId),
    queryFn: () => chatService.listConversations(userId || ''),
    enabled: !!userId,
    refetchInterval: 20000, // light fallback so the list stays fresh without realtime
  });
}

export function useMessages(conversationId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => chatService.getMessages(conversationId || ''),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = chatService.subscribeToMessages(conversationId, (message) => {
      queryClient.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (cur) => {
        const existing = cur || [];
        if (existing.some((m) => m.id === message.id)) return existing;
        return [...existing, message];
      });
    });
    return unsubscribe;
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage(conversationId?: string, userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => chatService.sendMessage(conversationId || '', userId || '', body),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (cur) => {
        const existing = cur || [];
        if (existing.some((m) => m.id === message.id)) return existing;
        return [...existing, message];
      });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      analyticsService.track('message_sent', { conversationId }, userId);
    },
  });
}

export function useStartApplicationChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: EnsureApplicationConversationParams) =>
      chatService.getOrCreateApplicationConversation(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] }),
  });
}

export function useStartSupportChat(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subject: string) => chatService.getOrCreateSupportConversation(userId || '', subject),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] }),
  });
}
