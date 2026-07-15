import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useCandidateProfile,
  useUpdateCandidateProfile,
} from '@/hooks/useCandidateVacancyActions';
import { fileStorageService } from '@/services/fileStorageService';
import { safeBack } from '@/utils/navigation';
import { ChevronLeft, FileUp, FileCheck, Trash2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function UploadCVScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useCandidateProfile(user?.id);
  const updateProfile = useUpdateCandidateProfile(user?.id);
  const [uploading, setUploading] = useState(false);

  const handlePick = async () => {
    if (!user?.id || !profile) {
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setUploading(true);
        const file = result.assets[0];
        const previousCvUrl = profile.cvUrl;
        const uploaded = await fileStorageService.uploadCandidateCv(user.id, {
          uri: file.uri,
          fileName: file.name,
          mimeType: file.mimeType,
          fileSize: file.size,
        });

        await updateProfile.mutateAsync({
          cvUrl: uploaded.url,
          cvFileName: file.name,
        });

        if (previousCvUrl && previousCvUrl !== uploaded.url) {
          void fileStorageService.removeUploadedFile(previousCvUrl).catch(() => undefined);
        }

        Alert.alert(tr('common.done'), file.name);
      }
    } catch (error) {
      setUploading(false);
      Alert.alert(
        tr('common.error'),
        error instanceof Error ? error.message : tr('common.error')
      );
      return;
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!profile?.cvUrl) {
      return;
    }

    try {
      await updateProfile.mutateAsync({
        cvUrl: '',
        cvFileName: '',
      });
      await fileStorageService.removeUploadedFile(profile.cvUrl);
    } catch (error) {
      Alert.alert(
        tr('common.error'),
        error instanceof Error ? error.message : tr('common.error')
      );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.textSecondary, marginTop: 12 }, t.bodyMedium]}>{tr('common.loading')}</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <EmptyState
          title={tr('common.error')}
          subtitle={tr('common.retry')}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.backgroundSecondary }]}> 
        <EmptyState
          title={tr('candidate.uploadCV')}
          subtitle={tr('common.error')}
          actionTitle={tr('common.retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, paddingTop: insets.top + 12 }]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => safeBack(router, '/(candidate)/profile')} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
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
            <Text style={[{ color: colors.textTertiary, marginTop: 4 }, t.caption]}>{tr('candidate.cvUploadSuccess')}</Text>
            <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
              <Button title={tr('common.replace')} onPress={handlePick} variant="outline" size="sm" fullWidth={false} loading={uploading || updateProfile.isPending} />
              <Button title={tr('common.remove')} onPress={handleRemove} variant="destructive" size="sm" fullWidth={false} loading={updateProfile.isPending} icon={<Trash2 size={14} color="#FFF" strokeWidth={2} />} />
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={handlePick} activeOpacity={0.7} style={styles.uploadArea}>
            <View style={[styles.fileIcon, { backgroundColor: colors.primaryLight }]}>
              <FileUp size={32} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={[{ color: colors.textPrimary, marginTop: 16 }, t.labelMedium]}>{tr('candidate.tapToUploadCv')}</Text>
            <Text style={[{ color: colors.textTertiary, marginTop: 4, textAlign: 'center' }, t.bodySmall]}>
              {tr('candidate.cvUploadHint')}
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
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 14, borderWidth: 1, padding: 24 },
  fileInfo: { alignItems: 'center' },
  fileIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  uploadArea: { alignItems: 'center', paddingVertical: 24 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
