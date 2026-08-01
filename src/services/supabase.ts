import { AppState, Platform } from 'react-native';
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

    // On native, RN suspends timers in the background, so the access-token
    // auto-refresh must be tied to foreground/background transitions —
    // otherwise a session can go stale while backgrounded and trigger an
    // avoidable forced logout on return. (Web keeps its own timer running.)
    if (Platform.OS !== 'web') {
      const client = _supabase;
      const syncAutoRefresh = (state: string) => {
        if (state === 'active') {
          client.auth.startAutoRefresh();
        } else {
          client.auth.stopAutoRefresh();
        }
      };
      syncAutoRefresh(AppState.currentState);
      AppState.addEventListener('change', syncAutoRefresh);
    }
  }
  return _supabase;
}
