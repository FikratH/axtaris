import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const PLACEHOLDER_URL = 'https://your-project.supabase.co';
const PLACEHOLDER_ANON = 'your-anon-key';

function loadEnvFile(fileName) {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...rest] = trimmed.split('=');
    if (process.env[key]) continue;

    const rawValue = rest.join('=').trim();
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

function assertEnv(name, placeholder) {
  const value = process.env[name]?.trim();

  if (!value || value === placeholder) {
    throw new Error(`${name} is missing or still set to a placeholder`);
  }

  return value;
}

async function checkQuery(label, query) {
  const { error } = await query;

  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }

  console.log(`OK  ${label}`);
}

async function checkBucket(client, bucketId) {
  const { error } = await client.storage.getBucket(bucketId);

  if (error) {
    throw new Error(`storage bucket ${bucketId}: ${error.message}`);
  }

  console.log(`OK  storage bucket ${bucketId}`);
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const supabaseUrl = assertEnv('EXPO_PUBLIC_SUPABASE_URL', PLACEHOLDER_URL);
const anonKey = assertEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', PLACEHOLDER_ANON);
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_KEY?.trim();

const anon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const admin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

console.log(`Checking Supabase project ${supabaseUrl}`);

await checkQuery(
  'anon can reach public profiles schema',
  anon.from('profiles').select('id', { head: true, count: 'exact' })
);

if (!admin) {
  console.log('SKIP service-role checks; set SUPABASE_SERVICE_ROLE_KEY to verify private tables and buckets.');
  process.exit(0);
}

await checkQuery(
  'applications review metadata columns exist',
  admin
    .from('applications')
    .select('id,employer_notes,employer_rating', { head: true, count: 'exact' })
);

await checkQuery(
  'uploaded_files storage metadata columns exist',
  admin
    .from('uploaded_files')
    .select(
      'id,user_id,file_name,file_url,file_type,file_size,storage_provider,storage_bucket,storage_path,is_public,created_at',
      { head: true, count: 'exact' }
    )
);

await Promise.all([
  checkBucket(admin, 'cv-uploads'),
  checkBucket(admin, 'avatars'),
  checkBucket(admin, 'company-media'),
]);

console.log('Supabase schema and storage bucket checks passed.');
