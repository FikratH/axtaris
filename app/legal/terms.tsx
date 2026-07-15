import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { safeBack } from '@/utils/navigation';
import { ChevronLeft } from 'lucide-react-native';

export default function TermsScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paragraphs = tr('legal.termsBody').split('\n\n');

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
        <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('legal.termsTitle')}</Text>
      </View>

      <Text style={[{ color: colors.textTertiary, marginBottom: s.lg }, t.caption]}>{tr('legal.lastUpdated')}</Text>

      {paragraphs.map((paragraph, i) => (
        <Text key={i} style={[{ color: colors.textSecondary, marginBottom: s.lg, lineHeight: 24 }, t.bodyMedium]}>
          {paragraph}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
