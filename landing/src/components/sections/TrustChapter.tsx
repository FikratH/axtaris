import { CarbonArrival } from "@/components/motion/CarbonArrival";
import { DocSheet } from "@/components/doc/primitives";
import type { Dictionary } from "@/content";
import { cn } from "@/lib/utils";

export function TrustChapter({ dict }: { dict: Dictionary }) {
  return (
    <section
      aria-labelledby="trust-title"
      className="border-t border-brand-500/25"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:py-24">
        <div>
          <h2
            id="trust-title"
            className="display text-[length:var(--text-chapter)] text-brand-50"
          >
            {dict.trust.h2}
          </h2>
          <p className="mt-4 max-w-[44ch] text-[1.0625rem] leading-relaxed text-brand-200">
            {dict.trust.intro}
          </p>
          <dl className="mt-8 flex flex-col gap-5">
            {dict.trust.points.map((point) => (
              <div
                key={point.title}
                className="border-l-[1px] border-carbon-500/70 pl-4"
              >
                <dt className="font-semibold text-brand-50">{point.title}</dt>
                <dd className="mt-1 max-w-[52ch] text-[0.9375rem] leading-relaxed text-brand-200">
                  {point.desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <CarbonArrival>
          <DocSheet className="p-6 sm:p-8">
            <p className="doc-label mb-4 border-b border-ink/60 pb-2 font-bold text-ink">
              {dict.trust.langDemoLabel}
            </p>
            <ul className="flex flex-col">
              {/* below sm the value drops to its own full-width line so
                  narrow phones don't crush the three-column row */}
              {dict.trust.langDemo.map((row, i) => (
                <li
                  key={row.locale}
                  lang={row.locale.toLowerCase()}
                  className={cn(
                    "rule-b grid grid-cols-[2.5rem_1fr] items-baseline gap-x-3 gap-y-1 pb-3 sm:grid-cols-[3rem_8.5rem_1fr]",
                    i > 0 && "pt-3",
                  )}
                >
                  <span className="doc-label-sm border border-sheet-line px-1.5 py-0.5 text-center text-ink-soft">
                    {row.locale}
                  </span>
                  <span className="doc-label-sm text-ink-soft">
                    {row.label}
                  </span>
                  <span className="fill-line col-span-2 pb-1 text-[0.9375rem] font-medium text-ink sm:col-span-1">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </DocSheet>
        </CarbonArrival>
      </div>
    </section>
  );
}
