import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { languages, changeLanguage, LanguageCode } from '@/i18n';
import { Card } from '@/components/ui/Card';
import i18n from '@/i18n';
import { ChevronLeft, Check } from 'lucide-react-native';

export default function SettingsScreen() {
  const { colors, spacing: s, typography: t, radius: r, mode, setMode } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: s.xl }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
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
});
