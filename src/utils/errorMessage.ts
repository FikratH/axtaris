import type { TFunction } from 'i18next';

/**
 * Maps a thrown error to a safe, user-facing message. Prevents raw
 * Postgres/PostgREST/RLS text (e.g. `null value in column "name" ...`) from
 * leaking into user-facing dialogs. Short app-thrown messages pass through;
 * anything that looks like a database/internal error becomes a generic message.
 */
export function toUserMessage(error: unknown, tr: TFunction): string {
  const raw =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const lower = raw.toLowerCase();

  if (!raw) return tr('errors.generic');

  if (
    lower.includes('duplicate key') ||
    lower.includes('already exists') ||
    (lower.includes('unique') && lower.includes('constraint'))
  ) {
    return tr('errors.duplicate');
  }
  if (
    lower.includes('row-level security') ||
    lower.includes('violates row-level') ||
    lower.includes('permission denied') ||
    lower.includes('not authorized')
  ) {
    return tr('errors.permission');
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('timeout')
  ) {
    return tr('errors.network');
  }
  // Any other database/internal-shaped error → generic (never leak internals).
  if (
    lower.includes('null value in column') ||
    lower.includes('violates') ||
    lower.includes('constraint') ||
    lower.includes('relation ') ||
    lower.includes('column ') ||
    lower.includes('syntax error') ||
    lower.includes('jwt') ||
    lower.includes('pgrst') ||
    lower.includes('supabase')
  ) {
    return tr('errors.generic');
  }
  // Short, human app-thrown messages (e.g. "Daily application limit reached")
  // are safe to show as-is.
  return raw;
}
