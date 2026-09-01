import { Easing, useReducedMotion } from 'react-native-reanimated';
import { duration } from './spacing';

// ── AxtarIS motion vocabulary ────────────────────────────────
// One shared set of springs/durations/easings so every animation in the app
// speaks with the same voice. Values are canonized from the best motion
// already shipped (Button press, save-button pop, onboarding progress).

/** Springs, by intent — not by screen. */
export const springs = {
  /** Press feedback and small state flips. Tight, no visible oscillation. */
  snappy: { damping: 15, stiffness: 300 },
  /** Playful pops: bookmark, badges, celebration elements. One overshoot. */
  bouncy: { damping: 9, stiffness: 260 },
  /** Larger surfaces settling: sheets, progress fills, layout shifts. */
  gentle: { damping: 18, stiffness: 150 },
} as const;

/** Durations re-exported from the theme so motion code has one import. */
export { duration };

export const easings = {
  /** Confident arrival — fast start, long soft landing. */
  out: Easing.out(Easing.exp),
  /** Symmetric move between two on-screen positions. */
  inOut: Easing.inOut(Easing.cubic),
  /** Exits — accelerate away. */
  in: Easing.in(Easing.cubic),
} as const;

/** List entrance stagger. Delay is capped so long lists never feel slow. */
export const stagger = {
  interval: 60,
  maxIndex: 8,
} as const;

/**
 * Delay for the i-th list item entrance. Only the first screenful staggers;
 * items mounting later (windowed lists during scroll) enter immediately so
 * scrolling never feels delayed.
 */
export function staggerDelay(index: number): number {
  'worklet';
  return index < stagger.maxIndex ? index * stagger.interval : 0;
}

/**
 * Reduced-motion gate. Components with nonessential motion (entrances,
 * celebrations, shimmer sweeps) should degrade to opacity-only or static
 * when this is true; feedback that confirms an action stays legible.
 */
export function useMotionEnabled(): boolean {
  return !useReducedMotion();
}
