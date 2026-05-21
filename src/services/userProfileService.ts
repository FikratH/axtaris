import { getSupabase, shouldUseMockBackend } from './supabase';

class UserProfileService {
  async updateAvatar(userId: string, avatarUrl?: string): Promise<void> {
    if (!userId) {
      throw new Error('User id is required');
    }

    if (shouldUseMockBackend()) {
      return;
    }

    const { error: profileError } = await getSupabase()
      .from('profiles')
      .update({ avatar_url: avatarUrl || null })
      .eq('id', userId);

    if (profileError) {
      throw new Error(profileError.message);
    }

    const {
      data: { user },
      error: authUserError,
    } = await getSupabase().auth.getUser();

    if (authUserError) {
      throw new Error(authUserError.message);
    }

    if (user?.id === userId) {
      const { error: updateAuthError } = await getSupabase().auth.updateUser({
        data: {
          avatar_url: avatarUrl || null,
        },
      });

      if (updateAuthError) {
        throw new Error(updateAuthError.message);
      }
    }
  }
}

export const userProfileService = new UserProfileService();
