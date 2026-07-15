import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Alert } from '@/utils/dialog';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  type: string | undefined;
  fileName: string | undefined;
  fileSize: number | undefined;
}

interface UseImagePickerOptions {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
  maxSizeMB?: number;
}

export function useImagePicker(options: UseImagePickerOptions = {}) {
  const { t: tr } = useTranslation();
  const [image, setImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    aspect = [1, 1],
    quality = 0.8,
    allowsEditing = true,
    maxSizeMB = 5,
  } = options;

  const requestPermission = useCallback(async (source: 'camera' | 'library'): Promise<boolean> => {
    if (Platform.OS === 'web') return true;

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          tr('common.error'),
          tr('permissions.cameraRequired')
        );
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          tr('common.error'),
          tr('permissions.libraryRequired')
        );
        return false;
      }
    }
    return true;
  }, [tr]);

  const pickFromLibrary = useCallback(async (): Promise<PickedImage | null> => {
    const hasPermission = await requestPermission('library');
    if (!hasPermission) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect,
        quality,
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > maxSizeMB * 1024 * 1024) {
        Alert.alert(
          tr('common.error'),
          tr('validation.fileTooLarge', { maxSize: `${maxSizeMB}MB` })
        );
        return null;
      }

      const picked: PickedImage = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.mimeType,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        fileSize: asset.fileSize,
      };

      setImage(picked);
      return picked;
    } finally {
      setLoading(false);
    }
  }, [allowsEditing, aspect, maxSizeMB, quality, requestPermission, tr]);

  const pickFromCamera = useCallback(async (): Promise<PickedImage | null> => {
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing,
        aspect,
        quality,
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];
      const picked: PickedImage = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.mimeType,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        fileSize: asset.fileSize,
      };

      setImage(picked);
      return picked;
    } finally {
      setLoading(false);
    }
  }, [allowsEditing, aspect, quality, requestPermission, tr]);

  const showPicker = useCallback(() => {
    if (Platform.OS === 'web') {
      return pickFromLibrary();
    }

    return new Promise<PickedImage | null>((resolve) => {
      Alert.alert(
        tr('common.selectPhoto'),
        undefined,
        [
          { text: tr('common.camera'), onPress: () => pickFromCamera().then(resolve) },
          { text: tr('common.photoLibrary'), onPress: () => pickFromLibrary().then(resolve) },
          { text: tr('common.cancel'), style: 'cancel', onPress: () => resolve(null) },
        ]
      );
    });
  }, [pickFromCamera, pickFromLibrary, tr]);

  const clear = useCallback(() => setImage(null), []);

  return {
    image,
    loading,
    pickFromLibrary,
    pickFromCamera,
    showPicker,
    clear,
  };
}
