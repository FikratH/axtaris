import React, { useCallback } from 'react';
import { GestureResponderEvent, Platform, Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { springs } from '@/theme/motion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends PressableProps {
  /** Scale while pressed. Default 0.97 — the app-wide press voice. */
  pressedScale?: number;
  /** Dim while pressed (stacks with scale; keep subtle). Default 0.9. */
  pressedOpacity?: number;
  /** Fire a light impact haptic on press-in. Reserve for meaningful taps. */
  haptic?: boolean | 'light' | 'medium';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * The standard AxtarIS touchable: springy scale-down on press, spring-back on
 * release, optional haptic. Replaces TouchableOpacity's flat opacity fade for
 * anything a user taps with intent.
 */
export function AnimatedPressable({
  pressedScale = 0.97,
  pressedOpacity = 0.9,
  haptic = false,
  onPressIn,
  onPressOut,
  disabled,
  style,
  children,
  ...rest
}: AnimatedPressableProps) {
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      pressed.value = withSpring(1, springs.snappy);
      if (haptic && Platform.OS !== 'web') {
        void Haptics.impactAsync(
          haptic === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light
        );
      }
      onPressIn?.(event);
    },
    [haptic, onPressIn, pressed]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      pressed.value = withSpring(0, springs.snappy);
      onPressOut?.(event);
    },
    [onPressOut, pressed]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (pressedScale - 1) * pressed.value }],
    opacity: 1 + (pressedOpacity - 1) * pressed.value,
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      disabled={disabled}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
