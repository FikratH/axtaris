"use client";

import { useMotion } from "@/components/motion/MotionProvider";
import { cn } from "@/lib/utils";

/**
 * In-page anchor that routes through Lenis when smooth scrolling is active,
 * and falls back to native behavior everywhere else.
 */
export function AnchorLink({
  href,
  className,
  children,
  onNavigate,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  onNavigate?: () => void;
}) {
  const { lenisRef } = useMotion();

  return (
    <a
      href={href}
      className={cn(className)}
      onClick={(e) => {
        onNavigate?.();
        const lenis = lenisRef.current;
        if (lenis && href.startsWith("#")) {
          e.preventDefault();
          lenis.scrollTo(href, { offset: -80 });
          history.pushState(null, "", href);
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}
