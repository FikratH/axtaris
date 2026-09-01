"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMotion } from "@/components/motion/MotionProvider";

gsap.registerPlugin(ScrollTrigger);

/**
 * Shared document entrance for the back-half chapters: one light arrival
 * along the file's diagonal (down-left to resting place), the same move
 * the employer chapter's carbon copy makes. Sections stay server-rendered;
 * this thin client wrapper only animates. Under prefers-reduced-motion the
 * children render in their final composition, untouched.
 */
export function CarbonArrival({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { motionOK } = useMotion();

  useGSAP(
    () => {
      if (!motionOK || !root.current) return;
      gsap.from(root.current, {
        x: -56,
        y: 56,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 82%" },
      });
    },
    { scope: root, dependencies: [motionOK] },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
