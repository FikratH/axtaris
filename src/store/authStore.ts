import { Platform } from 'react-native';
import { create } from 'zustand';
import { storage } from '@/utils/storage';
import { User, UserRole } from '@/types/models';
import { authService, USE_MOCK_AUTH } from '@/services/authService';
import { clearPushToken } from '@/services/pushService';

export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'pending_verification'
  | 'authenticated'
  | 'refreshing';

interface PendingVerificationState {
  email: string;
  user: User;
}

export interface StoredAccount {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  token: string | null;
  refreshToken?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus;
  selectedRole: UserRole | null;
  pendingVerification: PendingVerificationState | null;
  sessionExpired: boolean;
  isSigningOut: boolean;
  guestRole: UserRole | null;
  isAddingAccount: boolean;
  accounts: StoredAccount[];
  setSelectedRole: (role: UserRole | null) => void;
  setGuestRole: (role: UserRole | null) => void;
  setAddingAccount: (value: boolean) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  completeAuthentication: (user: User, token: string | null, refreshToken?: string | null) => Promise<void>;
  refreshAuthentication: (user: User, token: string | null) => Promise<void>;
  setPendingVerification: (pending: PendingVerificationState | null) => Promise<void>;
  clearPendingVerification: () => Promise<void>;
  clearAuthenticatedSession: () => Promise<void>;
  handleSessionExpired: () => Promise<void>;
  clearSessionExpired: () => void;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  switchAccount: (account: StoredAccount) => Promise<boolean>;
  removeAccount: (id: string) => Promise<void>;
}

const TOKEN_KEY = 'axtaris_auth_token';
const USER_KEY = 'axtaris_user';
const PENDING_VERIFICATION_KEY = 'axtaris_pending_verification';
const ACCOUNTS_KEY = 'axtaris_accounts';

function parseAccounts(value: string | null): StoredAccount[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is StoredAccount =>
        !!a && typeof a.id === 'string' && typeof a.email === 'string' && isValidRole(a.role)
    );
  } catch {
    return [];
  }
}

function upsertAccount(accounts: StoredAccount[], account: StoredAccount): StoredAccount[] {
  const rest = accounts.filter((a) => a.id !== account.id);
  return [account, ...rest].slice(0, 8);
}

function isValidRole(value: unknown): value is UserRole {
  return value === 'candidate' || value === 'employer' || value === 'admin';
}

function isValidUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.fullName === 'string' &&
    isValidRole(user.role) &&
    typeof user.emailVerified === 'boolean' &&
    typeof user.createdAt === 'string' &&
    typeof user.updatedAt === 'string'
  );
}

