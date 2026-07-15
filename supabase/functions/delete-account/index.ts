// Supabase Edge Function: delete-account
//
// Permanently deletes the authenticated user (and, via ON DELETE CASCADE from
// public.profiles → auth.users, all of their data). Required for App Store /
// Play Store account-deletion compliance.
//
// Deploy:  supabase functions deploy delete-account
// It uses the SUPABASE_SERVICE_ROLE_KEY secret (set automatically for functions)
// and authenticates the caller with their JWT so a user can only delete
// themselves.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '').trim();

    if (!jwt) {
      return json({ error: 'Missing authorization token' }, 401);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user) {
      return json({ error: 'Invalid or expired session' }, 401);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id);
    if (deleteError) {
      return json({ error: deleteError.message }, 500);
    }

    return json({ success: true }, 200);
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
