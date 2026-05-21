import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const PLACEHOLDER_URL = 'https://your-project.supabase.co';

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

async function ensureBucket(client, bucket) {
  const { data, error } = await client.storage.getBucket(bucket.id);

  if (error && !/not found/i.test(error.message)) {
    throw new Error(`${bucket.id}: ${error.message}`);
  }

  if (data) {
    const { error: updateError } = await client.storage.updateBucket(bucket.id, bucket.options);

    if (updateError) {
      throw new Error(`${bucket.id}: ${updateError.message}`);
    }

    console.log(`OK  updated bucket ${bucket.id}`);
    return;
  }

  const { error: createError } = await client.storage.createBucket(bucket.id, bucket.options);

  if (createError) {
    throw new Error(`${bucket.id}: ${createError.message}`);
  }

  console.log(`OK  created bucket ${bucket.id}`);
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const supabaseUrl = assertEnv('EXPO_PUBLIC_SUPABASE_URL', PLACEHOLDER_URL);
const secretKey = assertEnv('SUPABASE_SERVICE_ROLE_KEY');

const admin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

await Promise.all([
  ensureBucket(admin, {
    id: 'cv-uploads',
    options: {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    },
  }),
  ensureBucket(admin, {
    id: 'avatars',
    options: {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    },
  }),
  ensureBucket(admin, {
    id: 'company-media',
    options: {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    },
  }),
]);

console.log('Supabase storage buckets are configured.');
