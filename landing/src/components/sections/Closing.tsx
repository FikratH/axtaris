import { CarbonArrival } from "@/components/motion/CarbonArrival";
import { WaitlistForm } from "@/components/WaitlistForm";
import { DocSheet } from "@/components/doc/primitives";
import { SECTION_IDS } from "@/lib/anchors";
import { distribution, site } from "@/config/site";
import type { Dictionary, Locale } from "@/content";

export function Closing({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const storeLinks = [distribution.appStore, distribution.googlePlay];

  return (
    <section
      id={SECTION_IDS.join}
      aria-labelledby="closing-title"
      className="border-t border-brand-500/25"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <CarbonArrival className="mx-auto max-w-3xl">
          <DocSheet className="perf-x p-6 pt-8 sm:p-10 sm:pt-12">
            <h2
              id="closing-title"
              className="display text-[length:var(--text-chapter)] text-ink"
            >
              {dict.closing.h2}
            </h2>
            <p className="mt-4 max-w-[54ch] text-[1.0625rem] leading-relaxed text-ink-soft">
              {dict.closing.intro}
            </p>

            <WaitlistForm form={dict.closing.form} locale={locale} />

            <ul className="mt-8 flex flex-col gap-px overflow-hidden border border-sheet-line bg-sheet-line sm:flex-row">
              {dict.closing.stores.map((store, i) => {
                const url = storeLinks[i];
                return (
                  <li
                    key={store.name}
                    className="flex flex-1 items-baseline justify-between gap-3 bg-sheet px-4 py-3"
                  >
                    <span className="font-medium text-ink">{store.name}</span>
                    {url ? (
                      <a
                        href={url}
                        className="doc-label-sm text-carbon-800 underline decoration-carbon-800/40 underline-offset-4 hover:decoration-carbon-800"
                      >
                        {store.name}
                      </a>
                    ) : (
                      <span className="doc-label-sm text-ink-soft">
                        {store.status}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="doc-note mt-6 text-ink-soft">
              {dict.closing.directLabel}{" "}
              <a
                href={`mailto:${site.supportEmail}`}
                className="font-bold text-carbon-800 underline decoration-carbon-800/40 underline-offset-4 hover:decoration-carbon-800"
              >
                {site.supportEmail}
              </a>
            </p>
          </DocSheet>
        </CarbonArrival>
      </div>
    </section>
  );
}
