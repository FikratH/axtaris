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

    const userId = userData.user.id;

    // Storage objects don't cascade with the auth user — purge them first so
    // CVs/avatars/chat images (PII) don't outlive the account. Best-effort:
    // a storage failure is logged but never blocks the deletion itself.
    try {
      await purgeUserStorage(admin, userId);
    } catch (purgeError) {
      console.error(`[delete-account] storage purge failed for ${userId}:`, purgeError);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return json({ error: deleteError.message }, 500);
    }

    return json({ success: true }, 200);
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});

type AdminClient = ReturnType<typeof createClient>;

/**
 * Remove every storage object the user owns. Primary source of truth is the
 * uploaded_files ledger (user_id, storage_bucket, storage_path); the two
 * deterministic per-user prefixes are swept as well in case any object was
 * written outside the ledger.
 */
async function purgeUserStorage(admin: AdminClient, userId: string): Promise<void> {
  const { data: files, error } = await admin
    .from('uploaded_files')
    .select('storage_bucket, storage_path')
    .eq('user_id', userId);
  if (error) throw new Error(`uploaded_files lookup failed: ${error.message}`);

  const byBucket = new Map<string, string[]>();
  for (const f of files ?? []) {
    const bucket = f.storage_bucket as string;
    const path = f.storage_path as string;
    if (!bucket || !path) continue;
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), path]);
  }

  for (const prefix of [
    { bucket: 'cv-uploads', folder: `candidates/${userId}/cv` },
    { bucket: 'avatars', folder: `profiles/${userId}/avatar` },
  ]) {
    const { data: listed } = await admin.storage
      .from(prefix.bucket)
      .list(prefix.folder, { limit: 1000 });
    for (const entry of listed ?? []) {
      if (entry.name) {
        byBucket.set(prefix.bucket, [
          ...(byBucket.get(prefix.bucket) ?? []),
          `${prefix.folder}/${entry.name}`,
        ]);
      }
    }
  }

  for (const [bucket, paths] of byBucket) {
    const unique = [...new Set(paths)];
    for (let i = 0; i < unique.length; i += 100) {
      const chunk = unique.slice(i, i + 100);
      const { error: removeError } = await admin.storage.from(bucket).remove(chunk);
      if (removeError) {
        console.error(`[delete-account] failed removing ${chunk.length} object(s) from ${bucket}: ${removeError.message}`);
      }
    }
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
