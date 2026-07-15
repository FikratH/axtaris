import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

interface Props {
  url: string;
  kind: 'pdf' | 'office';
}

/**
 * Native CV preview. Inline rendering needs a native PDF/WebView module (not
 * bundled to keep the web build dependency-free), so on device we present the
 * document through the OS document viewer.
 */
export function CvViewer({ url }: Props) {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();

  return (
    <View style={styles.center}>
      <FileText size={48} color={colors.primary} strokeWidth={1.5} />
      <Text style={[{ color: colors.textSecondary, marginTop: 16, textAlign: 'center', maxWidth: 300 }, t.bodyMedium]}>
        {tr('cv.openExternalHint')}
      </Text>
      <View style={{ marginTop: 20, width: '100%', maxWidth: 280 }}>
        <Button title={tr('cv.openCv')} onPress={() => Linking.openURL(url)} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
