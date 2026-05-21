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

async function signIn(supabaseUrl, anonKey, email, password) {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) throw new Error(`sign in ${email}: ${error.message}`);

  return client;
}

async function uploadAndRecord(client, userId, bucket, path, body, contentType, isPublic) {
  const { error: uploadError } = await client.storage.from(bucket).upload(path, body, {
    cacheControl: '3600',
    contentType,
    upsert: true,
  });

  if (uploadError) throw new Error(`upload ${bucket}/${path}: ${uploadError.message}`);

  const fileUrl = isPublic
    ? client.storage.from(bucket).getPublicUrl(path).data.publicUrl
    : `storage://${bucket}/${path}`;

  const { error: recordError } = await client.from('uploaded_files').insert({
    user_id: userId,
    file_name: path.split('/').at(-1),
    file_url: fileUrl,
    file_type: contentType,
    file_size: body.size,
    storage_provider: 'supabase',
    storage_bucket: bucket,
    storage_path: path,
    is_public: isPublic,
  });

  if (recordError) throw new Error(`uploaded_files insert ${bucket}/${path}: ${recordError.message}`);
}

async function expectUploadedFile(admin, userId, bucket, path) {
  const { data, error } = await admin
    .from('uploaded_files')
    .select('id')
    .eq('user_id', userId)
    .eq('storage_bucket', bucket)
    .eq('storage_path', path)
    .maybeSingle();

  if (error) throw new Error(`uploaded_files read ${bucket}/${path}: ${error.message}`);
  if (!data) throw new Error(`uploaded_files row missing for ${bucket}/${path}`);
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const supabaseUrl = assertEnv('EXPO_PUBLIC_SUPABASE_URL', PLACEHOLDER_URL);
const anonKey = assertEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', PLACEHOLDER_ANON);
const secretKey = assertEnv('SUPABASE_SERVICE_ROLE_KEY');
const admin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `AxtarisSmoke-${runId}!`;
const candidateEmail = `axtaris-smoke-candidate-${runId}@example.com`;
const employerEmail = `axtaris-smoke-employer-${runId}@example.com`;

const createdUserIds = [];
const storageObjects = [];
const createdCompanyIds = [];

try {
  const { data: candidateData, error: candidateError } = await admin.auth.admin.createUser({
    email: candidateEmail,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'candidate',
      full_name: 'AxtarIS Smoke Candidate',
    },
  });
  if (candidateError) throw new Error(`create candidate: ${candidateError.message}`);
  const candidateId = candidateData.user.id;
  createdUserIds.push(candidateId);

  const { data: employerData, error: employerError } = await admin.auth.admin.createUser({
    email: employerEmail,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'employer',
      full_name: 'AxtarIS Smoke Employer',
      company_name: 'AxtarIS Smoke Company',
    },
  });
  if (employerError) throw new Error(`create employer: ${employerError.message}`);
  const employerId = employerData.user.id;
  createdUserIds.push(employerId);

  await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));

  const candidate = await signIn(supabaseUrl, anonKey, candidateEmail, password);
  const employer = await signIn(supabaseUrl, anonKey, employerEmail, password);

  const pdfBlob = new Blob(['%PDF-1.4\n%AxtarIS smoke test\n'], { type: 'application/pdf' });
  const pngBlob = new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], {
    type: 'image/png',
  });

  const cvPath = `candidates/${candidateId}/cv/${runId}-cv.pdf`;
  const avatarPath = `profiles/${candidateId}/avatar/${runId}-avatar.png`;
  storageObjects.push({ bucket: 'cv-uploads', path: cvPath });
  storageObjects.push({ bucket: 'avatars', path: avatarPath });

  await uploadAndRecord(candidate, candidateId, 'cv-uploads', cvPath, pdfBlob, 'application/pdf', false);
  await uploadAndRecord(candidate, candidateId, 'avatars', avatarPath, pngBlob, 'image/png', true);

  const { data: company, error: companyError } = await employer
    .from('companies')
    .insert({
      name: 'AxtarIS Smoke Company',
      industry: 'QA',
      owner_id: employerId,
    })
    .select('id')
    .single();

  if (companyError) throw new Error(`company insert: ${companyError.message}`);
  createdCompanyIds.push(company.id);

  const logoPath = `companies/${company.id}/logo/${runId}-logo.png`;
  storageObjects.push({ bucket: 'company-media', path: logoPath });
  await uploadAndRecord(employer, employerId, 'company-media', logoPath, pngBlob, 'image/png', true);

  await expectUploadedFile(admin, candidateId, 'cv-uploads', cvPath);
  await expectUploadedFile(admin, candidateId, 'avatars', avatarPath);
  await expectUploadedFile(admin, employerId, 'company-media', logoPath);

  console.log('OK  candidate CV upload and uploaded_files insert');
  console.log('OK  candidate avatar upload and uploaded_files insert');
  console.log('OK  employer company logo upload and uploaded_files insert');
  console.log('Supabase real upload smoke test passed.');
} finally {
  await Promise.allSettled(
    storageObjects.map((object) => admin.storage.from(object.bucket).remove([object.path]))
  );

  if (createdUserIds.length > 0) {
    await admin.from('uploaded_files').delete().in('user_id', createdUserIds);
  }

  if (createdCompanyIds.length > 0) {
    await admin.from('companies').delete().in('id', createdCompanyIds);
  }

  await Promise.allSettled(createdUserIds.map((userId) => admin.auth.admin.deleteUser(userId)));
}
