import React, { useEffect, useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Camera } from 'lucide-react-native';
import { SvgUri } from 'react-native-svg';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  style?: ViewStyle | ImageStyle;
  onPress?: () => void;
  editable?: boolean;
}

export function Avatar({ uri, name, size = 44, style, onPress, editable = false }: AvatarProps) {
  const { colors, radius: r } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  const borderRadius = size * 0.28;
  const resolvedSource =
    uri && typeof uri === 'string' && uri.trim().length > 0 ? { uri } : undefined;
  const isSvgSource = !!uri && /\.svg(?:\?|$)/i.test(uri);

  useEffect(() => {
    setImageFailed(false);
  }, [uri]);

  const content = resolvedSource && !imageFailed ? (
    isSvgSource ? (
      <View
        style={[
          styles.svgWrapper,
          { width: size, height: size, borderRadius },
          style,
        ]}
      >
        <SvgUri
          uri={uri}
          width={size}
          height={size}
          onError={() => setImageFailed(true)}
        />
      </View>
    ) : (
      <Image
        source={resolvedSource}
        onError={() => setImageFailed(true)}
        style={[{ width: size, height: size, borderRadius }, style as ImageStyle]}
      />
    )
  ) : (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: colors.primaryLight,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          { color: colors.primary, fontSize: size * 0.36 },
        ]}
      >
        {initials}
      </Text>
    </View>
  );

  if (!onPress && !editable) return content;

  const badgeSize = Math.max(size * 0.3, 24);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.editableWrapper}>
      {content}
      {editable && (
        <View
          style={[
            styles.editBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: colors.primary,
              borderColor: colors.surface,
            },
          ]}
        >
          <Camera size={badgeSize * 0.5} color="#FFFFFF" strokeWidth={2} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrapper: {
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '700',
  },
  editableWrapper: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
