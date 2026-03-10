import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '@/types/models';
import { mockUser, mockEmployerUser } from './mockData';
import { getSupabase } from './supabase';

export const USE_MOCK_AUTH = true;

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  companyName?: string;
  phone?: string;
}

export interface SignInParams {
  email: string;
  password: string;
  role?: UserRole;
}

function resolveMockRole(email: string, role?: UserRole): UserRole {
  if (role && role !== 'admin') return role;
  if (email.includes('employer') || email.includes('hr')) return 'employer';
  return 'candidate';
}

export function toAppUser(user: SupabaseUser): User {
  return {
    id: user.id,
    email: user.email || '',
    role: (user.user_metadata?.role as UserRole) || 'candidate',
    fullName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      '',
    phone: user.user_metadata?.phone,
    avatarUrl: user.user_metadata?.avatar_url,
    emailVerified: !!user.email_confirmed_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at || user.created_at,
  };
}

class AuthService {
  async signUp(params: SignUpParams): Promise<{ user: User }> {
    if (USE_MOCK_AUTH) {
      await this.delay();
      const user: User = {
        id: Date.now().toString(),
        email: params.email,
        role: params.role,
        fullName: params.fullName,
        phone: params.phone,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { user };
    }

    const { data, error } = await getSupabase().auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          role: params.role,
          company_name: params.companyName,
          phone: params.phone,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed');

    return { user: toAppUser(data.user) };
  }

  async signIn(params: SignInParams): Promise<{ user: User; token: string | null }> {
    if (USE_MOCK_AUTH) {
      await this.delay();
      const role = resolveMockRole(params.email, params.role);
      if (role === 'employer') {
        const user = {
          ...mockEmployerUser,
          email: params.email,
          role,
          emailVerified: true,
          fullName: mockEmployerUser.fullName,
          updatedAt: new Date().toISOString(),
        };
        return { user, token: 'mock-token-employer' };
      }
      const user = {
        ...mockUser,
        email: params.email,
        role,
        emailVerified: true,
        fullName: mockUser.fullName,
        updatedAt: new Date().toISOString(),
      };
      return { user, token: 'mock-token-candidate' };
    }

    const { data, error } = await getSupabase().auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) throw new Error(error.message);
    if (!data.user || !data.session) throw new Error('Sign in failed');

    return { user: toAppUser(data.user), token: data.session.access_token };
  }

  async verifyOTP(
    email: string,
    code: string,
    fallbackUser?: User
  ): Promise<{ user: User; token: string | null } | null> {
    if (USE_MOCK_AUTH) {
      await this.delay();
      if (code !== '123456') return null;

      const role = resolveMockRole(email, fallbackUser?.role);
      const baseUser = role === 'employer' ? mockEmployerUser : mockUser;
      const now = new Date().toISOString();

      return {
        user: {
          ...(fallbackUser || baseUser),
          email,
          role,
          emailVerified: true,
          updatedAt: now,
        },
        token: `mock-token-${role}`,
      };
    }

    const { data, error } = await getSupabase().auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (error) throw new Error(error.message);
    if (!data.user) return null;

    return {
      user: toAppUser(data.user),
      token: data.session?.access_token || null,
    };
  }

  async resendOTP(email: string): Promise<void> {
    if (USE_MOCK_AUTH) {
      await this.delay();
      return;
    }

    const { error } = await getSupabase().auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw new Error(error.message);
  }

  async resetPassword(email: string): Promise<void> {
    if (USE_MOCK_AUTH) {
      await this.delay();
      return;
    }

    const { error } = await getSupabase().auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  }

  async signOut(): Promise<void> {
    if (USE_MOCK_AUTH) {
      await this.delay(100);
      return;
    }

    const { error } = await getSupabase().auth.signOut();
    if (error) throw new Error(error.message);
  }

  async getSession(): Promise<Session | null> {
    if (USE_MOCK_AUTH) return null;

    const { data, error } = await getSupabase().auth.getSession();
    if (error) throw new Error(error.message);
    return data.session || null;
  }

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    return getSupabase().auth.onAuthStateChange(callback);
  }

  private delay(ms = 800): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export const authService = new AuthService();
