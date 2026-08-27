"use client";

import { useEffect, useRef, useState } from "react";
import { MoveUpRight } from "lucide-react";
import { stampCtaClass } from "@/components/ui/stamp-cta";
import { cn } from "@/lib/utils";

type Status = "idle" | "copied" | "manual";

/**
 * The signature-line action. Keeps the real mailto: navigation, but also
 * copies the address on click and confirms it — so the action visibly
 * works even on machines with no configured mail handler. A failed or
 * unavailable clipboard falls back to showing the address itself.
 */
export function SignatureCta({
  href,
  email,
  cta,
  copiedNote,
  directLabel,
  primary = false,
}: {
  href: string;
  email: string;
  cta: string;
  copiedNote: string;
  directLabel: string;
  primary?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const show = (s: Status) => {
    setStatus(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <span className="flex flex-col gap-2">
      <a
        href={href}
        onClick={() => {
          try {
            const p = navigator.clipboard?.writeText(email);
            if (p) {
              p.then(() => show("copied")).catch(() => show("manual"));
            } else {
              show("manual");
            }
          } catch {
            show("manual");
          }
        }}
        className={
          primary
            ? cn(stampCtaClass, "self-start")
            : "inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-[2px] border border-brand-600 px-6 text-base font-medium text-brand-600 no-underline transition-colors hover:bg-brand-600/10"
        }
      >
        {cta}
        {!primary && (
          <MoveUpRight aria-hidden strokeWidth={2} className="size-4" />
        )}
      </a>
      <span
        role="status"
        className={
          "doc-note text-carbon-800 transition-opacity duration-200 " +
          (status !== "idle" ? "opacity-100" : "opacity-0")
        }
      >
        {status === "copied"
          ? `${copiedNote}: ${email}`
          : status === "manual"
            ? `${directLabel} ${email}`
            : " "}
      </span>
    </span>
  );
}
