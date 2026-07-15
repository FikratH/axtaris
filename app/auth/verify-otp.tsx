import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { OTPInput } from '@/components/ui/OTPInput';
import { Button } from '@/components/ui/Button';
import { safeBack } from '@/utils/navigation';
import { ChevronLeft, Mail } from 'lucide-react-native';

export default function VerifyOTPScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const pendingVerification = useAuthStore((st) => st.pendingVerification);
  const completeAuthentication = useAuthStore((st) => st.completeAuthentication);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const verificationEmail =
    typeof email === 'string' && email.length > 0
      ? email
      : pendingVerification?.email || '';

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (verificationEmail) return;
    router.replace('/auth/role-select');
  }, [router, verificationEmail]);

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError(false);
    try {
      const verified = await authService.verifyOTP(
        verificationEmail,
        code,
        pendingVerification?.user
      );
      if (verified) {
        await completeAuthentication(verified.user, verified.token, verified.refreshToken);

        if (verified.user.role === 'employer') {
          router.replace('/(employer)/dashboard');
        } else {
          router.replace('/(candidate)/home');
        }
      } else {
        setError(true);
      }
    } catch (err: any) {
      Alert.alert(tr('common.error'), err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await authService.resendOTP(verificationEmail);
      setCanResend(false);
      setResendTimer(60);
    } catch (err: any) {
      Alert.alert(tr('common.error'), err.message);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <TouchableOpacity
        onPress={() => safeBack(router, '/auth/sign-up')}
        style={[styles.backButton, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
      >
        <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
      </TouchableOpacity>

      <View style={[styles.header, { marginTop: s['4xl'] }]}>
        <View style={[styles.emailIcon, { backgroundColor: colors.primaryLight, borderRadius: r.xl }]}>
          <Mail size={32} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={[{ color: colors.textPrimary, ...t.displaySmall, marginTop: s['2xl'] }]}>
          {tr('auth.otpTitle')}
        </Text>
        <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginTop: s.sm, textAlign: 'center' }]}>
          {tr('auth.otpSubtitle', { email: verificationEmail })}
        </Text>
      </View>

      <View style={[styles.otpContainer, { marginTop: s['4xl'] }]}>
        <OTPInput onComplete={handleVerify} error={error} />
        {error && (
          <Text style={[{ color: colors.error, ...t.caption, textAlign: 'center', marginTop: s.md }]}>
            {tr('auth.otpInvalid')}
          </Text>
        )}
      </View>

      <View style={[styles.resendContainer, { marginTop: s['3xl'] }]}>
        {canResend ? (
          <TouchableOpacity onPress={handleResend}>
            <Text style={[{ color: colors.primary, ...t.labelMedium }]}>
              {tr('auth.otpResend')}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[{ color: colors.textTertiary, ...t.bodySmall }]}>
            {tr('auth.otpResendIn', { seconds: resendTimer.toString() })}
          </Text>
        )}
      </View>

      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.surfaceOverlay }]}>
          <Text style={[{ color: '#FFFFFF', ...t.labelMedium }]}>{tr('common.loading')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  emailIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpContainer: {
    alignItems: 'center',
  },
  resendContainer: {
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
