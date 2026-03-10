import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, FileUp, FileCheck, Trash2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function UploadCVScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useDataStore((s) => s.candidateProfile);
  const setCvFile = useDataStore((s) => s.setCvFile);
  const [uploading, setUploading] = useState(false);

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setUploading(true);
        const file = result.assets[0];
        setTimeout(() => {
          setCvFile(file.uri, file.name);
          setUploading(false);
          Alert.alert(tr('common.done'), file.name);
        }, 800);
      }
    } catch {
      Alert.alert(tr('common.error'));
    }
  };

  const handleRemove = () => {
    setCvFile('', '');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('candidate.uploadCV')}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        {profile.cvFileName ? (
          <View style={styles.fileInfo}>
            <View style={[styles.fileIcon, { backgroundColor: colors.successLight }]}>
              <FileCheck size={28} color={colors.success} strokeWidth={1.5} />
            </View>
            <Text style={[{ color: colors.textPrimary, marginTop: 12 }, t.labelMedium]}>{profile.cvFileName}</Text>
            <Text style={[{ color: colors.textTertiary, marginTop: 4 }, t.caption]}>CV uploaded successfully</Text>
            <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
              <Button title="Replace" onPress={handlePick} variant="outline" size="sm" fullWidth={false} />
              <Button title="Remove" onPress={handleRemove} variant="destructive" size="sm" fullWidth={false} icon={<Trash2 size={14} color="#FFF" strokeWidth={2} />} />
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={handlePick} activeOpacity={0.7} style={styles.uploadArea}>
            <View style={[styles.fileIcon, { backgroundColor: colors.primaryLight }]}>
              <FileUp size={32} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={[{ color: colors.textPrimary, marginTop: 16 }, t.labelMedium]}>Tap to upload your CV</Text>
            <Text style={[{ color: colors.textTertiary, marginTop: 4, textAlign: 'center' }, t.bodySmall]}>
              PDF, DOC, DOCX supported{'\n'}Max 10MB
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {uploading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.surfaceOverlay }]}>
          <Text style={[{ color: '#FFF' }, t.labelMedium]}>{tr('common.loading')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 14, borderWidth: 1, padding: 24 },
  fileInfo: { alignItems: 'center' },
  fileIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  uploadArea: { alignItems: 'center', paddingVertical: 24 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
