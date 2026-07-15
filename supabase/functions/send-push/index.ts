// Supabase Edge Function: send-push
//
// Sends an Expo push notification to a user. Invoke server-side (e.g. from a
// database trigger via pg_net when a row is inserted into public.notifications,
// or from another Edge Function) with JSON: { userId, title, body, data }.
//
// It looks up the recipient's expo_push_token with the service role and POSTs
// to Expo's push service. Deploy:  supabase functions deploy send-push
//
// To fire automatically on every in-app notification, add a trigger that calls
// this function with net.http_post (see PUNCHLIST.md).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Server-to-server only: the caller (DB trigger / backend) must present the
    // shared secret. If PUSH_SECRET is unset, refuse everything (safe default).
    const secret = Deno.env.get('PUSH_SECRET');
    if (!secret || req.headers.get('x-push-secret') !== secret) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { userId, title, body, data } = await req.json();
    if (!userId || !title) return json({ error: 'userId and title are required' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: profile, error } = await admin
      .from('profiles')
      .select('expo_push_token')
      .eq('id', userId)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);

    const token = profile?.expo_push_token;
    if (!token) return json({ skipped: 'no push token' }, 200);

    const expoResp = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title,
        body: body ?? '',
        data: data ?? {},
        sound: 'default',
        priority: 'high',
      }),
    });

    return json(await expoResp.json(), 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
