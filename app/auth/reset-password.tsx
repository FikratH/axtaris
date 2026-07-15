import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Alert } from '@/utils/dialog';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/authStore';
import { authService, USE_MOCK_AUTH } from '@/services/authService';
import { useFieldError } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react-native';
import {
  resetPasswordConfirmSchema,
  ResetPasswordConfirmFormData,
} from '@/services/resetPasswordValidation';

function parseRecoveryUrl(url: string | null | undefined): {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  type: string | undefined;
} {
  if (!url) {
    return {
      accessToken: undefined,
      refreshToken: undefined,
      type: undefined,
    };
  }

  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');
  const rawParams = hashIndex >= 0
    ? url.slice(hashIndex + 1)
    : queryIndex >= 0
      ? url.slice(queryIndex + 1)
      : '';

  if (!rawParams) {
    return {
      accessToken: undefined,
      refreshToken: undefined,
      type: undefined,
    };
  }

  const params = new URLSearchParams(rawParams);

  return {
    accessToken: params.get('access_token') || undefined,
    refreshToken: params.get('refresh_token') || undefined,
    type: params.get('type') || undefined,
  };
}

export default function ResetPasswordScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    type?: string;
  }>();
  const completeAuthentication = useAuthStore((st) => st.completeAuthentication);
  const user = useAuthStore((st) => st.user);

  const [showPassword, setShowPassword] = useState(false);
  const [isPreparingSession, setIsPreparingSession] = useState(!USE_MOCK_AUTH);
  const [isSessionReady, setIsSessionReady] = useState(USE_MOCK_AUTH);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordConfirmFormData>({
    resolver: zodResolver(resetPasswordConfirmSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const fieldError = useFieldError(errors);

  const paramTokens = useMemo(
    () => ({
      accessToken: typeof params.access_token === 'string' ? params.access_token : undefined,
      refreshToken: typeof params.refresh_token === 'string' ? params.refresh_token : undefined,
      type: typeof params.type === 'string' ? params.type : undefined,
    }),
    [params.access_token, params.refresh_token, params.type]
  );

  useEffect(() => {
    let cancelled = false;

    const prepareRecoverySession = async () => {
      if (USE_MOCK_AUTH) {
        setIsPreparingSession(false);
        setIsSessionReady(true);
        return;
      }

      try {
        let nextTokens = paramTokens;

        if (!nextTokens.accessToken || !nextTokens.refreshToken) {
          nextTokens = parseRecoveryUrl(await Linking.getInitialURL());
        }

        if (!nextTokens.accessToken || !nextTokens.refreshToken) {
          throw new Error(tr('common.error'));
        }

        const restored = await authService.restoreRecoverySession(
          nextTokens.accessToken,
          nextTokens.refreshToken
        );

        if (cancelled) return;

        await completeAuthentication(restored.user, restored.token, restored.refreshToken);
        setIsSessionReady(true);
      } catch (error) {
        if (cancelled) return;

        Alert.alert(
          tr('common.error'),
          error instanceof Error ? error.message : tr('common.error'),
          [{ text: tr('common.ok'), onPress: () => router.replace('/auth/forgot-password') }]
        );
      } finally {
        if (!cancelled) {
          setIsPreparingSession(false);
        }
      }
    };

    void prepareRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [completeAuthentication, paramTokens, router, tr]);

  const onSubmit = async (data: ResetPasswordConfirmFormData) => {
    setSubmitting(true);

    try {
      await authService.updatePassword(data.password);

      Alert.alert(tr('common.done'), '', [
        {
          text: tr('common.ok'),
          onPress: () => {
            if (user?.role === 'employer') {
              router.replace('/(employer)/dashboard');
            } else {
              router.replace('/(candidate)/home');
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        tr('common.error'),
        error instanceof Error ? error.message : tr('common.error')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isPreparingSession) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.textSecondary, marginTop: 12 }, t.bodyMedium]}>
          {tr('common.loading')}
        </Text>
      </View>
    );
  }

  if (!isSessionReady) {
    return <View style={[styles.stateContainer, { backgroundColor: colors.background }]} />;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.replace('/auth/sign-in')}
        style={[styles.backButton, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
      >
        <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
      </TouchableOpacity>

      <View style={[styles.header, { marginTop: s['4xl'] }]}> 
        <View style={[styles.lockIcon, { backgroundColor: colors.primaryLight, borderRadius: r.xl }]}> 
          <LockKeyhole size={32} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={[{ color: colors.textPrimary, ...t.displaySmall, marginTop: s['2xl'] }]}> 
          {tr('auth.resetTitle')}
        </Text>
      </View>

      <View style={{ marginTop: s['4xl'] }}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={tr('auth.password')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              error={fieldError('password')}
              rightIcon={
                showPassword
                  ? <EyeOff size={18} color={colors.textTertiary} strokeWidth={1.8} />
                  : <Eye size={18} color={colors.textTertiary} strokeWidth={1.8} />
              }
              onRightIconPress={() => setShowPassword((current) => !current)}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={tr('auth.confirmPassword')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              error={fieldError('confirmPassword')}
            />
          )}
        />

        <View style={{ marginTop: s.xl }}>
          <Button
            title={tr('common.save')}
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            size="lg"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  lockIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
