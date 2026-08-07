-- Closes the other half of PUNCHLIST.md's "5-minute realtime message gap
-- with no push safety net" finding: chat messages never inserted a
-- notifications row, so there was no push-notification fallback at all if
-- the recipient's realtime socket had dropped (e.g. app backgrounded).
-- Mirrors the existing application-notification pattern exactly
-- (create_application_insert_notification/create_application_status_notification,
-- 202605060000_initial_schema.sql) — an AFTER INSERT trigger, not
-- client-side code, so a notification is created even if the client that
-- sent the message crashes or closes immediately after. Insert into
-- notifications is exactly what the existing send-push Edge Function
-- trigger (202608020001_push_delivery_trigger.sql) already listens for, so
-- this closes the loop with no changes needed to the push pipeline itself.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_message';

CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  sender_name TEXT;
BEGIN
  SELECT CASE WHEN c.participant_a = NEW.sender_id THEN c.participant_b ELSE c.participant_a END
  INTO target_user_id
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  -- Support conversations have no participant_b (admin-side, not a single
  -- user to notify) - nothing to do.
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    target_user_id,
    'new_message',
    COALESCE(sender_name, 'AxtarIS'),
    CASE WHEN NEW.kind = 'image' THEN '📷 Şəkil' ELSE left(NEW.body, 140) END,
    jsonb_build_object('conversationId', NEW.conversation_id, 'messageId', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS messages_notify_recipient ON public.messages;
CREATE TRIGGER messages_notify_recipient
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.create_message_notification();
