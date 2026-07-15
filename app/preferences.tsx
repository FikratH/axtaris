import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { languages, changeLanguage, LanguageCode } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import i18n from '@/i18n';
import { accountService } from '@/services/accountService';
import { StoredAccount } from '@/store/authStore';
import { getSubscriptionSettingsDescription } from '@/utils/subscriptionPresentation';
import { ChevronLeft, Check, ChevronRight, Sparkles, FileText, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react-native';

export default function PreferencesScreen() {
  const { colors, spacing: s, typography: t, radius: r, mode, setMode } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const accounts = useAuthStore((state) => state.accounts);
  const switchAccount = useAuthStore((state) => state.switchAccount);
  const removeAccount = useAuthStore((state) => state.removeAccount);
  const audience = user?.role === 'employer' ? 'employer' : 'candidate';

  const handleSwitchAccount = async (account: StoredAccount) => {
    if (account.id === user?.id) return;
    const ok = await switchAccount(account);
    if (ok) {
      const home =
        account.role === 'admin'
          ? '/(admin)/dashboard'
          : account.role === 'employer'
          ? '/(employer)/dashboard'
          : '/(candidate)/home';
      router.replace(home as never);
    } else {
      Alert.alert(tr('settings.switchFailed'));
      router.push('/auth/sign-in');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(tr('settings.deleteAccountConfirmTitle'), tr('settings.deleteAccountConfirmMessage'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('settings.deleteAccount'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(tr('settings.deleteAccountFinalTitle'), tr('settings.deleteAccountFinalMessage'), [
            { text: tr('common.cancel'), style: 'cancel' },
            {
              text: tr('common.confirm'),
              style: 'destructive',
              onPress: () => {
                void (async () => {
                  try {
                    await accountService.deleteAccount();
                    await signOut();
                    router.replace('/auth/role-select');
                    Alert.alert(tr('settings.deleteAccountSuccess'));
                  } catch (error) {
                    Alert.alert(tr('common.error'), error instanceof Error ? error.message : tr('common.error'));
                  }
                })();
              },
            },
          ]);
        },
      },
    ]);
  };

  const currentLang = i18n.language as LanguageCode;

  const themeOptions: { key: 'light' | 'dark' | 'system'; label: string }[] = [
    { key: 'light', label: tr('settings.themeLight') },
    { key: 'dark', label: tr('settings.themeDark') },
    { key: 'system', label: tr('settings.themeSystem') },
  ];

  const languageOptions = Object.entries(languages).map(([code, lang]) => ({
    code: code as LanguageCode,
    label: lang.nativeLabel,
  }));

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace((user?.role === 'employer' ? '/(employer)/settings' : '/(candidate)/profile') as never);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: s.xl }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={goBack}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}
          >
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, ...t.headingMedium, marginLeft: s.md }]}>
            {tr('settings.title')}
          </Text>
        </View>
      </View>

      <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['3xl'] }]}> 
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...t.overline, marginBottom: s.md }]}> 
          {tr('settings.language')}
        </Text>
        <Card padding="none">
          {languageOptions.map((lang, i) => (
            <TouchableOpacity
              key={lang.code}
              activeOpacity={0.7}
              onPress={() => changeLanguage(lang.code)}
              style={[
                styles.optionRow,
                {
                  paddingHorizontal: s.lg,
                  paddingVertical: s.lg,
                  borderBottomWidth: i < languageOptions.length - 1 ? 1 : 0,
                  borderBottomColor: colors.divider,
                },
              ]}
            >
              <Text style={[{ color: colors.textPrimary, ...t.bodyMedium, flex: 1 }]}>{lang.label}</Text>
              {currentLang === lang.code && (
                <Check size={18} color={colors.primary} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          ))}
        </Card>
      </View>

      <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}> 
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...t.overline, marginBottom: s.md }]}> 
          {tr('settings.theme')}
        </Text>
        <Card padding="none">
          {themeOptions.map((theme, i) => (
            <TouchableOpacity
              key={theme.key}
              activeOpacity={0.7}
              onPress={() => setMode(theme.key)}
              style={[
                styles.optionRow,
                {
                  paddingHorizontal: s.lg,
                  paddingVertical: s.lg,
                  borderBottomWidth: i < themeOptions.length - 1 ? 1 : 0,
                  borderBottomColor: colors.divider,
                },
              ]}
            >
              <Text style={[{ color: colors.textPrimary, ...t.bodyMedium, flex: 1 }]}>{theme.label}</Text>
              {mode === theme.key && (
                <Check size={18} color={colors.primary} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          ))}
        </Card>
      </View>

      <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}> 
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...t.overline, marginBottom: s.md }]}> 
          {tr('subscription.title')}
        </Text>
        <Card padding="none">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/subscription' as never)}
            style={[styles.optionRow, { paddingHorizontal: s.lg, paddingVertical: s.lg }]}
          >
            <Sparkles size={18} color={colors.primary} strokeWidth={1.8} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[{ color: colors.textPrimary, ...t.bodyMedium }]}>{tr('subscription.managePlan')}</Text>
              <Text style={[{ color: colors.textTertiary, ...t.caption, marginTop: 3 }]}>{getSubscriptionSettingsDescription(tr, audience)}</Text>
            </View>
            <ChevronRight size={16} color={colors.textTertiary} strokeWidth={1.8} />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...t.overline, marginBottom: s.md }]}>
          {tr('settings.accounts')}
        </Text>
        <Card padding="none">
          {accounts.map((account) => {
            const isCurrent = account.id === user?.id;
            return (
              <TouchableOpacity
                key={account.id}
                activeOpacity={0.7}
                disabled={isCurrent}
                onPress={() => handleSwitchAccount(account)}
                style={[styles.accountRow, { paddingHorizontal: s.lg, paddingVertical: s.md, borderBottomWidth: 1, borderBottomColor: colors.divider }]}
              >
                <Avatar uri={account.avatarUrl} name={account.fullName} size={40} />
                <View style={{ flex: 1, marginLeft: s.md }}>
                  <Text style={[{ color: colors.textPrimary }, t.labelSmall]} numberOfLines={1}>{account.fullName}</Text>
                  <Text style={[{ color: colors.textTertiary, marginTop: 2 }, t.caption]} numberOfLines={1}>{account.email}</Text>
                </View>
                {isCurrent ? (
                  <Check size={18} color={colors.primary} strokeWidth={2.5} />
                ) : (
                  <TouchableOpacity onPress={() => removeAccount(account.id)} hitSlop={8} style={{ padding: 6 }}>
                    <X size={16} color={colors.textTertiary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/auth/sign-in')}
            style={[styles.accountRow, { paddingHorizontal: s.lg, paddingVertical: s.lg }]}
          >
            <UserPlus size={18} color={colors.primary} strokeWidth={1.8} style={{ marginRight: 10 }} />
            <Text style={[{ color: colors.primary, ...t.bodyMedium, flex: 1 }]}>{tr('settings.addAccount')}</Text>
          </TouchableOpacity>
        </Card>
      </View>

      <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...t.overline, marginBottom: s.md }]}>
          {tr('settings.legal')}
        </Text>
        <Card padding="none">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/legal/terms' as never)}
            style={[styles.optionRow, { paddingHorizontal: s.lg, paddingVertical: s.lg, borderBottomWidth: 1, borderBottomColor: colors.divider }]}
          >
            <FileText size={18} color={colors.textSecondary} strokeWidth={1.8} style={{ marginRight: 10 }} />
            <Text style={[{ color: colors.textPrimary, ...t.bodyMedium, flex: 1 }]}>{tr('settings.termsOfService')}</Text>
            <ChevronRight size={16} color={colors.textTertiary} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/legal/privacy' as never)}
            style={[styles.optionRow, { paddingHorizontal: s.lg, paddingVertical: s.lg }]}
          >
            <ShieldCheck size={18} color={colors.textSecondary} strokeWidth={1.8} style={{ marginRight: 10 }} />
            <Text style={[{ color: colors.textPrimary, ...t.bodyMedium, flex: 1 }]}>{tr('settings.privacyPolicy')}</Text>
            <ChevronRight size={16} color={colors.textTertiary} strokeWidth={1.8} />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={[styles.section, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
        <Card padding="none">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDeleteAccount}
            style={[styles.optionRow, { paddingHorizontal: s.lg, paddingVertical: s.lg }]}
          >
            <Trash2 size={18} color={colors.error} strokeWidth={1.8} style={{ marginRight: 10 }} />
            <Text style={[{ color: colors.error, ...t.bodyMedium, flex: 1 }]}>{tr('settings.deleteAccount')}</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  section: {},
  sectionTitle: {},
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  accountRow: { flexDirection: 'row', alignItems: 'center' },
});
