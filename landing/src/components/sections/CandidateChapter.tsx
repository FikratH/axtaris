import { AnchorLink } from "@/components/AnchorLink";
import { DocHeader, DocSheet, PipelineRow } from "@/components/doc/primitives";
import { SECTION_IDS } from "@/lib/anchors";
import type { Dictionary } from "@/content";

export function CandidateChapter({ dict }: { dict: Dictionary }) {
  return (
    <section
      id={SECTION_IDS.candidates}
      aria-labelledby="candidate-title"
      className="border-t border-brand-500/25"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:py-24">
        <div className="lg:sticky lg:top-24">
          <h2
            id="candidate-title"
            className="display text-[length:var(--text-chapter)] text-brand-50"
          >
            {dict.candidate.h2}
          </h2>
          <p className="mt-4 max-w-[44ch] text-[1.0625rem] leading-relaxed text-brand-200">
            {dict.candidate.intro}
          </p>
          <AnchorLink
            href={`#${SECTION_IDS.join}`}
            className="mt-8 inline-flex min-h-12 items-center rounded-[2px] bg-carbon-600 px-7 text-base font-semibold text-cover-950 no-underline shadow-[0_2px_0_0_var(--carbon-700)] transition-colors hover:bg-carbon-500"
          >
            {dict.candidate.cta}
          </AnchorLink>
        </div>

        <DocSheet className="p-6 sm:p-8">
          <DocHeader title={dict.nav.candidates} />
          <div className="flex flex-col">
            {dict.candidate.features.map((feature, i) => (
              <article
                key={feature.title}
                className={i > 0 ? "rule-b border-t-0 pt-5 pb-5" : "rule-b pb-5"}
              >
                <h3 className="text-[1.125rem] leading-snug font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-1.5 max-w-[58ch] text-[0.9375rem] leading-relaxed text-ink-soft">
                  {feature.desc}
                </p>
              </article>
            ))}
          </div>
          <div className="pt-5">
            <PipelineRow
              label={dict.candidate.pipelineLabel}
              steps={dict.candidate.pipeline}
              activeIndex={2}
            />
          </div>
        </DocSheet>
      </div>
    </section>
  );
}
