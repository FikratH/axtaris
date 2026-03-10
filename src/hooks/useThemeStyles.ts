import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, radius, iconSize, elevation, duration } from '@/theme/spacing';

type StyleFactory<T extends StyleSheet.NamedStyles<T>> = (theme: {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  iconSize: typeof iconSize;
  elevation: typeof elevation;
  duration: typeof duration;
  isDark: boolean;
}) => T;

export function useThemeStyles<T extends StyleSheet.NamedStyles<T>>(factory: StyleFactory<T>): T {
  const { colors, isDark } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create(
        factory({ colors, typography, spacing, radius, iconSize, elevation, duration, isDark })
      ),
    [colors, isDark]
  );
}
