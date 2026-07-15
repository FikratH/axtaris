import { getSupabase, shouldUseMockBackend } from './supabase';

/**
 * Account deletion (App Store / Play Store compliance).
 *
 * Deleting a Supabase auth user cascades through every table (profiles.id
 * references auth.users ON DELETE CASCADE), so this permanently removes all of
 * the user's data. The auth user itself can only be deleted with the service
 * role, so the actual delete runs in the `delete-account` Edge Function
 * (source in supabase/functions/delete-account/). The caller should sign out
 * and route to the role-select screen after this resolves.
 */
class AccountService {
  async deleteAccount(): Promise<void> {
    if (shouldUseMockBackend()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return;
    }

    const { error } = await getSupabase().functions.invoke('delete-account', {
      method: 'POST',
    });

    if (error) throw new Error(error.message);
  }
}

export const accountService = new AccountService();
