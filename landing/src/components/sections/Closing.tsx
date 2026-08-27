import { DocSheet } from "@/components/doc/primitives";
import { SignatureCta } from "@/components/SignatureCta";
import { SECTION_IDS } from "@/lib/anchors";
import { distribution, site } from "@/config/site";
import type { Dictionary } from "@/content";

function mailto(subject: string) {
  return `mailto:${site.supportEmail}?subject=${encodeURIComponent(subject)}`;
}

function SignatureBlock({
  label,
  line,
  cta,
  subject,
  copiedNote,
  directLabel,
  primary,
}: {
  label: string;
  line: string;
  cta: string;
  subject: string;
  copiedNote: string;
  directLabel: string;
  primary?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <p className="doc-label font-bold text-ink">{label}</p>
      <div>
        <p className="fill-line pb-2 text-[1.0625rem] font-medium text-ink">
          {line}
        </p>
      </div>
      <SignatureCta
        href={mailto(subject)}
        email={site.supportEmail}
        cta={cta}
        copiedNote={copiedNote}
        directLabel={directLabel}
        primary={primary}
      />
    </div>
  );
}

export function Closing({ dict }: { dict: Dictionary }) {
  const storeLinks = [distribution.appStore, distribution.googlePlay];

  return (
    <section
      id={SECTION_IDS.join}
      aria-labelledby="closing-title"
      className="border-t border-brand-500/25"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <DocSheet className="perf-x mx-auto max-w-3xl p-6 pt-8 sm:p-10 sm:pt-12">
          <h2
            id="closing-title"
            className="display text-[length:var(--text-chapter)] text-ink"
          >
            {dict.closing.h2}
          </h2>
          <p className="mt-4 max-w-[54ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            {dict.closing.intro}
          </p>

          <div className="mt-10 grid gap-10 border-t border-ink/50 pt-8 sm:grid-cols-2">
            <SignatureBlock
              label={dict.closing.candidateLabel}
              line={dict.closing.candidateLine}
              cta={dict.closing.candidateCta}
              subject={dict.closing.emailSubjectCandidate}
              copiedNote={dict.closing.copied}
              directLabel={dict.closing.directLabel}
              primary
            />
            <SignatureBlock
              label={dict.closing.employerLabel}
              line={dict.closing.employerLine}
              cta={dict.closing.employerCta}
              subject={dict.closing.emailSubjectEmployer}
              copiedNote={dict.closing.copied}
              directLabel={dict.closing.directLabel}
            />
          </div>

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
      </div>
    </section>
  );
}
