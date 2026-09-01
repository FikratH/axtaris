import { PencilLine } from "lucide-react";
import { CarbonArrival } from "@/components/motion/CarbonArrival";
import { DocHeader, DocSheet } from "@/components/doc/primitives";
import type { Dictionary } from "@/content";

export function AiChapter({ dict }: { dict: Dictionary }) {
  return (
    <section
      aria-labelledby="ai-title"
      className="border-t border-brand-500/25"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:py-24">
        <div className="lg:sticky lg:top-24">
          <h2
            id="ai-title"
            className="display text-[length:var(--text-chapter)] text-brand-50"
          >
            {dict.ai.h2}
          </h2>
          <p className="mt-4 max-w-[44ch] text-[1.0625rem] leading-relaxed text-brand-200">
            {dict.ai.intro}
          </p>
        </div>

        {/* the assistant writes in the margin, never on the document */}
        <CarbonArrival>
          <DocSheet className="p-6 sm:p-8">
            <DocHeader title="CV" annotation={dict.hero.sampleLabel} />
            <ul className="flex flex-col">
              {dict.ai.notes.map((note, i) => (
                <li
                  key={i}
                  className={
                    i > 0
                      ? "rule-b flex items-start gap-3 pt-4 pb-4"
                      : "rule-b flex items-start gap-3 pb-4"
                  }
                >
                  <PencilLine
                    aria-hidden
                    strokeWidth={1.75}
                    className="mt-1 size-4 shrink-0 text-carbon-800"
                  />
                  <p className="max-w-[58ch] text-[0.9375rem] leading-relaxed text-carbon-800">
                    {note}
                  </p>
                </li>
              ))}
            </ul>
            <p className="doc-label mt-5 text-ink-soft">{dict.ai.boundary}</p>
          </DocSheet>
        </CarbonArrival>
      </div>
    </section>
  );
}
