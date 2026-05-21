import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getRuntimeValidationError, runtimeConfig } from '@/config/runtime';
import { storage } from '@/utils/storage';

const supabaseUrl = runtimeConfig.supabaseUrl || 'https://your-project.supabase.co';
const supabaseAnonKey = runtimeConfig.supabaseAnonKey || 'your-anon-key';

let _supabase: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return runtimeConfig.isSupabaseConfigured;
}

export function shouldUseMockBackend(): boolean {
  return runtimeConfig.isDevelopment &&
    !runtimeConfig.requireRealBackend &&
    !runtimeConfig.isSupabaseConfigured;
}

export function getSupabase(): SupabaseClient {
  const validationError = getRuntimeValidationError();

  if (validationError) {
    throw validationError;
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _supabase;
}
