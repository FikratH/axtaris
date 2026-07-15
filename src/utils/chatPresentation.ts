import type { TFunction } from 'i18next';
import { Conversation, UserRole } from '@/types/models';

/**
 * The conversation title/counterparty are computed from the VIEWER's own role,
 * not from participant ordering — because getOrCreateApplicationConversation
 * sets participant_a to whoever opens the thread first, so a single stored
 * subject can't read correctly for both sides.
 */

export function getConversationTitle(
  conv: Conversation,
  viewerRole: UserRole | undefined,
  tr: TFunction
): string {
  if (conv.kind === 'support') return conv.subject || tr('chat.support');
  const vacancy = conv.vacancyTitle || conv.subject || tr('chat.title');
  if (viewerRole === 'employer') {
    return `${conv.candidateName || tr('chat.roleApplicant')} · ${vacancy}`;
  }
  return `${conv.companyName || tr('chat.roleEmployer')} · ${vacancy}`;
}

export interface Counterparty {
  name: string;
  roleLabel: string;
  vacancyTitle?: string;
}

export function getConversationCounterparty(
  conv: Conversation,
  viewerRole: UserRole | undefined,
  tr: TFunction
): Counterparty {
  if (conv.kind === 'support') {
    return { name: tr('chat.support'), roleLabel: tr('chat.support') };
  }
  if (viewerRole === 'employer') {
    return {
      name: conv.candidateName || tr('chat.roleApplicant'),
      roleLabel: tr('chat.roleApplicant'),
      vacancyTitle: conv.vacancyTitle,
    };
  }
  return {
    name: conv.companyName || tr('chat.roleEmployer'),
    roleLabel: tr('chat.roleEmployer'),
    vacancyTitle: conv.vacancyTitle,
  };
}
