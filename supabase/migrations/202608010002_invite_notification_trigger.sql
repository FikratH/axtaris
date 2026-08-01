-- ============================================================
-- Deliver a candidate notification when an employer sends a talent
-- invite. The client used to best-effort INSERT this notification, but
-- the notifications RLS only allows a user to insert their OWN rows, so
-- the employer's insert was silently denied and invites never notified
-- the candidate. This mirrors the existing applications notification
-- triggers (SECURITY DEFINER bypasses RLS the client cannot satisfy).
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_invite_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  company_name TEXT;
BEGIN
  SELECT cp.user_id
  INTO target_user_id
  FROM public.candidate_profiles cp
  WHERE cp.id = NEW.candidate_id;

  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.name
  INTO company_name
  FROM public.companies c
  WHERE c.id = NEW.company_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    target_user_id,
    'system',
    COALESCE(company_name, 'İşəgötürən') || ' sizi dəvət etdi',
    COALESCE(NULLIF(btrim(NEW.message), ''), 'Bir işəgötürən sizi müraciət etməyə dəvət etdi.'),
    jsonb_build_object('type', 'invite', 'inviteId', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS candidate_invites_notify ON public.candidate_invites;
CREATE TRIGGER candidate_invites_notify
  AFTER INSERT ON public.candidate_invites
  FOR EACH ROW EXECUTE FUNCTION public.create_invite_notification();
