import React, { useState } from 'react';
import {
  View,
  Text,
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
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';

export default function SignUpScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectedRole = useAuthStore((st) => st.selectedRole) || 'candidate';
  const setPendingVerification = useAuthStore((st) => st.setPendingVerification);

  const isEmployer = selectedRole === 'employer';

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = tr('validation.required');
    if (isEmployer && !companyName.trim()) e.companyName = tr('validation.required');
    if (!email.trim()) e.email = tr('validation.required');
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = tr('validation.invalidEmail');
    if (!password.trim()) e.password = tr('validation.required');
    else if (password.length < 8) e.password = tr('validation.passwordMin');
    if (password !== confirmPassword) e.confirmPassword = tr('validation.passwordMatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await authService.signUp({
        email,
        password,
        fullName,
        role: selectedRole,
        companyName: isEmployer ? companyName : undefined,
        phone: phone || undefined,
      });
      await setPendingVerification({
        email,
        user: result.user,
      });
      router.replace({ pathname: '/auth/verify-otp', params: { email } });
    } catch (err: any) {
      Alert.alert(tr('common.error'), err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
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
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
        >
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>

        <View style={[styles.header, { marginTop: s['2xl'] }]}>
          <Text style={[{ color: colors.textPrimary, ...t.displaySmall }]}>
            {isEmployer ? tr('auth.employerSignUpTitle') : tr('auth.signUpTitle')}
          </Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginTop: s.sm }]}>
            {isEmployer ? tr('auth.employerSignUpSubtitle') : tr('auth.signUpSubtitle')}
          </Text>
        </View>

        <View style={[styles.form, { marginTop: s['3xl'] }]}>
          <Input
            label={tr('auth.fullName')}
            value={fullName}
            onChangeText={(v) => { setFullName(v); clearError('fullName'); }}
            placeholder={isEmployer ? 'Leyla Məmmədova' : 'Əli Həsənov'}
            autoCapitalize="words"
            error={errors.fullName}
          />

          {isEmployer && (
            <Input
              label={tr('auth.companyName')}
              value={companyName}
              onChangeText={(v) => { setCompanyName(v); clearError('companyName'); }}
              placeholder="Şirkət MMC"
              autoCapitalize="words"
              error={errors.companyName}
            />
          )}

          <Input
            label={tr('auth.email')}
            value={email}
            onChangeText={(v) => { setEmail(v); clearError('email'); }}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label={tr('auth.phone')}
            value={phone}
            onChangeText={setPhone}
            placeholder="+994 50 123 45 67"
            keyboardType="phone-pad"
            hint={tr('validation.invalidPhone')}
          />

          <Input
            label={tr('auth.password')}
            value={password}
            onChangeText={(v) => { setPassword(v); clearError('password'); }}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={errors.password}
            rightIcon={
              showPassword
                ? <EyeOff size={18} color={colors.textTertiary} strokeWidth={1.8} />
                : <Eye size={18} color={colors.textTertiary} strokeWidth={1.8} />
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Input
            label={tr('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); clearError('confirmPassword'); }}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={errors.confirmPassword}
          />

          <View style={{ marginTop: s.lg }}>
            <Button
              title={tr('auth.createAccount')}
              onPress={handleSignUp}
              loading={loading}
              size="lg"
            />
          </View>

          <Text style={[styles.terms, { color: colors.textTertiary, ...t.caption, marginTop: s.lg }]}>
            {tr('auth.termsPrefix')}{' '}
            <Text style={{ color: colors.primary }}>{tr('auth.termsLink')}</Text>{' '}
            {tr('auth.termsAnd')}{' '}
            <Text style={{ color: colors.primary }}>{tr('auth.privacyLink')}</Text>
            {tr('auth.termsSuffix') ? ` ${tr('auth.termsSuffix')}` : ''}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[{ color: colors.textSecondary, ...t.bodySmall }]}>
            {tr('auth.hasAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
            <Text style={[{ color: colors.primary, ...t.labelSmall }]}>
              {tr('auth.signIn')}
            </Text>
          </TouchableOpacity>
        </View>
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
