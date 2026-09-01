"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { AnchorLink } from "@/components/AnchorLink";
import { useMotion } from "@/components/motion/MotionProvider";
import { DocHeader, PipelineRow } from "@/components/doc/primitives";
import { SECTION_IDS } from "@/lib/anchors";
import type { Dictionary } from "@/content";

gsap.registerPlugin(ScrollTrigger);

export function EmployerChapter({ dict }: { dict: Dictionary }) {
  const root = useRef<HTMLElement>(null);
  const { motionOK } = useMotion();

  // the one authored moment of this chapter: the carbon copy arrives
  // to the employer along the arrow's trajectory
  useGSAP(
    () => {
      if (!motionOK) return;
      gsap.from("[data-carbon-arrive]", {
        x: -56,
        y: 56,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: "[data-carbon-arrive]", start: "top 82%" },
      });
    },
    { scope: root, dependencies: [motionOK] },
  );

  return (
    <section
      ref={root}
      id={SECTION_IDS.employers}
      aria-labelledby="employer-title"
      className="border-t border-carbon-600/40 bg-[color-mix(in_srgb,var(--carbon-700)_12%,var(--cover-950))]"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:py-24">
        <div className="lg:order-2 lg:sticky lg:top-24">
          <h2
            id="employer-title"
            className="display text-[length:var(--text-chapter)] text-brand-50"
          >
            {dict.employer.h2}
          </h2>
          <p className="mt-4 max-w-[44ch] text-[1.0625rem] leading-relaxed text-carbon-100/90">
            {dict.employer.intro}
          </p>
          <AnchorLink
            href={`#${SECTION_IDS.join}`}
            data-waitlist-role="employer"
            className="mt-8 inline-flex min-h-12 items-center rounded-[2px] border border-carbon-300/80 px-6 text-base font-medium text-carbon-100 no-underline transition-colors hover:bg-carbon-300/10"
          >
            {dict.employer.cta}
          </AnchorLink>
        </div>
        <div
          data-carbon-arrive
          className="carbon p-6 sm:p-8 lg:order-1"
        >
          <DocHeader title={dict.nav.employers} tone="carbon" />
          <div className="flex flex-col">
            {dict.employer.features.map((feature, i) => (
              <article
                key={feature.title}
                className={
                  i > 0
                    ? "border-b border-carbon-300/25 pt-5 pb-5"
                    : "border-b border-carbon-300/25 pb-5"
                }
              >
                <h3 className="text-[1.125rem] leading-snug font-semibold text-carbon-100">
                  {feature.title}
                </h3>
                <p className="mt-1.5 max-w-[58ch] text-[0.9375rem] leading-relaxed text-carbon-300">
                  {feature.desc}
                </p>
              </article>
            ))}
          </div>
          <div className="flex flex-col gap-6 pt-5">
            <PipelineRow
              label={dict.employer.pipelineLabel}
              steps={dict.employer.pipeline}
              tone="carbon"
              activeIndex={1}
            />
            <div>
              <p className="doc-label-sm mb-3 text-carbon-300">
                {dict.employer.statsLabel}
              </p>
              <dl className="tabular">
                {dict.employer.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-baseline gap-3 border-b border-carbon-300/25 py-2.5"
                  >
                    <dt className="doc-label-sm text-carbon-300">{stat.label}</dt>
                    <span
                      aria-hidden
                      className="flex-1 border-b border-dotted border-carbon-300/40"
                    />
                    <dd className="font-[family-name:var(--font-doc)] text-lg leading-none text-carbon-100">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="doc-note mt-2 text-carbon-300">
                {dict.employer.statsNote}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
