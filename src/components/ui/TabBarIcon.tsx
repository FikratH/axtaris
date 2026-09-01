import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { springs, useMotionEnabled } from '@/theme/motion';

/**
 * Wraps a tab icon so the active tab greets its selection with a small
 * spring pop. Pair with `tabPressListeners` on the Tabs navigator for the
 * selection haptic.
 */
export function TabBarIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const motionEnabled = useMotionEnabled();
  const scale = useSharedValue(1);
  const wasFocused = useRef(focused);

  useEffect(() => {
    if (focused && !wasFocused.current && motionEnabled) {
      scale.value = withSequence(withSpring(1.18, springs.bouncy), withSpring(1, springs.snappy));
    }
    wasFocused.current = focused;
  }, [focused, motionEnabled, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Spread into <Tabs screenListeners={tabPressListeners}> for a selection tick. */
export const tabPressListeners = {
  tabPress: () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
  },
} as const;