function parseStoredUser(value: string | null): User | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return isValidUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parsePendingVerification(
  value: string | null
): PendingVerificationState | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    if (
      typeof parsed.email === 'string' &&
      isValidUser(parsed.user) &&
      parsed.user.email === parsed.email
    ) {
      return {
        email: parsed.email,
        user: parsed.user,
      };
    }
  } catch {}

  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  authStatus: 'loading',
  selectedRole: null,
  pendingVerification: null,
  sessionExpired: false,
  isSigningOut: false,
  guestRole: null,
  isAddingAccount: false,
  accounts: [],

  setSelectedRole: (role) => set({ selectedRole: role }),

  setGuestRole: (role) => set({ guestRole: role }),

  setAddingAccount: (value) => set({ isAddingAccount: value }),

  updateUser: async (updates) => {
    const currentUser = get().user;

    if (!currentUser) {
      return;
    }

    const nextUser: User = {
      ...currentUser,
      ...updates,
      updatedAt: updates.updatedAt || new Date().toISOString(),
    };

    await storage.setItem(USER_KEY, JSON.stringify(nextUser));

    set({
      user: nextUser,
      selectedRole: nextUser.role,
    });
  },

  completeAuthentication: async (user, token, refreshToken) => {
    // On web `storage` falls back to plaintext localStorage, so never persist
    // session tokens for the background account list there — keep only display
    // fields. Native uses encrypted SecureStore, so instant switching is safe.
    const isWeb = Platform.OS === 'web';
    const account: StoredAccount = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      token: isWeb ? null : token,
      refreshToken: isWeb ? null : refreshToken ?? null,
    };
    const nextAccounts = upsertAccount(get().accounts, account);

    await Promise.all([
      storage.setItem(USER_KEY, JSON.stringify(user)),
      token ? storage.setItem(TOKEN_KEY, token) : storage.removeItem(TOKEN_KEY),
      storage.removeItem(PENDING_VERIFICATION_KEY),
      storage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts)),
    ]);

    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      authStatus: 'authenticated',
      selectedRole: user.role,
      pendingVerification: null,
      sessionExpired: false,
      isSigningOut: false,
      guestRole: null,
      isAddingAccount: false,
      accounts: nextAccounts,
    });
  },

  refreshAuthentication: async (user, token) => {
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      authStatus: 'refreshing',
      selectedRole: user.role,
      sessionExpired: false,
    });

    await Promise.all([
      storage.setItem(USER_KEY, JSON.stringify(user)),
      token ? storage.setItem(TOKEN_KEY, token) : storage.removeItem(TOKEN_KEY),
    ]);

    set({
      user,
      token,
      authStatus: 'authenticated',
    });
  },

  setPendingVerification: async (pending) => {
    if (pending) {
      await Promise.all([
        storage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(pending)),
        storage.removeItem(TOKEN_KEY),
        storage.removeItem(USER_KEY),
      ]);
    } else {
      await storage.removeItem(PENDING_VERIFICATION_KEY);
    }

    set((state) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      authStatus: pending ? 'pending_verification' : 'unauthenticated',
      selectedRole: pending?.user.role || state.selectedRole,
      pendingVerification: pending,
      sessionExpired: false,
      isSigningOut: false,
    }));
  },

  clearPendingVerification: async () => {
    await storage.removeItem(PENDING_VERIFICATION_KEY);

    set((state) => ({
      pendingVerification: null,
      authStatus: state.isAuthenticated ? 'authenticated' : 'unauthenticated',
      isLoading: false,
    }));
  },

  clearAuthenticatedSession: async () => {
    await Promise.all([
      storage.removeItem(TOKEN_KEY),
      storage.removeItem(USER_KEY),
    ]);

    set((state) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      authStatus: state.pendingVerification
        ? 'pending_verification'
        : 'unauthenticated',
      sessionExpired: false,
      isSigningOut: false,
    }));
  },

  handleSessionExpired: async () => {
    await Promise.all([
      storage.removeItem(TOKEN_KEY),
      storage.removeItem(USER_KEY),
    ]);

    set((state) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      authStatus: state.pendingVerification
        ? 'pending_verification'
        : 'unauthenticated',
      selectedRole: state.user?.role || state.selectedRole,
      sessionExpired: true,
      isSigningOut: false,
    }));
  },

  clearSessionExpired: () => set({ sessionExpired: false }),

  signOut: async () => {
    const previousUserId = get().user?.id;
    set({ isSigningOut: true, sessionExpired: false });

    // Clear the push token while we still have a valid session (RLS-permitted),
    // so a signed-out device stops receiving the previous user's notifications.
    if (previousUserId) {
      await clearPushToken(previousUserId);
    }

    try {
      await authService.signOut();
    } catch {}

    await Promise.all([
      storage.removeItem(TOKEN_KEY),
      storage.removeItem(USER_KEY),
      storage.removeItem(PENDING_VERIFICATION_KEY),
    ]);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      authStatus: 'unauthenticated',
      selectedRole: null,
      pendingVerification: null,
      sessionExpired: false,
      isSigningOut: false,
    });
  },

  loadSession: async () => {
    set({
      isLoading: true,
      authStatus: 'loading',
      sessionExpired: false,
    });

    try {
      const pendingJson = await storage.getItem(PENDING_VERIFICATION_KEY);
      const pendingVerification = parsePendingVerification(pendingJson);

      if (pendingVerification) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          authStatus: 'pending_verification',
          selectedRole: pendingVerification.user.role,
          pendingVerification,
          sessionExpired: false,
          isSigningOut: false,
        });
        return;
      }

      if (pendingJson) {
        await storage.removeItem(PENDING_VERIFICATION_KEY);
      }

      if (USE_MOCK_AUTH) {
        const [token, userJson] = await Promise.all([
          storage.getItem(TOKEN_KEY),
          storage.getItem(USER_KEY),
        ]);
        const user = parseStoredUser(userJson);

        if (token && user) {
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            authStatus: 'authenticated',
            selectedRole: user.role,
            pendingVerification: null,
            sessionExpired: false,
            isSigningOut: false,
          });
          return;
        }

        await Promise.all([
          storage.removeItem(TOKEN_KEY),
          storage.removeItem(USER_KEY),
        ]);

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          authStatus: 'unauthenticated',
          pendingVerification: null,
          sessionExpired: false,
          isSigningOut: false,
        });
        return;
      }

      await Promise.all([
        storage.removeItem(TOKEN_KEY),
        storage.removeItem(USER_KEY),
      ]);

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        authStatus: 'loading',
        pendingVerification: get().pendingVerification,
        sessionExpired: false,
        isSigningOut: false,
      });
    } catch {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        authStatus: 'unauthenticated',
        pendingVerification: null,
        sessionExpired: false,
        isSigningOut: false,
      });
    }
  },

  loadAccounts: async () => {
    const stored = await storage.getItem(ACCOUNTS_KEY);
    set({ accounts: parseAccounts(stored) });
  },

  switchAccount: async (account) => {
    if (account.id === get().user?.id) return true;

    if (USE_MOCK_AUTH) {
      const user: User = {
        id: account.id,
        email: account.email,
        role: account.role,
        fullName: account.fullName,
        avatarUrl: account.avatarUrl,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await get().completeAuthentication(user, account.token, account.refreshToken);
      return true;
    }

    if (!account.refreshToken) return false;

    try {
      const restored = await authService.restoreRecoverySession(
        account.token || '',
        account.refreshToken
      );
      // Persist the ROTATED refresh token, not the consumed one, or the next
      // switch would replay a used token and trip Supabase reuse-detection.
      await get().completeAuthentication(restored.user, restored.token, restored.refreshToken);
      return true;
    } catch {
      return false;
    }
  },

  removeAccount: async (id) => {
    const nextAccounts = get().accounts.filter((a) => a.id !== id);
    await storage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    set({ accounts: nextAccounts });
  },
}));
