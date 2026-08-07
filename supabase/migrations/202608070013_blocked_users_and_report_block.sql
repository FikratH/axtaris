-- Report + block for 1:1 chat (Apple Guideline 1.2 / Play policy requires
-- both for UGC + messaging apps). Reporting already worked end-to-end:
-- moderation_flags supports entity_type='user' with a working user-insert
-- RLS policy (202607160001_admin_and_push.sql) and admin review UI already
-- exists (adminService.ts/app/(admin)/moderation.tsx) — only the client
-- affordance to report a user was missing (added separately in app code).
-- Blocking had no backing at all; this adds it.

CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT blocked_users_no_self_block CHECK (blocker_id != blocked_id),
  CONSTRAINT blocked_users_unique UNIQUE (blocker_id, blocked_id)
);
CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- A user can only see/manage their OWN blocklist — never exposed whether
-- someone else has blocked them (standard privacy norm for block features).
CREATE POLICY blocked_users_select ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY blocked_users_insert ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY blocked_users_delete ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- SECURITY DEFINER so this can be referenced from messages_insert's
-- {public}-scoped WITH CHECK without every caller needing a direct grant
-- on blocked_users/conversations (same reasoning as is_company_owner() —
-- see 202608070011's header comment for the underlying Postgres gotcha).
CREATE OR REPLACE FUNCTION public.not_blocked_in_conversation(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.conversations c
    JOIN public.blocked_users b
      ON (b.blocker_id = c.participant_a AND b.blocked_id = c.participant_b)
      OR (b.blocker_id = c.participant_b AND b.blocked_id = c.participant_a)
    WHERE c.id = p_conversation_id
  );
$$;
REVOKE ALL ON FUNCTION public.not_blocked_in_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.not_blocked_in_conversation(uuid) TO authenticated;

-- Additive only: until someone actually blocks another user, blocked_users
-- is empty and this AND-clause is always true, so this is a no-op for every
-- existing conversation/message flow today.
DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND can_access_conversation(conversation_id)
  AND public.not_blocked_in_conversation(conversation_id)
);
