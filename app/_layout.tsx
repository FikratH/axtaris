import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { loadSavedLanguage } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { authService, toAppUser, USE_MOCK_AUTH } from '@/services/authService';
import { useTranslation } from 'react-i18next';
import '@/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AppContent() {
  const { isDark, colors } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const loadSession = useAuthStore((s) => s.loadSession);
  const completeAuthentication = useAuthStore((s) => s.completeAuthentication);
  const refreshAuthentication = useAuthStore((s) => s.refreshAuthentication);
  const clearAuthenticatedSession = useAuthStore((s) => s.clearAuthenticatedSession);
  const handleSessionExpired = useAuthStore((s) => s.handleSessionExpired);
  const clearSessionExpired = useAuthStore((s) => s.clearSessionExpired);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authStatus = useAuthStore((s) => s.authStatus);
  const user = useAuthStore((s) => s.user);
  const pendingVerification = useAuthStore((s) => s.pendingVerification);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const hasOnboarded = useAppStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    loadSavedLanguage();

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const handleAuthChange = async (
      event: AuthChangeEvent,
      session: Session | null
    ) => {
      if (!isMounted) return;

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        await refreshAuthentication(
          toAppUser(session.user),
          session.access_token || null
        );
        return;
      }

      if (
        (event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN' ||
          event === 'USER_UPDATED') &&
        session?.user
      ) {
        await completeAuthentication(
          toAppUser(session.user),
          session.access_token || null
        );
        return;
      }

      if (event === 'SIGNED_OUT') {
        const state = useAuthStore.getState();

        if (state.isSigningOut) return;

        if (state.isAuthenticated) {
          await handleSessionExpired();
        } else {
          await clearAuthenticatedSession();
        }
      }
    };

    const bootstrap = async () => {
      await useAppStore.getState().loadOnboardingStatus();

      await loadSession();

      if (USE_MOCK_AUTH) return;

      const authSubscription = authService.onAuthStateChange((event, session) => {
        void handleAuthChange(event, session);
      });
      unsubscribe = () => authSubscription.data.subscription.unsubscribe();

      if (useAuthStore.getState().authStatus === 'pending_verification') {
        return;
      }

      try {
        const session = await authService.getSession();

        if (!isMounted) return;

        if (session?.user) {
          await completeAuthentication(
            toAppUser(session.user),
            session.access_token || null
          );
        } else {
          await clearAuthenticatedSession();
        }
      } catch {
        if (!isMounted) return;
        await clearAuthenticatedSession();
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [
    clearAuthenticatedSession,
    completeAuthentication,
    handleSessionExpired,
    loadSession,
    refreshAuthentication,
  ]);

  useEffect(() => {
    if (!sessionExpired) return;

    router.replace('/auth/sign-in');
    Alert.alert(
      tr('auth.sessionExpiredTitle'),
      tr('auth.sessionExpiredMessage')
    );
    clearSessionExpired();
  }, [clearSessionExpired, router, sessionExpired, tr]);

  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const firstSegment = segments[0];
    const secondSegment = segments[1];
    const currentPath = segments.join('/');
    const isRootRoute = !firstSegment;
    const isAuthRoute = firstSegment === 'auth';
    const isResetPasswordRoute = currentPath === 'auth/reset-password';
    const isOnboardingRoute = firstSegment === 'onboarding';
    const isLegalRoute = (firstSegment as string) === 'legal';
    const isCandidateOnlyRoute =
      firstSegment === '(candidate)' ||
      firstSegment === 'profile';
    const isEmployerOnlyRoute =
      firstSegment === '(employer)' ||
      (firstSegment === 'vacancy' && secondSegment === 'create') ||
      (firstSegment === 'vacancy' && secondSegment === 'edit') ||
      (firstSegment === 'company' && secondSegment === 'edit');

    if (authStatus === 'pending_verification' && pendingVerification?.email) {
      if (!(isAuthRoute && secondSegment === 'verify-otp')) {
        router.replace({
          pathname: '/auth/verify-otp',
          params: { email: pendingVerification.email },
        });
      }
      return;
    }

    if (!isAuthenticated || !user) {
      if (hasOnboarded === false && !isOnboardingRoute && !isRootRoute && !isLegalRoute) {
        router.replace('/onboarding');
      } else if (!isRootRoute && !isAuthRoute && !isOnboardingRoute && !isLegalRoute) {
        router.replace('/auth/role-select');
      }
      return;
    }

    if (isCandidateOnlyRoute && user.role !== 'candidate') {
      router.replace('/(employer)/dashboard');
      return;
    }

    if (isEmployerOnlyRoute && user.role !== 'employer') {
      router.replace('/(candidate)/home');
      return;
    }

    if ((isAuthRoute && !isResetPasswordRoute) || isOnboardingRoute) {
      router.replace(
        user.role === 'employer'
          ? '/(employer)/dashboard'
          : '/(candidate)/home'
      );
    }
  }, [
    authStatus,
    hasOnboarded,
    isAuthenticated,
    isLoading,
    navigationState?.key,
    pendingVerification?.email,
    router,
    segments,
    user,
  ]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
