import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Keyboard, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeContext';
import { springs, useMotionEnabled } from '@/theme/motion';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
}

export function OTPInput({ length = 6, onComplete, error = false }: OTPInputProps) {
  const { colors, radius: r } = useTheme();
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);
  const motionEnabled = useMotionEnabled();
  const shake = useSharedValue(0);

  // A wrong code shakes the whole row and buzzes — the classic "try again"
  // gesture; reduced motion keeps the border-color error state only.
  useEffect(() => {
    if (!error) return;
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (motionEnabled) {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withSpring(0, springs.snappy)
      );
    }
  }, [error, motionEnabled, shake]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

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
    <Animated.View style={[styles.container, shakeStyle]}>
      {Array(length)
        .fill(0)
        .map((_, i) => (
          <OTPCell key={i} filled={!!values[i]} motionEnabled={motionEnabled}>
          <TextInput
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
          </OTPCell>
        ))}
    </Animated.View>
  );
}

/** Each cell pops slightly when its digit lands. */
function OTPCell({ filled, motionEnabled, children }: { filled: boolean; motionEnabled: boolean; children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const wasFilled = useRef(filled);

  useEffect(() => {
    if (filled && !wasFilled.current && motionEnabled) {
      scale.value = withSequence(withSpring(1.08, springs.bouncy), withSpring(1, springs.snappy));
    }
    wasFilled.current = filled;
  }, [filled, motionEnabled, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
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
