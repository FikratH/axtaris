import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/authService';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/services/validation';
import { useFieldError } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { safeBack } from '@/utils/navigation';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { FadeInView } from '@/components/ui/Animated';

const LOGO_ICON = require('@/assets/axtaris_logo_icon_png.png');

export default function ForgotPasswordScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  const fieldError = useFieldError(errors);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await authService.resetPassword(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (err: any) {
      Alert.alert(tr('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 60 }]}>
        <View style={styles.sentContainer}>
          <View style={[styles.sentIcon, { backgroundColor: colors.successLight, borderRadius: r.xl }]}>
            <CheckCircle2 size={36} color={colors.success} strokeWidth={1.5} />
          </View>
          <Text style={[{ color: colors.textPrimary, ...t.displaySmall, marginTop: s['2xl'], textAlign: 'center' }]}>
            {tr('auth.resetSent')}
          </Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginTop: s.md, textAlign: 'center' }]}>
            {sentEmail}
          </Text>
          <View style={{ marginTop: s['3xl'], width: '100%' }}>
            <Button title={tr('auth.signIn')} onPress={() => router.replace('/auth/sign-in')} size="lg" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
      <TouchableOpacity
        onPress={() => safeBack(router, '/auth/sign-in')}
        style={[styles.backButton, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
      >
        <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
      </TouchableOpacity>

      <FadeInView delay={50} style={[styles.header, { marginTop: s['3xl'] }]}>
        <Image source={LOGO_ICON} style={styles.logoIcon} resizeMode="contain" />
        <Text style={[{ color: colors.textPrimary, ...t.displaySmall, marginTop: s.lg }]}>
          {tr('auth.resetTitle')}
        </Text>
        <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginTop: s.sm }]}>
          {tr('auth.resetSubtitle')}
        </Text>
      </FadeInView>

      <FadeInView delay={150} style={{ marginTop: s['3xl'] }}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={tr('auth.email')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={fieldError('email')}
            />
          )}
        />
        <View style={{ marginTop: s.xl }}>
          <Button title={tr('auth.sendResetLink')} onPress={handleSubmit(onSubmit)} loading={loading} size="lg" />
        </View>
      </FadeInView>
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
  header: {},
  logoIcon: {
    width: 64,
    height: 64,
  },
  sentContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sentIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
