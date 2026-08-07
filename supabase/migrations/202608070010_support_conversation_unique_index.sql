-- One support conversation per user. A double-tap on "Contact support" (or any
-- other concurrent caller) could otherwise create two rows via the
-- getOrCreateSupportConversation check-then-insert race. A pre-existing
-- duplicate (one empty stray row, 0 messages) was deleted before this
-- migration so the index can be created.
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_support_participant
  ON public.conversations(participant_a)
  WHERE kind = 'support';
