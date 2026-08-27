"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MoveRight } from "lucide-react";
import { useMotion } from "@/components/motion/MotionProvider";
import { DocHeader, Stamp } from "@/components/doc/primitives";
import { SECTION_IDS } from "@/lib/anchors";
import type { Dictionary, DocField } from "@/content";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/** A field row that can carry a match-highlight bar. */
function MatchRow({
  field,
  tone,
  pair,
}: {
  field: DocField;
  tone: "ink" | "carbon";
  pair?: number;
}) {
  return (
    <div className="relative grid grid-cols-[5.5rem_1fr] items-baseline gap-3 py-2 sm:grid-cols-[6.5rem_1fr]">
      {pair !== undefined && (
        <span
          aria-hidden
          data-pair-bar={pair}
          className={cn(
            "absolute -inset-x-2 inset-y-0 rounded-[2px]",
            tone === "ink" ? "bg-carbon-600/12" : "bg-carbon-400/15",
          )}
        />
      )}
      <span
        className={cn(
          "doc-label-sm relative",
          tone === "ink" ? "text-ink-soft" : "text-carbon-300",
        )}
      >
        {field.label}
      </span>
      <span
        className={cn(
          "fill-line relative pb-1 text-[0.9375rem] leading-snug font-medium",
          tone === "ink" ? "text-ink" : "text-carbon-100",
        )}
      >
        {field.value}
      </span>
    </div>
  );
}

