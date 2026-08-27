import { DocSheet } from "@/components/doc/primitives";
import type { Dictionary } from "@/content";

/** The inquiry sheet — honest Q&A in the file's own ruled grammar. */
export function FaqChapter({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="sual-cavab"
      aria-labelledby="faq-title"
      className="border-t border-brand-500/25"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:py-24">
        <div className="lg:sticky lg:top-24">
          <h2
            id="faq-title"
            className="display text-[length:var(--text-chapter)] text-brand-50"
          >
            {dict.faq.h2}
          </h2>
          <p className="mt-4 max-w-[44ch] text-[1.0625rem] leading-relaxed text-brand-200">
            {dict.faq.intro}
          </p>
        </div>

        <DocSheet className="p-6 sm:p-8">
          <dl className="flex flex-col">
            {dict.faq.items.map((item, i) => (
              <div
                key={item.q}
                className={
                  i > 0 ? "rule-b pt-5 pb-5" : "rule-b pb-5"
                }
              >
                <dt className="text-[1.125rem] leading-snug font-semibold text-ink">
                  {item.q}
                </dt>
                <dd className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed text-ink-soft">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </DocSheet>
      </div>
    </section>
  );
}
