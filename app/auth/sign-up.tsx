import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import {
  signUpSchema,
  signUpEmployerSchema,
  SignUpFormData,
} from '@/services/validation';
import { useFieldError } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { safeBack } from '@/utils/navigation';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { FadeInView } from '@/components/ui/Animated';

const LOGO_ICON = require('@/assets/axtaris_logo_icon_png.png');

export default function SignUpScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectedRole = useAuthStore((st) => st.selectedRole) || 'candidate';
  const setPendingVerification = useAuthStore((st) => st.setPendingVerification);

  const isEmployer = selectedRole === 'employer';

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const schema = useMemo(
    () => (isEmployer ? signUpEmployerSchema : signUpSchema),
    [isEmployer]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      companyName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const fieldError = useFieldError(errors);

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    try {
      const result = await authService.signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: selectedRole,
        companyName: isEmployer ? data.companyName : undefined,
        phone: data.phone || undefined,
      });
      await setPendingVerification({
        email: data.email,
        user: result.user,
      });
      router.replace({ pathname: '/auth/verify-otp', params: { email: data.email } });
    } catch (err: any) {
      Alert.alert(tr('common.error'), err.message || tr('errors.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
        style={{ backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => safeBack(router, '/auth/role-select')}
          style={[styles.backButton, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
        >
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>

        <FadeInView delay={50} style={[styles.header, { marginTop: s.lg }]}>
          <Image source={LOGO_ICON} style={styles.logoIcon} resizeMode="contain" />
          <Text style={[{ color: colors.textPrimary, ...t.displaySmall, marginTop: s.lg }]}>
            {isEmployer ? tr('auth.employerSignUpTitle') : tr('auth.signUpTitle')}
          </Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginTop: s.sm }]}>
            {isEmployer ? tr('auth.employerSignUpSubtitle') : tr('auth.signUpSubtitle')}
          </Text>
        </FadeInView>

        <FadeInView delay={150} style={[styles.form, { marginTop: s['3xl'] }]}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={tr('auth.fullName')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={tr('auth.fullNamePlaceholder')}
                autoCapitalize="words"
                error={fieldError('fullName')}
              />
            )}
          />

          {isEmployer && (
            <Controller
              control={control}
              name="companyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={tr('auth.companyName')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={tr('employer.companyNamePlaceholder')}
                  autoCapitalize="words"
                  error={fieldError('companyName')}
                />
              )}
            />
          )}

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
                autoComplete="email"
                error={fieldError('email')}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={tr('auth.phone')}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="+994 50 123 45 67"
                keyboardType="phone-pad"
                hint={tr('validation.invalidPhone')}
                error={fieldError('phone')}
              />
            )}
          />

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
                onRightIconPress={() => setShowPassword(!showPassword)}
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

          <View style={{ marginTop: s.lg }}>
            <Button
              title={tr('auth.createAccount')}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              size="lg"
            />
          </View>

          <Text style={[styles.terms, { color: colors.textTertiary, ...t.caption, marginTop: s.lg }]}>
            {tr('auth.termsPrefix')}{' '}
            <Text style={{ color: colors.primary }} onPress={() => router.push('/legal/terms' as never)}>
              {tr('auth.termsLink')}
            </Text>{' '}
            {tr('auth.termsAnd')}{' '}
            <Text style={{ color: colors.primary }} onPress={() => router.push('/legal/privacy' as never)}>
              {tr('auth.privacyLink')}
            </Text>
            {tr('auth.termsSuffix') ? ` ${tr('auth.termsSuffix')}` : ''}
          </Text>
        </FadeInView>

        <FadeInView delay={300} style={styles.footer}>
          <Text style={[{ color: colors.textSecondary, ...t.bodySmall }]}>
            {tr('auth.hasAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
            <Text style={[{ color: colors.primary, ...t.labelSmall }]}>
              {tr('auth.signIn')}
            </Text>
          </TouchableOpacity>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  form: {},
  terms: {
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 32,
  },
});
