import { create } from 'zustand';
import { storage } from '@/utils/storage';
import { User, UserRole } from '@/types/models';
import { authService, USE_MOCK_AUTH } from '@/services/authService';

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
  setSelectedRole: (role: UserRole | null) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  completeAuthentication: (user: User, token: string | null) => Promise<void>;
  refreshAuthentication: (user: User, token: string | null) => Promise<void>;
  setPendingVerification: (pending: PendingVerificationState | null) => Promise<void>;
  clearPendingVerification: () => Promise<void>;
  clearAuthenticatedSession: () => Promise<void>;
  handleSessionExpired: () => Promise<void>;
  clearSessionExpired: () => void;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
}

const TOKEN_KEY = 'axtaris_auth_token';
const USER_KEY = 'axtaris_user';
const PENDING_VERIFICATION_KEY = 'axtaris_pending_verification';

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

  setSelectedRole: (role) => set({ selectedRole: role }),

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

  completeAuthentication: async (user, token) => {
    await Promise.all([
      storage.setItem(USER_KEY, JSON.stringify(user)),
      token ? storage.setItem(TOKEN_KEY, token) : storage.removeItem(TOKEN_KEY),
      storage.removeItem(PENDING_VERIFICATION_KEY),
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
    set({ isSigningOut: true, sessionExpired: false });

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
}));
