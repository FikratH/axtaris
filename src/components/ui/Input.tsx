import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  style?: TextStyle;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style: inputStyle,
  ...textInputProps
}: InputProps) {
  const { colors, radius: r, spacing: s, typography: t } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.borderFocus
    : colors.inputBorder;

  // Soft focus ring — a subtle primary glow signals the active field without
  // shifting layout (falls back to the error color when the field is invalid).
  const focusRing: ViewStyle =
    isFocused
      ? {
          shadowColor: error ? colors.error : colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.18,
          shadowRadius: 4,
          elevation: 2,
        }
      : {};

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: colors.textSecondary, ...t.labelSmall, marginBottom: s.xs + 2 },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor,
            borderRadius: r.md,
            paddingHorizontal: s.lg,
          },
          focusRing,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              ...t.bodyMedium,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.textTertiary}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          {...textInputProps}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error, ...t.caption }]}>{error}</Text>
      )}
      {hint && !error && (
        <Text style={[styles.hintText, { color: colors.textTertiary, ...t.caption }]}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 52,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 2,
  },
  hintText: {
    marginTop: 4,
    marginLeft: 2,
  },
});
