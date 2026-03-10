import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, radius: r, spacing: s } = useTheme();

  const isDisabled = disabled || loading;

  const containerStyles: ViewStyle[] = [
    styles.base,
    {
      borderRadius: r.lg,
      opacity: isDisabled ? 0.5 : 1,
    },
    fullWidth ? styles.fullWidth : {},
  ];

  const textStyles: TextStyle[] = [styles.text];

  switch (size) {
    case 'sm':
      containerStyles.push({ paddingVertical: s.sm, paddingHorizontal: s.lg });
      textStyles.push({ fontSize: 14 });
      break;
    case 'md':
      containerStyles.push({ paddingVertical: s.md + 2, paddingHorizontal: s.xl });
      textStyles.push({ fontSize: 16 });
      break;
    case 'lg':
      containerStyles.push({ paddingVertical: s.lg, paddingHorizontal: s['2xl'] });
      textStyles.push({ fontSize: 17 });
      break;
  }

  switch (variant) {
    case 'primary':
      containerStyles.push({ backgroundColor: colors.buttonPrimary });
      textStyles.push({ color: '#FFFFFF' });
      break;
    case 'secondary':
      containerStyles.push({ backgroundColor: colors.buttonSecondary });
      textStyles.push({ color: colors.textPrimary });
      break;
    case 'outline':
      containerStyles.push({
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.border,
      });
      textStyles.push({ color: colors.textPrimary });
      break;
    case 'ghost':
      containerStyles.push({ backgroundColor: 'transparent' });
      textStyles.push({ color: colors.primary });
      break;
    case 'destructive':
      containerStyles.push({ backgroundColor: colors.buttonDestructive });
      textStyles.push({ color: '#FFFFFF' });
      break;
  }

  if (style) containerStyles.push(style);
  if (textStyle) textStyles.push(textStyle);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={containerStyles}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
