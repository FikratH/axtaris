import { ChatMessage, Conversation, ConversationKind } from '@/types/models';
import { getSupabase, shouldUseMockBackend } from './supabase';

interface ConversationRow {
  id: string;
  kind: ConversationKind;
  application_id: string | null;
  vacancy_id: string | null;
  company_id: string | null;
  participant_a: string;
  participant_b: string | null;
  subject: string | null;
  last_message: string | null;
  last_message_at: string;
  created_at: string;
  vacancy_title: string | null;
  candidate_name: string | null;
  company_name: string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  kind: 'text' | 'image' | null;
  image_url: string | null;
  created_at: string;
}

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    kind: row.kind,
    applicationId: row.application_id || undefined,
    vacancyId: row.vacancy_id || undefined,
    companyId: row.company_id || undefined,
    participantA: row.participant_a,
    participantB: row.participant_b || undefined,
    subject: row.subject || undefined,
    lastMessage: row.last_message || undefined,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    vacancyTitle: row.vacancy_title || undefined,
    candidateName: row.candidate_name || undefined,
    companyName: row.company_name || undefined,
  };
}

function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    kind: row.kind === 'image' ? 'image' : 'text',
    imageUrl: row.image_url || undefined,
    createdAt: row.created_at,
  };
}

// ── Mock in-memory store (dev / no backend) ──────────────────────────────────
const mockConversations: Conversation[] = [];
const mockMessages: ChatMessage[] = [];
let mockSeq = 1;
const nextId = () => `mock-${mockSeq++}-${mockConversations.length + mockMessages.length}`;

export interface EnsureApplicationConversationParams {
  applicationId: string;
  vacancyId?: string;
  companyId?: string;
  candidateId: string; // candidate's auth user id
  employerId: string; // employer owner's auth user id
  currentUserId: string; // the authenticated initiator — becomes participant_a (RLS insert requires auth.uid() = participant_a)
  subject?: string;
  candidateName?: string;
  companyName?: string;
  vacancyTitle?: string;
}

