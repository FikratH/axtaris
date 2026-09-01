"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AnchorLink } from "@/components/AnchorLink";
import { useMotion } from "@/components/motion/MotionProvider";
import { DocHeader, DocSheet, FieldRow } from "@/components/doc/primitives";
import { stampCtaClass } from "@/components/ui/stamp-cta";
import { SECTION_IDS } from "@/lib/anchors";
import type { Dictionary } from "@/content";

export function Hero({ dict }: { dict: Dictionary }) {
  const root = useRef<HTMLElement>(null);
  const { motionOK } = useMotion();

  useGSAP(
    () => {
      if (!motionOK) return;
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from("[data-hero-route]", {
        strokeDashoffset: 1400,
        duration: 1.6,
        ease: "power2.out",
      })
        .from(
          "[data-hero-line]",
          { x: -28, y: 28, opacity: 0, duration: 0.9, stagger: 0.09 },
          0.15,
        )
        .from(
          "[data-hero-carbon]",
          { x: -72, y: 72, opacity: 0, duration: 1.1 },
          0.35,
        )
        .from(
          "[data-hero-sheet]",
          { x: -48, y: 48, opacity: 0, duration: 1.1 },
          0.45,
        );
    },
    { scope: root, dependencies: [motionOK] },
  );

  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
    >
      {/* the file's routing line — the arrow's trajectory */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          data-hero-route
          d="M -60 760 Q 420 640 780 360 T 1240 40"
          stroke="var(--brand-500)"
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeDasharray="1400"
          strokeDashoffset="0"
        />
      </svg>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-28">
        <div>
          {/* No data-hero-line: the h1 is the LCP element and must paint
              immediately — the rest of the intro choreographs around it */}
          <h1
            id="hero-title"
            className="display text-[length:var(--text-hero)] text-brand-50"
          >
            {dict.hero.h1}
          </h1>
          <p
            data-hero-line
            className="mt-6 max-w-[46ch] text-[1.0625rem] leading-relaxed text-brand-200"
          >
            {dict.hero.sub}
          </p>
          <div data-hero-line className="mt-9 flex flex-wrap items-center gap-4">
            <AnchorLink
              href={`#${SECTION_IDS.join}`}
              data-waitlist-role="candidate"
              className={stampCtaClass}
            >
              {dict.hero.ctaCandidate}
            </AnchorLink>
            <AnchorLink
              href={`#${SECTION_IDS.employers}`}
              className="flex min-h-12 items-center rounded-[2px] border border-brand-300/70 px-6 text-base font-medium text-brand-100 no-underline transition-colors hover:bg-brand-50/10"
            >
              {dict.hero.ctaEmployer}
            </AnchorLink>
          </div>
          <p
            data-hero-line
            className="doc-note mt-7 flex max-w-[52ch] items-baseline gap-2 text-brand-200"
          >
            <span
              aria-hidden
              className="inline-block size-1.5 shrink-0 rounded-full bg-carbon-400"
            />
            {dict.hero.betaNote}
          </p>
        </div>

        {/* the candidate sheet and its carbon copy */}
        <div
          className="relative mx-auto w-full max-w-md lg:max-w-none"
          role="img"
          aria-label={dict.a11y.heroPreviewAlt}
        >
          {/* the wrapper owns the resting offset and rotation — GSAP writes
              `translate: none` on its targets, so the animated element must
              not carry CSS translate (same split as the match stamp) */}
          <div
            aria-hidden
            className="absolute inset-0 translate-x-2 -translate-y-10 rotate-[1.5deg] sm:translate-x-6 sm:-translate-y-12"
          >
            <div data-hero-carbon className="carbon absolute inset-0 p-3 sm:p-3.5">
              <p className="doc-label-sm text-right leading-none text-carbon-300">
                {dict.hero.carbonNote}
              </p>
            </div>
          </div>
          <DocSheet
            data-hero-sheet
            className="relative rotate-[-1.25deg] shadow-[var(--shadow-sheet-lift)]"
          >
            <DocHeader
              title={dict.hero.sheetTitle}
              annotation={dict.hero.sampleLabel}
            />
            {dict.hero.fields.map((field) => (
              <FieldRow key={field.label} field={field} />
            ))}
            <FieldRow
              field={{ label: dict.hero.matchLabel, value: dict.hero.matchValue }}
              highlight
              className="mt-2"
            />
          </DocSheet>
        </div>
      </div>
    </section>
  );
}
