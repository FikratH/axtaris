export type AppEnv = 'development' | 'staging' | 'production';

const SUPABASE_URL_PLACEHOLDER = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY_PLACEHOLDER = 'your-anon-key';

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();

  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  return undefined;
}

function normalizeAppEnv(value: string | undefined): AppEnv {
  switch ((value || '').trim().toLowerCase()) {
    case 'production':
      return 'production';
    case 'staging':
      return 'staging';
    default:
      return 'development';
  }
}

const appEnv = normalizeAppEnv(process.env.EXPO_PUBLIC_APP_ENV);
const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const explicitMockAuth = parseBoolean(process.env.EXPO_PUBLIC_ENABLE_MOCK_AUTH);
const explicitRequireBackend = parseBoolean(process.env.EXPO_PUBLIC_REQUIRE_REAL_BACKEND);

const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl !== SUPABASE_URL_PLACEHOLDER &&
  supabaseAnonKey !== SUPABASE_ANON_KEY_PLACEHOLDER;

const requireRealBackend = explicitRequireBackend ?? appEnv !== 'development';
const useMockAuth = explicitMockAuth ?? (appEnv === 'development' ? !isSupabaseConfigured : false);

export const runtimeConfig = {
  appEnv,
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  requireRealBackend,
  useMockAuth,
  isDevelopment: appEnv === 'development',
  isStaging: appEnv === 'staging',
  isProduction: appEnv === 'production',
} as const;

export function getRuntimeValidationError(): Error | null {
  if (runtimeConfig.requireRealBackend && !runtimeConfig.isSupabaseConfigured) {
    return new Error(
      'Supabase runtime configuration is missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY before running this build.'
    );
  }

  if (!runtimeConfig.isDevelopment && runtimeConfig.useMockAuth) {
    return new Error(
      'Mock auth is enabled outside development. Disable EXPO_PUBLIC_ENABLE_MOCK_AUTH for staging/production builds.'
    );
  }

  return null;
}