export function MatchSequence({ dict }: { dict: Dictionary }) {
  const root = useRef<HTMLElement>(null);
  const { motionOK } = useMotion();

  useGSAP(
    () => {
      if (!motionOK) return;
      const mm = gsap.matchMedia();

      // Desktop: the pinned, scrubbed meeting of the two documents.
      mm.add("(min-width: 1024px)", () => {
        gsap.set("[data-seq-candidate]", { x: -150, y: 100, rotate: -3.5 });
        gsap.set("[data-seq-vacancy]", { x: 150, y: -80, rotate: 3.5 });
        gsap.set("[data-pair-bar], [data-seq-mark]", { opacity: 0 });
        gsap.set("[data-seq-stamp]", { opacity: 0, scale: 2.4, rotate: -16 });
        gsap.set("[data-seq-chat]", { opacity: 0, y: 70 });

        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: "[data-seq-stage]",
            start: "top 12%",
            end: "+=1500",
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
          },
        });

        tl.to("[data-seq-candidate]", { x: 0, y: 0, rotate: -1, duration: 1 })
          .to("[data-seq-vacancy]", { x: 0, y: 0, rotate: 1, duration: 1 }, "<");
        for (let pair = 1; pair <= 3; pair++) {
          tl.to(`[data-pair-bar="${pair}"]`, { opacity: 1, duration: 0.3 })
            .to(
              `[data-seq-mark="${pair}"]`,
              { opacity: 1, duration: 0.25 },
              "<0.05",
            );
        }
        tl.to("[data-seq-stamp]", {
          opacity: 1,
          scale: 1,
          rotate: -5,
          duration: 0.7,
          ease: "back.out(1.6)",
        }).to("[data-seq-chat]", { opacity: 1, y: 0, duration: 0.8 }, ">-0.1");
      });

      // Smaller screens: one light arrival per element, no pin, no scrub.
      mm.add("(max-width: 1023px)", () => {
        for (const sel of [
          "[data-seq-candidate]",
          "[data-seq-vacancy]",
          "[data-seq-chat]",
        ]) {
          gsap.from(sel, {
            x: -28,
            y: 28,
            opacity: 0,
            duration: 0.8,
            ease: "expo.out",
            scrollTrigger: { trigger: sel, start: "top 88%" },
          });
        }
        gsap.from("[data-seq-stamp]", {
          scale: 1.8,
          opacity: 0,
          duration: 0.5,
          ease: "back.out(1.6)",
          scrollTrigger: { trigger: "[data-seq-stamp]", start: "top 85%" },
        });
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [motionOK] },
  );

  return (
    <section
      ref={root}
      id={SECTION_IDS.how}
      aria-labelledby="match-title"
      className="border-t border-brand-500/25"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <h2
            id="match-title"
            className="display text-[length:var(--text-chapter)] text-brand-50"
          >
            {dict.match.h2}
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-brand-200">
            {dict.match.intro}
          </p>
        </div>

        <ol className="mt-10 grid gap-px overflow-hidden border border-brand-500/30 bg-brand-500/30 sm:grid-cols-3">
          {dict.match.steps.map((step, i) => (
            <li key={step.title} className="bg-cover-950 p-5">
              <p className="doc-label mb-2 flex items-baseline gap-2 text-carbon-300">
                <span className="tabular">0{i + 1}</span>
                {step.title}
              </p>
              <p className="text-[0.9375rem] leading-relaxed text-brand-200">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>

        {/* the desk where the two documents meet */}
        <div
          data-seq-stage
          className="relative mt-12 overflow-hidden border border-brand-500/30 bg-cover-900 p-5 sm:p-8 lg:p-12 lg:pb-64"
        >
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_3rem_1fr] lg:gap-2">
            <div data-seq-candidate className="paper relative p-5 sm:p-6">
              <DocHeader
                title={dict.match.candidateSheetTitle}
                annotation={dict.match.sampleLabel}
              />
              {dict.match.candidateFields.map((field, i) => (
                <MatchRow
                  key={`${field.label}-${i}`}
                  field={field}
                  tone="ink"
                  pair={i >= 1 ? i : undefined}
                />
              ))}
            </div>

            <div
              aria-hidden
              className="hidden flex-col items-center justify-center gap-9 self-stretch pt-24 lg:flex"
            >
              {[1, 2, 3].map((pair) => (
                <span key={pair} data-seq-mark={pair}>
                  <MoveRight
                    aria-hidden
                    strokeWidth={2.25}
                    className="size-5 text-carbon-400"
                  />
                </span>
              ))}
            </div>

            <div data-seq-vacancy className="carbon relative p-5 sm:p-6">
              <DocHeader
                title={dict.match.vacancySheetTitle}
                annotation={dict.match.sampleLabel}
                tone="carbon"
              />
              {dict.match.vacancyFields.map((field, i) => (
                <MatchRow
                  key={`${field.label}-${i}`}
                  field={field}
                  tone="carbon"
                  pair={i >= 1 ? i : undefined}
                />
              ))}
            </div>
          </div>

          {/* outer div owns position (user-pinned: dead center, large);
              GSAP animates only the inner one */}
          <div className="pointer-events-none absolute top-[44%] left-1/2 z-30 hidden -translate-x-1/2 -translate-y-full lg:block">
            <div data-seq-stamp>
              <Stamp
                role="img"
                aria-label={dict.a11y.stampAlt}
                className="text-[2.75rem]"
              >
                {dict.match.stamp}
              </Stamp>
            </div>
          </div>
          <div className="mt-6 flex justify-center lg:hidden">
            <span data-seq-stamp>
              <Stamp role="img" aria-label={dict.a11y.stampAlt}>
                {dict.match.stamp}
              </Stamp>
            </span>
          </div>

          <div
            data-seq-chat
            className="paper relative z-20 mx-auto mt-8 max-w-2xl p-5 sm:p-6 lg:absolute lg:bottom-8 lg:left-1/2 lg:mt-0 lg:w-[min(42rem,calc(100%-6rem))] lg:-translate-x-1/2 lg:shadow-[var(--shadow-sheet-lift)]"
          >
            <DocHeader
              title={dict.match.chatTitle}
              annotation={dict.match.sampleLabel}
            />
            <div className="flex flex-col gap-3">
              <p className="max-w-[85%] self-start rounded-[2px] bg-sheet-shade px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
                {dict.match.chatEmployer}
              </p>
              <p className="max-w-[85%] self-end rounded-[2px] bg-carbon-600/12 px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
                {dict.match.chatCandidate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
