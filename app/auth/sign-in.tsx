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

export default function SignInScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectedRole = useAuthStore((st) => st.selectedRole);
  const completeAuthentication = useAuthStore((st) => st.completeAuthentication);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = tr('validation.required');
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = tr('validation.invalidEmail');
    if (!password.trim()) newErrors.password = tr('validation.required');
    else if (password.length < 6) newErrors.password = tr('validation.passwordMin');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await authService.signIn({ email, password, role: selectedRole || undefined });
      await completeAuthentication(result.user, result.token);

      if (result.user.role === 'employer') {
        router.replace('/(employer)/dashboard');
      } else {
        router.replace('/(candidate)/home');
      }
    } catch (err: any) {
      Alert.alert(tr('common.error'), err.message || 'Sign in failed');
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
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
        >
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>

        <View style={[styles.header, { marginTop: s['3xl'] }]}>
          <Text style={[{ color: colors.textPrimary, ...t.displaySmall }]}>
            {tr('auth.signInTitle')}
          </Text>
          <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginTop: s.sm }]}>
            {tr('auth.signInSubtitle')}
          </Text>
        </View>

        <View style={[styles.form, { marginTop: s['4xl'] }]}>
          <Input
            label={tr('auth.email')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label={tr('auth.password')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
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

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotButton}
          >
            <Text style={[{ color: colors.primary, ...t.labelSmall }]}>
              {tr('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>

          <View style={{ marginTop: s['2xl'] }}>
            <Button
              title={tr('auth.signIn')}
              onPress={handleSignIn}
              loading={loading}
              size="lg"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[{ color: colors.textSecondary, ...t.bodySmall }]}>
            {tr('auth.noAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
            <Text style={[{ color: colors.primary, ...t.labelSmall }]}>
              {tr('auth.createAccount')}
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
