import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { safeBack } from '@/utils/navigation';
import { legalContent } from '@/content/legalContent.generated';
import { ChevronLeft } from 'lucide-react-native';

export default function PrivacyScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = (['az', 'en', 'ru'].includes(i18n.language) ? i18n.language : 'az') as
    | 'az'
    | 'en'
    | 'ru';
  const sections = legalContent[language].privacy;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: insets.top + 12, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => safeBack(router, '/auth/role-select')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}>
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('legal.privacyTitle')}</Text>
      </View>

      <Text style={[{ color: colors.textTertiary, marginBottom: s.lg }, t.caption]}>{tr('legal.lastUpdated')}</Text>

      {sections.map((section, i) => (
        <View key={i}>
          {section.heading ? (
            <Text style={[{ color: colors.textPrimary, marginBottom: s.sm, marginTop: i === 0 ? 0 : s.md }, t.labelMedium]}>
              {section.heading}
            </Text>
          ) : null}
          {section.paragraphs.map((paragraph, j) => (
            <Text key={j} style={[{ color: colors.textSecondary, marginBottom: s.md, lineHeight: 22 }, t.bodySmall]}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