class ChatService {
  async listConversations(userId: string): Promise<Conversation[]> {
    if (!userId) return [];

    if (shouldUseMockBackend()) {
      return [...mockConversations]
        .filter((c) => c.participantA === userId || c.participantB === userId)
        .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
    }

    // RLS already restricts rows to the current user's threads.
    const { data, error } = await getSupabase()
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    return ((data || []) as ConversationRow[]).map(mapConversation);
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (!conversationId) return [];

    if (shouldUseMockBackend()) {
      return mockMessages
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    }

    const { data, error } = await getSupabase()
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) throw new Error(error.message);
    return ((data || []) as MessageRow[]).map(mapMessage);
  }

  async sendMessage(conversationId: string, senderId: string, body: string): Promise<ChatMessage> {
    const text = body.trim();
    if (!conversationId || !senderId || !text) {
      throw new Error('Empty message');
    }

    if (shouldUseMockBackend()) {
      const message: ChatMessage = {
        id: nextId(),
        conversationId,
        senderId,
        body: text,
        kind: 'text',
        createdAt: new Date().toISOString(),
      };
      mockMessages.push(message);
      const conv = mockConversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = text;
        conv.lastMessageAt = message.createdAt;
      }
      return message;
    }

    const { data, error } = await getSupabase()
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body: text })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Best-effort denormalized preview for the conversation list.
    await getSupabase()
      .from('conversations')
      .update({ last_message: text, last_message_at: (data as MessageRow).created_at })
      .eq('id', conversationId);

    return mapMessage(data as MessageRow);
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    if (!conversationId) return null;
    if (shouldUseMockBackend()) {
      return mockConversations.find((c) => c.id === conversationId) || null;
    }
    const { data, error } = await getSupabase()
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapConversation(data as ConversationRow) : null;
  }

  async sendImageMessage(
    conversationId: string,
    senderId: string,
    imageUrl: string,
    caption?: string
  ): Promise<ChatMessage> {
    if (!conversationId || !senderId || !imageUrl) throw new Error('Missing image');
    const body = caption?.trim() || '';

    if (shouldUseMockBackend()) {
      const message: ChatMessage = {
        id: nextId(),
        conversationId,
        senderId,
        body,
        kind: 'image',
        imageUrl,
        createdAt: new Date().toISOString(),
      };
      mockMessages.push(message);
      const conv = mockConversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = body || '📷';
        conv.lastMessageAt = message.createdAt;
      }
      return message;
    }

    const { data, error } = await getSupabase()
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body, kind: 'image', image_url: imageUrl })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    await getSupabase()
      .from('conversations')
      .update({ last_message: body || '📷', last_message_at: (data as MessageRow).created_at })
      .eq('id', conversationId);

    return mapMessage(data as MessageRow);
  }

  async getOrCreateApplicationConversation(
    params: EnsureApplicationConversationParams
  ): Promise<Conversation> {
    if (shouldUseMockBackend()) {
      const existing = mockConversations.find((c) => c.applicationId === params.applicationId);
      if (existing) return existing;
      const participantA = params.currentUserId;
      const participantB = participantA === params.candidateId ? params.employerId : params.candidateId;
      const conv: Conversation = {
        id: nextId(),
        kind: 'application',
        applicationId: params.applicationId,
        vacancyId: params.vacancyId,
        companyId: params.companyId,
        participantA,
        participantB,
        subject: params.subject,
        vacancyTitle: params.vacancyTitle,
        candidateName: params.candidateName,
        companyName: params.companyName,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      mockConversations.push(conv);
      return conv;
    }

    const supa = getSupabase();
    const { data: existingRows, error: findError } = await supa
      .from('conversations')
      .select('*')
      .eq('application_id', params.applicationId)
      .limit(1);

    if (findError) throw new Error(findError.message);
    if (existingRows && existingRows.length > 0) {
      return mapConversation(existingRows[0] as ConversationRow);
    }

    // The creator must be participant_a (RLS insert check). currentUserId is the
    // authenticated initiator, so this is deterministic for both roles — no
    // getUser() round-trip that could null out and pick the wrong participant.
    const participantA = params.currentUserId;
    const participantB = participantA === params.candidateId ? params.employerId : params.candidateId;

    const { data, error } = await supa
      .from('conversations')
      .insert({
        kind: 'application',
        application_id: params.applicationId,
        vacancy_id: params.vacancyId ?? null,
        company_id: params.companyId ?? null,
        participant_a: participantA,
        participant_b: participantB,
        subject: params.subject ?? null,
        vacancy_title: params.vacancyTitle ?? null,
        candidate_name: params.candidateName ?? null,
        company_name: params.companyName ?? null,
      })
      .select('*')
      .single();

    if (error) {
      // Lost an insert race — fetch the row the other side created.
      const { data: retry } = await supa
        .from('conversations')
        .select('*')
        .eq('application_id', params.applicationId)
        .limit(1);
      if (retry && retry.length > 0) return mapConversation(retry[0] as ConversationRow);
      throw new Error(error.message);
    }

    return mapConversation(data as ConversationRow);
  }

  async getOrCreateSupportConversation(userId: string, subject: string): Promise<Conversation> {
    if (shouldUseMockBackend()) {
      const existing = mockConversations.find((c) => c.kind === 'support' && c.participantA === userId);
      if (existing) return existing;
      const conv: Conversation = {
        id: nextId(),
        kind: 'support',
        participantA: userId,
        subject,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      mockConversations.push(conv);
      return conv;
    }

    const supa = getSupabase();
    const { data: existingRows } = await supa
      .from('conversations')
      .select('*')
      .eq('kind', 'support')
      .eq('participant_a', userId)
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      return mapConversation(existingRows[0] as ConversationRow);
    }

    const { data, error } = await supa
      .from('conversations')
      .insert({ kind: 'support', participant_a: userId, subject })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapConversation(data as ConversationRow);
  }

  /**
   * Live subscription to new messages in a conversation via Supabase Realtime.
   * Returns an unsubscribe function. No-op in mock mode.
   */
  subscribeToMessages(conversationId: string, onInsert: (message: ChatMessage) => void): () => void {
    if (shouldUseMockBackend() || !conversationId) {
      return () => undefined;
    }

    const channel = getSupabase()
      .channel(`messages:${conversationId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => onInsert(mapMessage(payload.new as MessageRow))
      )
      .subscribe();

    return () => {
      void getSupabase().removeChannel(channel);
    };
  }
}

export const chatService = new ChatService();
