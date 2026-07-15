import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ExternalLink } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { fileStorageService } from '@/services/fileStorageService';
import { CvViewer } from '@/components/cv/CvViewer';
import { EmptyState } from '@/components/ui/EmptyState';

function inferKind(ref: string): 'pdf' | 'office' {
  return ref.toLowerCase().includes('.doc') ? 'office' : 'pdf';
}

export default function CvPreviewScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ ref?: string; name?: string }>();
  const fileRef = typeof params.ref === 'string' ? params.ref : '';
  const name = typeof params.name === 'string' && params.name ? params.name : tr('cv.title');

  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const resolved = await fileStorageService.resolveFileUrl(fileRef);
        if (!active) return;
        if (!resolved) setError(true);
        else setUrl(resolved);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [fileRef]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[{ color: colors.textPrimary, flex: 1, marginHorizontal: 8 }, t.headingSmall]}>
          {name}
        </Text>
        {url ? (
          <TouchableOpacity onPress={() => Linking.openURL(url)} style={styles.iconBtn} hitSlop={8}>
            <ExternalLink size={20} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error || !url ? (
          <View style={styles.center}>
            <EmptyState title={tr('common.error')} subtitle={tr('common.notAvailable')} />
          </View>
        ) : (
          <CvViewer url={url} kind={inferKind(fileRef)} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
