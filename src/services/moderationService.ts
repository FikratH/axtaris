import { getSupabase, shouldUseMockBackend } from './supabase';
import i18n from '@/i18n';

const mockBlocks = new Set<string>();

function blockKey(blockerId: string, blockedId: string): string {
  return `${blockerId}:${blockedId}`;
}

export type ReportableEntityType = 'vacancy' | 'company' | 'user';

export const moderationService = {
  async reportEntity(
    reporterId: string,
    entityType: ReportableEntityType,
    entityId: string,
    reason: string
  ): Promise<void> {
    const trimmedReason = reason.trim();
    if (!reporterId || !entityId || !trimmedReason) {
      throw new Error(i18n.t('errors.reportReasonRequired'));
    }

    if (shouldUseMockBackend()) {
      return;
    }

    const { error } = await getSupabase()
      .from('moderation_flags')
      .insert({ entity_type: entityType, entity_id: entityId, reason: trimmedReason, reported_by: reporterId });
    if (error) throw new Error(error.message);
  },

  async reportUser(reporterId: string, targetUserId: string, reason: string): Promise<void> {
    return this.reportEntity(reporterId, 'user', targetUserId, reason);
  },

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (!blockerId || !blockedId || blockerId === blockedId) return;

    if (shouldUseMockBackend()) {
      mockBlocks.add(blockKey(blockerId, blockedId));
      return;
    }

    const { error } = await getSupabase()
      .from('blocked_users')
      .insert({ blocker_id: blockerId, blocked_id: blockedId });
    // A second block attempt hits the unique constraint — treat as success
    // rather than surfacing an error for an already-satisfied intent.
    if (error && !/duplicate key|unique/i.test(error.message)) throw new Error(error.message);
  },

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    if (!blockerId || !blockedId) return;

    if (shouldUseMockBackend()) {
      mockBlocks.delete(blockKey(blockerId, blockedId));
      return;
    }

    const { error } = await getSupabase()
      .from('blocked_users')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);
    if (error) throw new Error(error.message);
  },

  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    if (!blockerId || !blockedId) return false;

    if (shouldUseMockBackend()) {
      return mockBlocks.has(blockKey(blockerId, blockedId));
    }

    const { data, error } = await getSupabase()
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return !!data;
  },
};
