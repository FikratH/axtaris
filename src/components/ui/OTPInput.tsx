import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
}

export function OTPInput({ length = 6, onComplete, error = false }: OTPInputProps) {
  const { colors, radius: r } = useTheme();
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);

  const commit = (newValues: string[], focusIndex: number) => {
    setValues(newValues);
    inputs.current[Math.max(0, Math.min(focusIndex, length - 1))]?.focus();

    if (newValues.every((v) => v.length === 1)) {
      Keyboard.dismiss();
      onComplete(newValues.join(''));
    }
  };

  const handleChange = (text: string, index: number) => {
    const digits = text.replace(/\D/g, '');
    const newValues = [...values];

    // Deletion (empty text)
    if (digits.length === 0) {
      newValues[index] = '';
      setValues(newValues);
      return;
    }

    // Single digit typed
    if (digits.length === 1) {
      newValues[index] = digits;
      commit(newValues, index + 1);
      return;
    }

    // Pasted / SMS-autofilled multi-digit code: distribute across cells
    let cursor = index;
    for (const char of digits.split('')) {
      if (cursor >= length) break;
      newValues[cursor] = char;
      cursor += 1;
    }
    commit(newValues, cursor);
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newValues = [...values];
      newValues[index - 1] = '';
      setValues(newValues);
    }
  };

  return (
    <View style={styles.container}>
      {Array(length)
        .fill(0)
        .map((_, i) => (
          <TextInput
            key={i}
            ref={(ref) => { inputs.current[i] = ref; }}
            style={[
              styles.cell,
              {
                borderColor: error
                  ? colors.error
                  : values[i]
                  ? colors.borderFocus
                  : colors.inputBorder,
                backgroundColor: colors.inputBackground,
                color: colors.textPrimary,
                borderRadius: r.md,
              },
            ]}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={i === 0 ? length : 1}
            value={values[i]}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            selectTextOnFocus
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  cell: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
  },
});
