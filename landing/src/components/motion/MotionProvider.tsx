"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(callback: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

interface MotionContextValue {
  /** false until hydration and under prefers-reduced-motion */
  motionOK: boolean;
  lenisRef: RefObject<Lenis | null>;
}

const MotionContext = createContext<MotionContextValue>({
  motionOK: false,
  lenisRef: { current: null },
});

export function useMotion() {
  return useContext(MotionContext);
}

/**
 * Owns the page's single motion policy:
 * - respects prefers-reduced-motion (no GSAP, no Lenis);
 * - Lenis smooth scrolling on fine-pointer (desktop) devices only —
 *   touch keeps native scrolling;
 * - drives ScrollTrigger from the Lenis raf when active.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const motionOK = useSyncExternalStore(
    subscribeReduced,
    () => !window.matchMedia(REDUCED).matches,
    () => false,
  );
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!motionOK) return;
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (!finePointer) return;

    const instance = new Lenis({
      duration: 1.05,
      smoothWheel: true,
    });
    lenisRef.current = instance;

    instance.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      lenisRef.current = null;
    };
  }, [motionOK]);

  const value = useMemo(() => ({ motionOK, lenisRef }), [motionOK]);

  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}
