import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  style?: ViewStyle | ImageStyle;
}

export function Avatar({ uri, name, size = 44, style }: AvatarProps) {
  const { colors, radius: r } = useTheme();
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const borderRadius = size * 0.28;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius }, style as ImageStyle]}
      />
    );
  }

  return (
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
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
