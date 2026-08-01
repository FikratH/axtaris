-- ============================================================
-- Push delivery pipeline — fire the `send-push` Edge Function whenever an
-- in-app notification row is created, so a device that registered its Expo
-- token actually receives a push. Completes the push chain:
--   register token (client, done) → insert notification (done) → THIS → send-push.
--
-- SAFE TO APPLY EVEN BEFORE SETUP: if the shared secret isn't configured yet,
-- the trigger is a no-op, and any error is swallowed so it can NEVER block the
-- in-app notification insert. pg_net's http_post is async (fire-and-forget).
--
-- ── ONE-TIME SETUP REQUIRED for pushes to actually fire ─────────────────────
--   1) Deploy the function WITHOUT jwt verification (it self-authorizes with
--      the x-push-secret header):
--        supabase functions deploy send-push --no-verify-jwt
--   2) Set the shared secret on the function AND in the DB Vault (same value):
--        supabase secrets set PUSH_SECRET=$(openssl rand -hex 24)
--        -- then, in the SQL editor, store the SAME value for the trigger:
--        select vault.create_secret('<same-PUSH_SECRET-value>', 'push_secret');
--   3) (already handled here) pg_net enabled + trigger installed.
-- The anon/publishable key below is public by design (it ships in the app
-- bundle / eas.json) — it is NOT the secret; PUSH_SECRET is.
-- ============================================================

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_push_on_notification()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_secret text;
  v_url text := 'https://cwmjyonylopsqrtujuvo.supabase.co/functions/v1/send-push';
  v_anon text := 'sb_publishable_tElHfJFhgJNKSAVkOBkRrg_RRXQ9c9j';
begin
  -- Read the shared secret from Vault; if it isn't set up yet, do nothing.
  begin
    select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'push_secret'
    limit 1;
  exception when others then
    v_secret := null;
  end;

  if v_secret is null or v_secret = '' then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_anon,
      'x-push-secret', v_secret
    ),
    body := jsonb_build_object(
      'userId', new.user_id,
      'title', new.title,
      'body', coalesce(new.body, ''),
      'data', coalesce(new.data, '{}'::jsonb)
    )
  );

  return new;
exception when others then
  -- Never let a delivery hiccup roll back the in-app notification.
  return new;
end;
$$;

drop trigger if exists notifications_send_push on public.notifications;
create trigger notifications_send_push
  after insert on public.notifications
  for each row execute function public.notify_push_on_notification();
