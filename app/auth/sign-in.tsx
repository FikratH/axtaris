import React, { useState } from 'react';
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
import { signInSchema, SignInFormData } from '@/services/validation';
import { useFieldError } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FadeInView } from '@/components/ui/Animated';
import { safeBack } from '@/utils/navigation';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';

const LOGO_ICON = require('@/assets/axtaris_logo_icon_png.png');

export default function SignInScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectedRole = useAuthStore((st) => st.selectedRole);
  const completeAuthentication = useAuthStore((st) => st.completeAuthentication);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const fieldError = useFieldError(errors);

  const onSubmit = async (data: SignInFormData) => {
    setLoading(true);
    try {
      const result = await authService.signIn({
        email: data.email,
        password: data.password,
        role: selectedRole || undefined,
      });
      await completeAuthentication(result.user, result.token, result.refreshToken);

      if (result.user.role === 'employer') {
        router.replace('/(employer)/dashboard');
      } else {
        router.replace('/(candidate)/home');
      }
    } catch (err: any) {
      Alert.alert(tr('common.error'), err.message || tr('errors.signInFailed'));
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

        <FadeInView delay={50} style={[styles.header, { marginTop: s['2xl'] }]}>
          <Image source={LOGO_ICON} style={styles.logoIcon} resizeMode="contain" />
          <Text style={[{ color: colors.textPrimary, ...t.displaySmall, marginTop: s.lg }]}>
            {tr('auth.signInTitle')}
          </Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginTop: s.sm }]}>
            {tr('auth.signInSubtitle')}
          </Text>
        </FadeInView>

        <FadeInView delay={150} style={[styles.form, { marginTop: s['4xl'] }]}>
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

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotButton}
          >
            <Text style={[{ color: colors.primary, ...t.labelSmall }]}>
              {tr('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>

          <FadeInView delay={300}>
            <View style={{ marginTop: s['2xl'] }}>
              <Button
                title={tr('auth.signIn')}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                size="lg"
              />
            </View>
          </FadeInView>
        </FadeInView>

        <FadeInView delay={400} style={styles.footer}>
          <Text style={[{ color: colors.textSecondary, ...t.bodySmall }]}>
            {tr('auth.noAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
            <Text style={[{ color: colors.primary, ...t.labelSmall }]}>
              {tr('auth.createAccount')}
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 32,
  },
});
