-- In-app messaging (ROADMAP north star).
--
-- Two conversation kinds share one table:
--   'application' — a candidate <-> employer thread, gated by an application.
--   'support'     — a (premium) user <-> admin support thread.
--
-- participant_a is always the initiator (candidate / user). participant_b is the
-- counterparty (employer owner). For support threads participant_b is null and
-- any admin can read/reply via is_admin().

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind TEXT NOT NULL DEFAULT 'application' CHECK (kind IN ('application', 'support')),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  vacancy_id UUID REFERENCES public.vacancies(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  participant_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_b UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_application
  ON public.conversations(application_id) WHERE application_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_participant_a ON public.conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_b ON public.conversations(participant_b);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Access helper (SECURITY DEFINER so the messages policy can consult conversations
-- without recursive RLS).
CREATE OR REPLACE FUNCTION public.can_access_conversation(conv UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conv
      AND (
        auth.uid() = c.participant_a
        OR auth.uid() = c.participant_b
        OR (c.kind = 'support' AND public.is_admin())
      )
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.can_access_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_conversation(UUID) TO authenticated;

DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;

CREATE POLICY "conversations_select" ON public.conversations FOR SELECT
  USING (
    auth.uid() = participant_a
    OR auth.uid() = participant_b
    OR (kind = 'support' AND public.is_admin())
  );

CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_a);

CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE
  USING (
    auth.uid() = participant_a
    OR auth.uid() = participant_b
    OR (kind = 'support' AND public.is_admin())
  );

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;

CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (public.can_access_conversation(conversation_id));

CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND public.can_access_conversation(conversation_id));

-- Enable Realtime for live delivery (ignore if already added).
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
