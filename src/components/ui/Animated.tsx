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
} from 'react-native-reanimated';

// ── Re-export common layout animations for direct use ────────
export { FadeIn, FadeInDown, FadeInUp, FadeOut, SlideInRight, SlideOutLeft, Layout };

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

// ── PressableScale — scale down on press, spring back ────────
interface PressableScaleProps {
  onPress?: () => void;
  disabled?: boolean;
  scaleValue?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function PressableScale({
  onPress,
  disabled,
  scaleValue = 0.97,
  children,
  style,
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Animated.View
        onTouchStart={disabled ? undefined : handlePressIn}
        onTouchEnd={disabled ? undefined : handlePressOut}
        onTouchCancel={disabled ? undefined : handlePressOut}
      >
        {typeof onPress === 'function' ? (
          <Animated.View>{children}</Animated.View>
        ) : (
          children
        )}
      </Animated.View>
    </Animated.View>
  );
}
