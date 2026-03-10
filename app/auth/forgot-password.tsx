import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError(tr('validation.invalidEmail'));
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email);
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
            {email}
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
        onPress={() => router.back()}
        style={[styles.backButton, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
      >
        <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
      </TouchableOpacity>

      <View style={[styles.header, { marginTop: s['4xl'] }]}>
        <Text style={[{ color: colors.textPrimary, ...t.displaySmall }]}>
          {tr('auth.resetTitle')}
        </Text>
        <Text style={[{ color: colors.textSecondary, ...t.bodyMedium, marginTop: s.sm }]}>
          {tr('auth.resetSubtitle')}
        </Text>
      </View>

      <View style={{ marginTop: s['3xl'] }}>
        <Input
          label={tr('auth.email')}
          value={email}
          onChangeText={(v) => { setEmail(v); setError(''); }}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />
        <View style={{ marginTop: s.xl }}>
          <Button title={tr('auth.sendResetLink')} onPress={handleReset} loading={loading} size="lg" />
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {},
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
