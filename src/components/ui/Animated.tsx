import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Layout,
  LinearTransition,
} from 'react-native-reanimated';
import { springs, staggerDelay, useMotionEnabled } from '@/theme/motion';

// ── Re-export common layout animations for direct use ────────
export { FadeIn, FadeInDown, FadeInUp, FadeOut, SlideInRight, SlideOutLeft, Layout, LinearTransition };

// ── FadeInView — fades in children on mount ──────────────────
interface FadeInViewProps {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FadeInView({ delay = 0, duration = 400, children, style }: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

// ── ScaleInView — scales + fades children on mount ───────────
interface ScaleInViewProps {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ScaleInView({ delay = 0, duration = 350, children, style }: ScaleInViewProps) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 160 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: duration * 0.7 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

// ── StaggeredList — renders children with staggered fade-in ──
interface StaggeredItemProps {
  index: number;
  staggerDelay?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function StaggeredItem({ index, staggerDelay = 60, children, style }: StaggeredItemProps) {
  return (
    <FadeInView delay={index * staggerDelay} duration={350} style={style}>
      {children}
    </FadeInView>
  );
}

// PressableScale was removed: it never invoked onPress and faked press
// detection with touch events. Use ui/AnimatedPressable instead.

// ── AnimatedListItem — standard list-row motion ──────────────
// Springy staggered entrance for the first screenful, immediate entrance for
// rows mounting during scroll, springy layout shifts when neighbours are
// removed, quick fade on exit. Under reduced motion rows render statically.
interface AnimatedListItemProps {
  index?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedListItem({ index = 0, children, style }: AnimatedListItemProps) {
  const motionEnabled = useMotionEnabled();

  if (!motionEnabled) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(staggerDelay(index))
        .springify()
        .damping(springs.gentle.damping)
        .stiffness(springs.gentle.stiffness)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition.springify()
        .damping(springs.gentle.damping)
        .stiffness(springs.gentle.stiffness)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
